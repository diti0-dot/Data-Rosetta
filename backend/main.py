import io
import logging
import os
from collections.abc import Callable
from pathlib import PurePath
from typing import Any
from functools import partial

import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from analyze import get_ai_enrichment

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 50 * 1024 * 1024
SAMPLE_VALUE_COUNT = 5

# Maps each supported extension to the pandas reader that parses it.
READERS: dict[str, Callable[[io.BytesIO], pd.DataFrame]] = {
    "csv": pd.read_csv,
    "tsv": partial(pd.read_csv, sep="\t"),
    "xlsx": pd.read_excel,
    "xls": pd.read_excel,
    "json": pd.read_json,
    "parquet": pd.read_parquet,
}

AI_FAILURE_MESSAGE = "AI enrichment failed unexpectedly."

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://data-rosetta.vercel.app/",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Welcome to FastAPI backend!"}


def get_extension(filename: str | None) -> str:
    # PurePath handles names with several dots, such as "report.v2.csv".
    return PurePath(filename or "").suffix.lstrip(".").lower()


async def read_upload_bytes(upload: UploadFile) -> bytes:
    # UploadFile.size can be None, so check it only when it is available.
    declared_size = getattr(upload, "size", None)
    if declared_size is not None and declared_size > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File too large. Max 50 MB.")

    contents = await upload.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File too large. Max 50 MB.")
    return contents


def parse_dataframe(contents: bytes, extension: str) -> pd.DataFrame:
    reader = READERS[extension]
    try:
        return reader(io.BytesIO(contents))
    except Exception as exc:
        logger.info("Could not parse %s upload: %s", extension, exc)
        raise HTTPException(
            400, "Could not read the file. Check that it is valid and matches its extension."
        ) from exc


def format_extreme(value: Any) -> str | None:
    return None if pd.isna(value) else str(value)


def profile_column(name: Any, series: pd.Series) -> dict[str, Any]:
    row_count = len(series)
    non_null = series.dropna()
    is_numeric = pd.api.types.is_numeric_dtype(series)

    # An empty column would give NaN here, which is not valid JSON.
    null_percent = round(float(series.isna().mean()) * 100, 2) if row_count else 0.0

    has_extremes = is_numeric and not non_null.empty
    return {
        "name": str(name),
        "inferred_type": str(series.dtype),
        "null_percent": null_percent,
        "unique_count": int(series.nunique()),
        "min": format_extreme(series.min()) if has_extremes else None,
        "max": format_extreme(series.max()) if has_extremes else None,
        "sample_values": non_null.head(SAMPLE_VALUE_COUNT).astype(str).tolist(),
    }


def build_profile(df: pd.DataFrame) -> list[dict[str, Any]]:
    # Read columns by position so duplicate column names don't return a DataFrame.
    return [
        profile_column(name, df.iloc[:, position])
        for position, name in enumerate(df.columns)
    ]


def ai_failure_result() -> dict[str, Any]:
    return {
        "domain": None,
        "domain_review": None,
        "column_descriptions": {},
        "resources": [],
        "experts": [],
        "ai_failed": True,
        "ai_error": AI_FAILURE_MESSAGE,
    }


async def enrich_with_ai(df: pd.DataFrame, filename: str, profile: list[dict[str, Any]]) -> dict[str, Any]:
    # AI enrichment is optional. If it fails, the profile is still returned.
    try:
        result = await get_ai_enrichment(df, filename, profile)
    except Exception:
        logger.exception("AI enrichment failed for %s", filename)
        return ai_failure_result()

    if not isinstance(result, dict):
        logger.error("AI enrichment returned %s instead of a dict", type(result).__name__)
        return ai_failure_result()
    return result


@app.post("/uploadfile")
async def upload_file(file_upload: UploadFile) -> dict[str, Any]:
    filename = file_upload.filename or "unnamed"
    extension = get_extension(file_upload.filename)

    if extension not in READERS:
        raise HTTPException(400, "Unsupported file type")

    contents = await read_upload_bytes(file_upload)
    df = parse_dataframe(contents, extension)
    profile = build_profile(df)
    ai_result = await enrich_with_ai(df, filename, profile)

    descriptions = ai_result.get("column_descriptions") or {}
    for column in profile:
        column["description"] = descriptions.get(column["name"], "")

    return {
        "file_name": filename,
        "row_count_sampled": len(df),
        "column_count": len(df.columns),
        "profile": profile,
        "domain": ai_result.get("domain"),
        "domain_review": ai_result.get("domain_review"),
        "resources": ai_result.get("resources") or [],
        "experts": ai_result.get("experts") or [],
        "ai_failed": ai_result.get("ai_failed", False),
        "ai_error": ai_result.get("ai_error"),
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
