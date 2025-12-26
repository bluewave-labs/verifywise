# Virtual environment setup
venv:
	python -m venv venv
	. venv/bin/activate && pip install --upgrade pip

# Install dependencies
install: venv
	. venv/bin/activate && pip install -r requirements.txt

install-dev: venv
	. venv/bin/activate && pip install -r requirements-dev.txt

install-exact: venv
	. venv/bin/activate && pip install -r requirements-exact.txt

# Code formatting
format:
ifdef FILE
	black $(FILE)
	isort $(FILE)
else
	black . --exclude '(\.venv|venv)'
	isort . --skip .venv
endif

# Code quality checks
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

# Testing
test:
	. venv/bin/activate && python run_tests.py

# Unit tests
test-unit:
	. venv/bin/activate && python src/tests/run_unit_tests.py

test-metrics:
	. venv/bin/activate && python src/tests/run_unit_tests.py src.tests.unit.test_metrics

test-registry:
	. venv/bin/activate && python src/tests/run_unit_tests.py src.tests.unit.test_metric_registry

# Legacy test commands (for backward compatibility)
test-evaluation:
	. venv/bin/activate && python -m src.tests.run_all_tests evaluation

test-config:
	. venv/bin/activate && python -m src.tests.run_all_tests config

test-compass:
	. venv/bin/activate && python -m src.tests.run_all_tests compass

test-coverage:
	. venv/bin/activate && coverage run python run_tests.py
	. venv/bin/activate && coverage report
	. venv/bin/activate && coverage html

# Development workflow
check: format lint test

# Environment status
status:
	@echo "Python version:"
	@python --version
	@echo "Python path:"
	@which python
	@echo "NumPy version:"
	@python -c "import numpy; print(numpy.__version__)"
	@echo "Virtual environment:"
	@echo "$$VIRTUAL_ENV"

# Environment check
check-env:
	. venv/bin/activate && python check_environment.py

# Clean up
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -delete
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
