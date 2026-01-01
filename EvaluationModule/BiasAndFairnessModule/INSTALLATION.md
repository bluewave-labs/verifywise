# Installation Guide

This guide covers how to install and set up the Bias and Fairness Module.

## Prerequisites

- Python 3.8 or higher (tested with Python 3.12)
- pip package manager
- Virtual environment (recommended)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BiasAndFairnessModule
```

### 2. Create and Activate Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

#### Option A: Install with Flexible Versions (Recommended)

```bash
pip install -r requirements.txt
```

#### Option B: Install with Exact Versions (Reproducible)

```bash
pip install -r requirements-exact.txt
```

#### Option C: Install Development Dependencies

```bash
pip install -r requirements-dev.txt
```

## Dependency Categories

### Core Dependencies

- **numpy**: Numerical computing (version 1.26.4, < 2.0.0 for compatibility)
- **pandas**: Data manipulation and analysis
- **pydantic**: Data validation and settings management
- **pyyaml**: YAML configuration file parsing

### Machine Learning and Fairness

- **scikit-learn**: Machine learning algorithms and utilities
- **fairlearn**: Fairness metrics and algorithms
- **langfair**: Language model fairness evaluation

### Deep Learning and Transformers

- **torch**: PyTorch deep learning framework
- **transformers**: Hugging Face transformers library
- **sentence-transformers**: Sentence embedding models
- **huggingface-hub**: Model and dataset hub integration

### Data Handling

- **datasets**: Hugging Face datasets library
- **pyarrow**: Fast data serialization

### Utilities

- **tqdm**: Progress bars for long-running operations

## Version Compatibility Notes

### NumPy Version Constraint

The module requires NumPy version **>= 1.26.4, < 2.0.0** due to:

- Compatibility with `langfair` package
- Stability with existing machine learning ecosystem
- Avoidance of breaking changes in NumPy 2.x

### PyTorch Installation

For GPU support, you may need to install PyTorch with CUDA:

```bash
# For CUDA 11.8
pip install torch>=2.7.0+cu118 --extra-index-url https://download.pytorch.org/whl/cu118

# For CUDA 12.1
pip install torch>=2.7.0+cu121 --extra-index-url https://download.pytorch.org/whl/cu121
```

## Development Setup

### 1. Install Development Dependencies

```bash
pip install -r requirements-dev.txt
```

### 2. Install Pre-commit Hooks (Optional)

```bash
pre-commit install
```

### 3. Verify Installation

```bash
# Run tests
make test

# Run code quality checks
make check
```

## Troubleshooting

### Common Issues

#### NumPy Version Conflicts

If you encounter NumPy version conflicts:

```bash
pip uninstall numpy
pip install "numpy>=1.26.4,<2.0.0"
```

#### Import Errors

If you get import errors:

1. Ensure you're in the virtual environment
2. Check that all dependencies are installed
3. Verify Python path includes the project directory

#### CUDA Issues

If PyTorch CUDA is not working:

1. Check CUDA version: `nvidia-smi`
2. Install matching PyTorch version
3. Verify GPU drivers are up to date

### Environment Variables

Set these environment variables if needed:

```bash
export PYTHONPATH="${PYTHONPATH}:/path/to/BiasAndFairnessModule/src"
export CUDA_VISIBLE_DEVICES=0  # For GPU usage
```

## Verification

After installation, verify everything works:

```bash
# Run the test suite
python run_tests.py

# Test basic functionality
python -c "from src import ConfigManager; print('✅ Installation successful!')"
```

## Updating Dependencies

### Update All Dependencies

```bash
pip install --upgrade -r requirements.txt
```

### Update Specific Package

```bash
pip install --upgrade package_name
```

### Generate New Requirements Files

```bash
pip freeze > requirements-new.txt
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your Python and package versions
3. Check the project's issue tracker
4. Ensure you're using the recommended Python version (3.8+)
