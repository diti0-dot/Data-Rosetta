
import json
import pandas as pd
import plotly.graph_objects as go
import pycountry
from pathlib import Path

# --------------------------------------------------
# 1. LOAD DATA
# --------------------------------------------------

CSV_PATH = Path(
    "backend/data_stories/microsoft_outage_2026/"
    "trending_domains_europe.csv"
)

OUTPUT_PATH = Path("map.html")

df = pd.read_csv(CSV_PATH)

df["date"] = df["date"].astype(str)
df["rank"] = pd.to_numeric(df["rank"], errors="coerce")
df["pct_rank_change"] = pd.to_numeric(
    df["pct_rank_change"], errors="coerce"
)

DATES = sorted(df["date"].dropna().unique().tolist())

# Convert ISO-2 country codes to ISO-3
def to_iso3(code):
    country = pycountry.countries.get(alpha_2=code)
    return country.alpha_3 if country else None

df["iso3"] = df["country_code"].apply(to_iso3)
df = df.dropna(subset=["iso3"])

# --------------------------------------------------
# 2. PREPARE CATEGORY COLOURS
# --------------------------------------------------

categories = sorted(df["category"].dropna().unique())

palette = [
    "#2563eb", "#16a34a", "#ea580c", "#9333ea",
    "#0891b2", "#dc2626", "#ca8a04", "#db2777",
    "#4f46e5", "#0d9488", "#64748b", "#a855f7",
    "#65a30d", "#c2410c", "#0284c7"
]

category_colors = {
    category: palette[i % len(palette)]
    for i, category in enumerate(categories)
}

category_index = {
    category: i for i, category in enumerate(categories)
}

# --------------------------------------------------
# 3. PREPARE DATA FOR JAVASCRIPT
# --------------------------------------------------

country_data = {}

for date in DATES:
    date_df = df[df["date"] == date]

    country_data[date] = {}

    for country_code, group in date_df.groupby("country_code"):
        group = group.sort_values("rank")

        iso3 = group["iso3"].iloc[0]

        domains = group[
            [
                "rank",
                "domain",
                "category",
                "pct_rank_change"
            ]
        ].fillna("").to_dict("records")

        top = group.iloc[0]

        country_data[date][iso3] = {
            "country_code": country_code,
            "country_name": (
                pycountry.countries.get(alpha_2=country_code).name
            ),
            "top_domain": top["domain"],
            "top_category": top["category"],
            "pct_rank_change": top["pct_rank_change"],
            "category_index": category_index.get(
                top["category"], 0
            ),
            "domains": domains
        }

# --------------------------------------------------
# 4. CREATE INITIAL MAP
# --------------------------------------------------

initial_date = DATES[-1]
initial_data = country_data[initial_date]

locations = list(initial_data.keys())

z_values = [
    initial_data[c]["category_index"]
    for c in locations
]

labels = [
    f'{initial_data[c]["top_domain"]}<br>'
    f'({initial_data[c]["top_category"]})'
    for c in locations
]

customdata = [
    [
        initial_data[c]["country_name"],
        initial_data[c]["top_domain"],
        initial_data[c]["top_category"],
        initial_data[c]["pct_rank_change"]
    ]
    for c in locations
]

# Build a discrete colourscale
n = max(len(categories), 1)
colorscale = []

for i, category in enumerate(categories):
    start = i / n
    end = (i + 1) / n

    color = category_colors[category]

    colorscale.append([start, color])
    colorscale.append([end, color])

fig = go.Figure(
    go.Choropleth(
        locations=locations,
        z=z_values,
        locationmode="ISO-3",
        colorscale=colorscale,
        zmin=0,
        zmax=max(len(categories) - 1, 1),
        showscale=False,
        text=labels,
        customdata=customdata,
        marker_line_color="white",
        marker_line_width=0.7,
        hovertemplate=(
            "<b>%{customdata[0]}</b><br>"
            "Top domain: %{customdata[1]}<br>"
            "Category: %{customdata[2]}<br>"
            "Rank change: %{customdata[3]:.2f}%"
            "<extra></extra>"
        )
    )
)

fig.update_layout(
    title={
        "text": "The Great Digital Escape",
        "x": 0.5,
        "xanchor": "center"
    },
    geo=dict(
        scope="europe",
        showland=True,
        landcolor="#e8edf3",
        showocean=True,
        oceancolor="#f8fafc",
        showcountries=True,
        countrycolor="white",
        projection_type="mercator"
    ),
    margin=dict(l=0, r=0, t=75, b=10),
    paper_bgcolor="#ffffff",
    font=dict(
        family="Arial",
        color="#1e293b"
    ),
    height=650
)

# --------------------------------------------------
# 5. BUILD INTERACTIVE HTML
# --------------------------------------------------

fig_html = fig.to_html(
    full_html=False,
    include_plotlyjs="cdn",
    div_id="europe-map"
)

data_json = json.dumps(country_data, ensure_ascii=False)
categories_json = json.dumps(category_colors)

