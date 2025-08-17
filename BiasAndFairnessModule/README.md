# Bias and Fairness Evaluation Module

> ⚠️ **This is an experimental module.** The purpose of creating this module is to test and validate different approaches for evaluating bias and fairness in large language models (LLMs) and tabular models. None of the branches or modules in this branch are intended for production use, and no code here will be merged into the main branch.

## Objective

This project aims to explore and validate methodologies for evaluating **bias** and **fairness** in both LLMs and tabular models across various model and dataset combinations. All code in this repository is experimental and intended to test feasibility, correctness, and performance before production integration.

## Features

### Dual Evaluation Modes

1. **Prompt-based LLM evaluation**: Evaluates fairness in language model responses using generated prompts
2. **Feature-based tabular evaluation**: Evaluates fairness in structured models using raw features and predictions

### Fairness Compass Integration

- Implements decision logic from the Fairness Compass paper (arXiv:2102.08453)
- Automatic metric routing based on task type and label behavior
- Comprehensive fairness metric calculations using Fairlearn

### Available Metrics

#### Tabular Models

- **Demographic Parity**: Equal selection rates across groups
- **Equalized Odds**: Equal true positive and false positive rates
- **Equalized Opportunity**: Equal true positive rates
- **Predictive Equality**: Equal false positive rates
- **Predictive Parity**: Equal positive predictive value
- **Balance for Positive/Negative Class**: Score distribution fairness

#### LLM Models

- **Toxicity Gap**: Difference in toxic content between groups
- **Sentiment Gap**: Difference in sentiment scores between groups
- **Stereotype Gap**: Difference in stereotype usage between groups
- **Exposure Disparity**: Difference in response exposure between groups
- **Representation Disparity**: Difference in representation between groups

## What We're Doing

- Running experiments using different **open/close-source LLMs** and **benchmark or custom datasets**
- Implementing and testing **bias** and **fairness** metrics in a modular way
- Evaluating different **prompting strategies** and **evaluation pipelines**
- Ensuring our code is reproducible and extensible for future productionization
- Supporting both **prompt-based** and **feature-based** evaluation modes

## Tech Stack

- **Language**: Python 3.8+
- **Frameworks/Libraries**: PyTorch, Hugging Face Transformers, Fairlearn, scikit-learn, pandas, matplotlib/seaborn
- **Hardware**: Designed to run on GPU
- **Dependencies**: See `requirements.txt` for details

### Dependency Management

The project uses multiple requirements files for different use cases:

- **`requirements.txt`**: Flexible versions for development (recommended)
- **`requirements-exact.txt`**: Exact versions for reproducible builds
- **`requirements-dev.txt`**: Development tools and testing frameworks

### Version Compatibility

- **NumPy**: >=1.26.4, <2.0.0 (critical for langfair compatibility)
- **Python**: 3.8+ (tested with 3.12)
- **PyTorch**: >=2.7.0 (with optional CUDA support)

## Development Philosophy

- **Experiment-first**: This repo is for rapid iteration and learning
- **No main merges**: All work stays in isolated branches
- **Fail-safe**: Better to try and break it here than in production
- **Collaborative**: Encourage collaboration through clear, modular design and code comments

## Troubleshooting

### Common Issues

#### NumPy Version Conflicts

If you encounter NumPy version conflicts:

```bash
# Check current version
make status

# Reinstall with correct version
make install-exact
```

#### Virtual Environment Issues

Ensure you're using the virtual environment:

```bash
# Activate virtual environment
source venv/bin/activate

# Verify activation
which python  # Should point to venv/bin/python
```

#### Import Errors

If you get import errors:

```bash
# Check environment
make check-env

# Reinstall dependencies
make install
```

### Getting Help

1. **Check environment**: `make check-env`
2. **View status**: `make status`
3. **Run tests**: `make test`
4. **Check documentation**: See `INSTALLATION.md` for detailed setup

## Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd BiasAndFairnessModule

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
make install
```

### 2. Verify Installation

```bash
# Check environment status
make status

# Run comprehensive environment check
make check-env

# Run tests (choose one method)
make test                    # Using Makefile (recommended)
# OR
source venv/bin/activate    # Activate venv first
python run_tests.py         # Then run directly
```

### 3. Run Evaluation

```bash
# Run the complete evaluation pipeline
python src/inference/evaluation_runner.py

# Or use the CLI
python -m src.cli predict --config configs/config.yaml
```

### 4. Running Python Scripts Directly

**Important**: When running Python scripts directly (not through `make`), you need to activate the virtual environment first:

```bash
# Method 1: Activate venv, then run
source venv/bin/activate
python run_tests.py
python src/inference/evaluation_runner.py

# Method 2: Use venv Python directly
./venv/bin/python run_tests.py
./venv/bin/python src/inference/evaluation_runner.py

