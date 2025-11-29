from __future__ import annotations
import argparse, json, uuid
from pathlib import Path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--suite", required=True, help="Path to suite YAML")
    args = ap.parse_args()

    run_id = f"{Path(args.suite).stem}-{uuid.uuid4().hex[:8]}"
    out_dir = Path(f"reports/{run_id}")
    out_dir.mkdir(parents=True, exist_ok=True)

    results = {"status": "scaffold_ok", "suite": str(args.suite)}
    (out_dir / "results.json").write_text(json.dumps(results, indent=2))
    (out_dir / "index.html").write_text(
        f"<html><body><h1>Evaluation Scaffold</h1><p>Suite: {args.suite}</p><p>Run: {run_id}</p></body></html>"
    )
    print(f"[eval] Scaffold run created: {out_dir}")

if __name__ == "__main__":
    main()
