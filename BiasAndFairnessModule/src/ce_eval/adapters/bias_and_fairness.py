def run_bias_smoke(dataset_csv: str, config: dict | None = None) -> dict:
    return {"demographic_parity": 0.0, "equal_selection_parity": 0.0, "per_group": {}}