html = """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>The Great Digital Escape</title>

<style>
body {
    margin: 0;
    padding: 25px;
    background: #f1f5f9;
    font-family: Arial, sans-serif;
    color: #1e293b;
}

.container {
    max-width: 1500px;
    margin: auto;
}

.header {
    margin-bottom: 20px;
}

.header h1 {
    margin-bottom: 5px;
    font-size: 30px;
}

.header p {
    color: #64748b;
}

.controls {
    display: flex;
    gap: 15px;
    align-items: center;
    margin-bottom: 15px;
}

select {
    padding: 10px 15px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: white;
    font-size: 14px;
}

.layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 18px;
    align-items: start;
}

.map-card, .details-card {
    background: white;
    border-radius: 14px;
    padding: 15px;
    box-shadow: 0 2px 12px #0f172a0d;
}

.details-card {
    max-height: 680px;
    overflow-y: auto;
}

.details-card h2 {
    font-size: 19px;
    margin-top: 5px;
}

.hint {
    color: #64748b;
    font-size: 13px;
}

.domain-item {
    padding: 12px 0;
    border-bottom: 1px solid #e2e8f0;
}

.domain-name {
    font-weight: 600;
    overflow-wrap: anywhere;
}

.domain-meta {
    color: #64748b;
    font-size: 12px;
    margin-top: 5px;
}

.rank {
    color: #2563eb;
    font-weight: bold;
    margin-right: 7px;
}

.category {
    display: inline-block;
    background: #eff6ff;
    color: #1d4ed8;
    padding: 4px 7px;
    border-radius: 5px;
    font-size: 11px;
    margin-top: 5px;
}

.legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-top: 12px;
    font-size: 12px;
}

.legend-item {
    display: flex;
    gap: 5px;
    align-items: center;
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
}

@media(max-width: 900px) {
    .layout {
        grid-template-columns: 1fr;
    }
}
</style>
</head>

<body>
<div class="container">

    <div class="header">
        <h1>The Great Digital Escape</h1>
        <p>Where is the internet's attention moving?</p>
    </div>

    <div class="controls">
        <label for="dateSelect"><b>Select date:</b></label>
        <select id="dateSelect"></select>
        <span class="hint">Select a country to explore its top 10 domains.</span>
    </div>

    <div class="layout">
        <div class="map-card">
            MAP_PLACEHOLDER
            <div id="legend" class="legend"></div>
        </div>

        <div class="details-card" id="details">
            <h2>Explore a country</h2>
            <p class="hint">
                Click any country on the map to see its trending domains.
            </p>
        </div>
    </div>
</div>

<script>
const countryData = DATA_PLACEHOLDER;
const categoryColors = COLORS_PLACEHOLDER;

const dates = Object.keys(countryData).sort();
const selector = document.getElementById("dateSelect");

dates.forEach(date => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = new Date(date + "T00:00:00")
        .toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    selector.appendChild(option);
});

let currentDate = dates[dates.length - 1];
selector.value = currentDate;

const map = document.getElementById("europe-map");

function renderLegend() {
    const legend = document.getElementById("legend");
    legend.innerHTML = "";

    Object.entries(categoryColors).forEach(([category, color]) => {
        const item = document.createElement("div");
        item.className = "legend-item";

        const dot = document.createElement("span");
        dot.className = "dot";
        dot.style.background = color;

        const label = document.createElement("span");
        label.textContent = category;

        item.append(dot, label);
        legend.appendChild(item);
    });
}

function updateMap(date) {
    currentDate = date;

    const data = countryData[date];
    const locations = Object.keys(data);

    const z = locations.map(
        c => data[c].category_index
    );

    const text = locations.map(
        c => data[c].top_domain +
             "<br>(" + data[c].top_category + ")"
    );

    const customdata = locations.map(c => [
        data[c].country_name,
        data[c].top_domain,
        data[c].top_category,
        data[c].pct_rank_change
    ]);

    Plotly.restyle(map, {
        locations: [locations],
        z: [z],
        text: [text],
        customdata: [customdata]
    }, [0]);

    document.getElementById("details").innerHTML = `
        <h2>Explore a country</h2>
        <p class="hint">
            Click a country on the map to see its top domains.
        </p>
    `;
}

selector.addEventListener("change", e => {
    updateMap(e.target.value);
});

map.on("plotly_click", function(event) {
    const iso3 = event.points[0].location;
    const country = countryData[currentDate][iso3];

    if (!country) return;

    const panel = document.getElementById("details");

    panel.innerHTML = "";

    const heading = document.createElement("h2");
    heading.textContent = country.country_name;

    const subtitle = document.createElement("p");
    subtitle.className = "hint";
    subtitle.textContent =
        "Trending domains · " + currentDate;

    panel.append(heading, subtitle);

    country.domains.forEach(domain => {
        const item = document.createElement("div");
        item.className = "domain-item";

        const name = document.createElement("div");
        name.className = "domain-name";

        const rank = document.createElement("span");
        rank.className = "rank";
        rank.textContent = "#" + domain.rank;

        name.append(rank, document.createTextNode(domain.domain));

        const category = document.createElement("span");
        category.className = "category";
        category.textContent = domain.category || "Uncategorized";

        const meta = document.createElement("div");
        meta.className = "domain-meta";

        const change = Number(domain.pct_rank_change);
        meta.textContent =
            "Rank change: " +
            (Number.isFinite(change) ? change.toFixed(2) + "%" : "N/A");

        item.append(name, category, meta);
        panel.appendChild(item);
    });
});

renderLegend();
updateMap(currentDate);
</script>

</body>
</html>
"""

html = html.replace("MAP_PLACEHOLDER", fig_html)
html = html.replace("DATA_PLACEHOLDER", data_json)
html = html.replace("COLORS_PLACEHOLDER", categories_json)

OUTPUT_PATH.write_text(html, encoding="utf-8")

print(f"Map saved successfully: {OUTPUT_PATH.resolve()}")
