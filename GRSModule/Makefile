.PHONY: seeds render perturb all

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
	uv run grs-scenarios generate --stage infer --models-config configs/models.yaml --temperature 0.2 --max-tokens 500 --limit 3

all: seeds render perturb validate
