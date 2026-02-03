.PHONY: seeds render perturb all

seeds:
	uv run grs-scenarios generate --stage seeds

render:
	uv run grs-scenarios generate --stage render --seed 42 --per-obligation 2

perturb:
	uv run grs-scenarios generate --stage perturb --seed 42 --k-per-base 3 --coverage per_family

validate:
	uv run grs-scenarios generate --stage validate

all: seeds render perturb
