import json, pathlib
import os

def flatten(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from flatten(v, f"{path}.{k}" if path else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from flatten(v, f"{path}[{i}]")
    else:
        yield path, obj

def dump_everything(report_dir, out_file="full_dump.txt"):
    root = pathlib.Path(report_dir)
    with open(out_file, "w", encoding="utf-8") as out:
        for f in sorted(root.rglob("*.json")):
            out.write(f"\n===== {f.relative_to(root)} =====\n")
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
            except Exception as e:
                out.write(f"(could not parse: {e})\n")
                continue
            for path, val in flatten(data):
                out.write(f"{path} = {val!r}\n")


dump_everything(r"C:\Users\deepz\data_r\backend\AdventureWorks Sales.Report",
                r"C:\Users\deepz\data_r\full_dump.txt")
print("written to", os.path.abspath(r"C:\Users\deepz\data_r\full_dump.txt"))
print("json files found:", len(list(pathlib.Path(r"C:\Users\deepz\data_r\backend\AdventureWorks Sales.Report").rglob("*.json"))))