# Method 3: Use Makefile (automatically handles venv)
make test
```

## Development Workflow

### Available Make Commands

```bash
# Environment Management
make venv              # Create virtual environment
make install           # Install dependencies
make install-dev       # Install development dependencies
make install-exact     # Install exact versions for reproducibility

# Testing
make test              # Run all tests
make test-coverage     # Run tests with coverage
make check-env         # Comprehensive environment check

# Code Quality
make format            # Format code with black/isort
make lint              # Run linters (flake8, mypy, pylint)
make check             # Format + lint + test

# Utilities
make status            # Show environment status
make clean             # Clean cache files
```

### Command Line Interface

The module provides a CLI for easy evaluation:

```bash
# Run prompt-based LLM evaluation
python -m src.cli prompt --config config.yaml --limit 100 --output results.json

# Run feature-based tabular evaluation
python -m src.cli predict --config config.yaml --model model.joblib --output results.json

# Validate metric routing
python -m src.cli validate --task-type binary_classification --label-behavior binary
```

### Python API

#### Prompt-based LLM Evaluation

```python
from src.inference import ModelInferencePipeline
from src.eval_runner import EvaluationRunner

# Create inference pipeline
pipeline = ModelInferencePipeline("config.yaml")

# Generate prompts and run inference
samples = pipeline.generate_prompts(limit_samples=100)
prompts = [sample["prompt"] for sample in samples]
responses = pipeline.model_loader.predict(prompts)

# Run evaluation
evaluator = EvaluationRunner(
    df=pipeline.data_loader.data,
    inference_pipeline=pipeline,
    mode="prompt"
)

results = evaluator.run_dual_evaluation(
    prompts=prompts,
    responses=responses,
    sensitive_attributes=[sample["protected_attributes"] for sample in samples]
)
```

#### Feature-based Tabular Evaluation

```python
from src.eval_runner import EvaluationRunner
from src.model_loader import load_sklearn_model
from src.data_loader import DataLoader
from src.config import ConfigManager

# Load data and model
config_manager = ConfigManager("config.yaml")
data_loader = DataLoader(config_manager.config.dataset)
df = data_loader.load_data()

X = df.drop(columns=[config_manager.config.dataset.target_column])
y = df[config_manager.config.dataset.target_column]
A = df[config_manager.config.dataset.protected_attributes[0]]

model = load_sklearn_model("model.joblib")

# Run evaluation
evaluator = EvaluationRunner(df=df, config=config_manager.config, mode="predict")
results = evaluator.run_dual_evaluation(X=X, y=y, A=A, model=model)
```

#### Direct Metric Routing

```python
from src.compass_router import route_metric

# Route metrics for binary classification
metrics = route_metric("binary_classification", "binary")
print(f"Applicable metrics: {metrics}")
```

#### Custom Fairness Evaluation

```python
from src.evaluation_module import FairnessEvaluator

# For tabular models
evaluator = FairnessEvaluator(task_type="binary_classification")
results = evaluator.evaluate_tabular_model(
    y_true=y_true,
    y_pred=y_pred,
    sensitive_features=sensitive_features
)

# For LLM responses
evaluator = FairnessEvaluator(task_type="generation")
results = evaluator.evaluate_llm_responses(
    prompts=prompts,
    responses=responses,
    sensitive_attributes=sensitive_attributes
)
```

## Configuration

The module uses YAML configuration files. Example configuration:

```yaml
dataset:
  name: "adult-census"
  source: "scikit-learn/adult-census-income"
  platform: "scikit-learn"
  target_column: "income"
  protected_attributes: ["sex", "race"]

model:
  huggingface:
    enabled: true
    model_id: "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    device: "cuda"
    max_new_tokens: 512
    temperature: 0.7
    top_p: 0.9
    system_prompt: "You are a helpful AI assistant."

metrics:
  disparity:
    enabled: true
    metrics: ["demographic_parity", "equalized_odds"]
  performance:
    enabled: true
    metrics: ["accuracy", "precision", "recall", "f1"]
```

## Testing

Run the test suite to verify functionality:

```bash
# Run all tests
python -m pytest src/test_*.py

# Run specific test files
python -m pytest src/test_compass_router.py
python -m pytest src/test_evaluation_module.py
```

## Architecture

The module follows a modular architecture:

- **`compass_router.py`**: Implements Fairness Compass decision logic
- **`evaluation_module.py`**: Core fairness evaluation functionality
- **`eval_runner.py`**: Orchestrates evaluation pipelines
- **`inference.py`**: Handles model inference and output storage
- **`cli.py`**: Command-line interface
- **`config.py`**: Configuration management
- **`data_loader.py`**: Dataset loading and preprocessing
- **`model_loader.py`**: Model loading and inference

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is experimental and not intended for production use.
