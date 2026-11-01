


import json, pathlib, re

def find_all(obj, key):
    """Yield every value stored under `key`, at any depth."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == key:
                yield v
            yield from find_all(v, key)
    elif isinstance(obj, list):
        for item in obj:
            yield from find_all(item, key)

def literal(v):
    """Power BI stores literals like \"'#118DFF'\" or \"true\"."""
    return v.strip("'") if isinstance(v, str) else v

def read_report(report_dir):
    root = pathlib.Path(report_dir)
    pages = {}
    for p in root.rglob("page.json"):
        pages[p.parent.name] = json.loads(p.read_text(encoding="utf-8")).get("displayName")

    out = []
    for f in root.rglob("visual.json"):
        v = json.loads(f.read_text(encoding="utf-8"))
        page_id = f.parent.parent.parent.name  # pages/<id>/visuals/<id>/visual.json

        fields = []
        for proj in find_all(v, "projections"):
            for p in proj:
                fld = p.get("field", {})
                for kind in ("Column", "Measure", "Aggregation"):
                    if kind in fld:
                        fields.append(p.get("queryRef") or kind)

        literals = [literal(x.get("Value")) for x in find_all(v, "Literal")]
        colors = sorted({x for x in literals if isinstance(x, str) and re.fullmatch(r"#[0-9A-Fa-f]{6}", x)})
        alt = [literal(x.get("Value")) for x in find_all(v.get("visual", {}).get("visualContainerObjects", {}), "Literal")]

        out.append({
            "id": f.parent.name,
            "page": pages.get(page_id, page_id),
            "type": v.get("visual", {}).get("visualType"),
            "position": v.get("position"),
            "fields": fields,
            "hardcoded_colors": colors,
            "has_theme_colors": "ThemeDataColor" in json.dumps(v),
            "container_literals": alt,   # look here for title / altText
        })
    return out

if __name__ == "__main__":
    for r in read_report(r"C:\Users\deepz\data_r\backend\example_file.Report"):
        print(json.dumps(r, indent=2))