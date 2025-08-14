format:
ifdef FILE
	black $(FILE)
	isort $(FILE)
else
	black . --exclude '(\.venv|venv)'
	isort . --skip .venv
endif

lint:
ifdef FILE
	flake8 $(FILE)
	mypy $(FILE)
	pylint $(FILE)
else
	flake8 . --exclude=.venv
	mypy . --exclude .venv
	pylint $(shell find . -type f -name "*.py" ! -path "./.venv/*")
endif

test:
	pytest tests --ignore=tests/base_test_metrics.py

check: format lint