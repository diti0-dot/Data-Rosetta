import os
import time
import pandas as pd
from dotenv import load_dotenv
from cloudflare import Cloudflare

load_dotenv(r"C:\Users\deepz\data_r\backend\.env")

token = os.getenv("CLOUDFLARE_API_TOKEN")

client = Cloudflare(
    api_token=os.environ.get("CLOUDFLARE_API_TOKEN")
)

OUTPUT_FILE = "trending_domains_europe.csv"

DATES = ["2026-11-12", "2026-11-13"]
european_countries = [
    "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI",
    "FR", "DE", "GR", "HU", "IS", "IE", "IT", "XK", "LV", "LI", "LT", "LU", "MT",
    "MD", "MC", "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK",
    "SI", "ES", "SE", "CH", "TR", "UA", "GB", "VA",
]

rows = []


for index, country in enumerate(european_countries, start=1):

    for requested_date in DATES:

        try:
            response = client.radar.ranking.top(
                date=[requested_date],
                location=[country],
                ranking_type="TRENDING_RISE",
                limit=10,
            )

            payload = response.model_dump()
            result = payload.get("result", payload)

            meta = result.get("meta", {})
            domains = result.get("top_0", [])

            series_date = (
                meta.get("top_0", {}).get("date")
                or requested_date
            )

            last_updated = (
                meta.get("last_updated")
                or meta.get("lastUpdated")
            )

            country_rows = 0

            for entry in domains:

                categories = entry.get("categories") or []

                category = (
                    categories[0].get("name")
                    if categories
                    else None
                )

                rows.append({
                    "country_code": country,
                    "date": series_date,
                    "rank": entry.get("rank"),
                    "domain": entry.get("domain"),
                    "category": category,
                    "pct_rank_change": entry.get(
                        "pct_rank_change",
                        entry.get("pctRankChange")
                    ),
                    "last_updated": last_updated,
                })

                country_rows += 1

            print(
                f"Collected {country_rows} domains "
                f"for {country} on {series_date}"
            )

            if domains:
                print(
                    "Top domain:",
                    domains[0].get("domain")
                )

        except Exception as e:
            print(
                f"Error for {country} on "
                f"{requested_date}: {e}"
            )

        time.sleep(0.3)


if rows:

    df = pd.DataFrame(rows)

    df.to_csv(
        OUTPUT_FILE,
        index=False,
        encoding="utf-8-sig"
    )

 
    print("DATA COLLECTION COMPLETED")

else:
    print("No data collected. CSV was not overwritten.")
