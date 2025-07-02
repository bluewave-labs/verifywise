format:
	black . --exclude '(\.venv|venv)'
	isort . --skip .venv

lint:
	flake8 . --exclude=.venv
	mypy . --exclude .venv
	pylint $(shell find . -type f -name "*.py" ! -path "./.venv/*")

check: format lint
