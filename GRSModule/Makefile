.PHONY: seeds render perturb all export-parquet

seeds:
	uv run grs-scenarios generate --stage seeds

render:
	uv run grs-scenarios generate --stage render --seed 42 --per-obligation 2

perturb:
	uv run grs-scenarios generate --stage perturb --seed 42 --k-per-base 3 --coverage per_family

validate:
	uv run grs-scenarios generate --stage validate

infer-mock-client:
	uv run grs-scenarios generate --stage infer --model-id mock-v0 --limit 3

infer-openrouter-gpt4:
	uv run grs-scenarios generate --stage infer --provider openrouter --model-id openai/gpt-4o-mini 

infer-multi-model:
	uv run grs-scenarios generate --stage infer --models-config configs/models.yaml --temperature 0.2 --max-tokens 8192 --limit 6 --resume

judge:
	uv run grs-scenarios generate --stage judge --judge-model-id openai/gpt-4o-mini --judge-limit 6

judge-resume:
	uv run grs-scenarios generate --stage judge --judge-resume

run-scenario-viewer:
	uv run streamlit run viewer.py

all: seeds render perturb validate

export-parquet:
	uv run python scripts/export_parquet.py --dataset-dir datasets/grs_scenarios_v0.1
