import json
import logging
import os
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_TEMPERATURE = 0.4
GEMINI_MAX_OUTPUT_TOKENS = 8192
SAMPLE_PREVIEW_COUNT = 3
SAMPLE_PREVIEW_CHARS = 80

NOT_CONFIGURED_MESSAGE = "AI enrichment is not configured."
ALL_MODELS_FAILED_MESSAGE = "AI enrichment is unavailable right now. Please try again in a moment."

# Models are tried in order, so put the preferred model first in the MODELS env var.
MODELS = [model.strip() for model in os.getenv("MODELS", "").split(",") if model.strip()]

PROMPT_TEMPLATE = """You are a senior data steward. Analyse this dataset and return ONLY valid JSON.

File: {file_name}
Total rows: {row_count}
Columns:
{column_summary}

Return JSON matching this exact schema:
{{
  "domain": "single short domain label",
  "domain_review": "2-3 sentence overview",
  "column_descriptions": {{"column_name": "one clear sentence"}},
  "resources": [
    {{"title": "...", "type": "blog|paper|video|standard|book|doc", "summary": "one sentence"}}
  ],
  "experts": [
    {{"name": "...", "role": "...", "expertise": "one sentence"}}
  ]
}}

Requirements:
- AT LEAST 5 resources with specific real titles.
- AT LEAST 3 real, well-known experts. Do not invent fictional people.
- Every column must have a description.
- No URLs.
- Return ONLY the JSON object. No markdown fences."""

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    # Created on first use, so importing this module doesn't fail when the key is missing.
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set.")
        _client = genai.Client(api_key=api_key)
    return _client


def _shorten(text: str) -> str:
    if len(text) <= SAMPLE_PREVIEW_CHARS:
        return text
    return text[:SAMPLE_PREVIEW_CHARS] + "…"


def _format_column_summary(profile_columns: list[dict[str, Any]]) -> str:
    lines = []
    for column in profile_columns:
        samples = [
            _shorten(str(value))
            for value in column.get("sample_values", [])[:SAMPLE_PREVIEW_COUNT]
        ]
        lines.append(
            f"- {column['name']} (type: {column['inferred_type']}, "
            f"nulls: {column['null_percent']}%, samples: {samples})"
        )
    return "\n".join(lines)


def _parse_json_response(text: str | None) -> dict[str, Any]:
    if not text or not text.strip():
        raise ValueError("Gemini returned an empty response.")

    cleaned = text.strip()
    # Models sometimes wrap JSON in a fence even when told not to.
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").removeprefix("json").strip()

    result = json.loads(cleaned)
    if not isinstance(result, dict):
        raise ValueError("Gemini returned JSON that is not an object.")
    return result


async def _call_model(model: str, prompt: str) -> dict[str, Any]:
    response = await _get_client().aio.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=GEMINI_TEMPERATURE,
            max_output_tokens=GEMINI_MAX_OUTPUT_TOKENS,
        ),
    )
    return _parse_json_response(response.text)


def _failure_result(message: str) -> dict[str, Any]:
    return {
        "domain": None,
        "domain_review": None,
        "column_descriptions": {},
        "resources": [],
        "experts": [],
        "ai_failed": True,
        "ai_error": message,
    }


async def get_ai_enrichment(
    df, file_name: str, profile_columns: list[dict[str, Any]]
) -> dict[str, Any]:
    if not MODELS:
        logger.error("No Gemini models configured. Set MODELS in the environment.")
        return _failure_result(NOT_CONFIGURED_MESSAGE)

    prompt = PROMPT_TEMPLATE.format(
        file_name=file_name,
        row_count=len(df),
        column_summary=_format_column_summary(profile_columns),
    )

    for model in MODELS:
        try:
            result = await _call_model(model, prompt)
        except genai_errors.APIError as exc:
            # Covers busy (5xx) and rate-limit (429) responses. Try the next model.
            logger.warning("Gemini model %s returned an API error: %s", model, exc)
        except ValueError as exc:
            # json.JSONDecodeError is a subclass of ValueError.
            logger.warning("Gemini model %s returned unusable output: %s", model, exc)
        except Exception:
            logger.exception("Gemini model %s failed", model)
        else:
            logger.info("AI enrichment succeeded with %s", model)
            result["model_used"] = model
            return result

    logger.error("All Gemini models failed: %s", ", ".join(MODELS))
    return _failure_result(ALL_MODELS_FAILED_MESSAGE)