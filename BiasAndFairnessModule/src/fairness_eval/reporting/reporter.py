import json

def save_results(results, output_path="report.json"):
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Saved evaluation results to {output_path}")
