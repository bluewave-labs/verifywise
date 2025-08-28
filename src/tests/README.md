# Test Structure for Bias and Fairness Module

This directory contains the comprehensive test suite for the Bias and Fairness Module, organized using Python's `unittest` framework.

## 🏗️ **Test Organization**

### **Directory Structure**

```
src/tests/
├── __init__.py                    # Package initialization
├── unit/                          # Unit tests for individual components
│   ├── __init__.py               # Unit tests package
│   ├── test_metrics.py           # Fairness metrics tests
│   └── test_metric_registry.py   # Metric registry tests
├── integration/                   # Integration tests (future)
│   └── __init__.py               # Integration tests package
├── fixtures/                      # Test data and utilities
│   ├── __init__.py               # Fixtures package
│   └── sample_data.py            # Sample datasets for testing
├── run_unit_tests.py             # Unit test runner
└── README.md                     # This file
```

## 🧪 **Test Categories**

### **Unit Tests** (`unit/`)

- **Purpose**: Test individual functions, classes, and modules in isolation
- **Scope**: Single component functionality without external dependencies
- **Examples**:
  - `test_metrics.py` - Tests individual fairness metrics
  - `test_metric_registry.py` - Tests metric registration system

### **Integration Tests** (`integration/`)

- **Purpose**: Test how multiple components work together
- **Scope**: End-to-end workflows and data flow
- **Status**: Planned for future implementation

### **Fixtures** (`fixtures/`)

- **Purpose**: Provide consistent test data and utilities
- **Contents**:
  - Sample datasets with known bias patterns
  - Mock objects and test utilities
  - Reusable test data generators

## 🚀 **Running Tests**

### **Using Makefile (Recommended)**

```bash
# Run all unit tests
make test-unit

# Run specific test categories
make test-metrics      # Test fairness metrics
make test-registry     # Test metric registry

# Run all tests (including legacy)
make test
```

### **Direct Python Execution**

```bash
# Run all unit tests
python src/tests/run_unit_tests.py

# Run specific test
python src/tests/run_unit_tests.py src.tests.unit.test_metrics
```

### **Individual Test Files**

```bash
# Run specific test file
python -m unittest src.tests.unit.test_metrics
python -m unittest src.tests.unit.test_metric_registry
```

## 📊 **Test Coverage**

### **Current Coverage**

- ✅ **Fairness Metrics**: All core metrics tested
- ✅ **Metric Registry**: Registration, retrieval, and management
- ✅ **Utility Functions**: `convert_metric_to_float` and helpers
- ✅ **Input Validation**: Edge cases and error handling

### **Planned Coverage**

- 🔄 **Configuration System**: Config loading and validation
- 🔄 **Evaluation Pipeline**: End-to-end evaluation workflows
- 🔄 **Data Loading**: Dataset loading and preprocessing
- 🔄 **Fairness Compass**: Decision logic and routing

## 🧩 **Test Design Principles**

### **1. Isolation**

- Each test is independent and can run in any order
- Tests don't share state or modify global objects
- Use `setUp()` and `tearDown()` for test data management

### **2. Reproducibility**

- All tests use fixed random seeds for consistent results
- Test data is generated programmatically, not loaded from files
- Tests produce the same results across different environments

### **3. Edge Case Coverage**

- Test with empty arrays, single samples, and extreme values
- Verify proper error handling for invalid inputs
- Test boundary conditions and edge cases

### **4. Realistic Data**

- Test data includes realistic bias patterns
- Protected attributes simulate real demographic groups
- Metrics are tested with data that should produce known results

## 🔧 **Adding New Tests**

### **Creating a New Unit Test**

1. Create test file in `src/tests/unit/`
2. Follow naming convention: `test_<component>.py`
3. Inherit from `unittest.TestCase`
4. Use descriptive test method names: `test_<functionality>`
5. Include docstrings explaining what each test verifies

### **Example Test Structure**

```python
import unittest
from src.component import function_to_test

class TestComponent(unittest.TestCase):
    def setUp(self):
        """Set up test data."""
        self.test_data = create_test_data()

    def test_basic_functionality(self):
        """Test basic functionality works correctly."""
        result = function_to_test(self.test_data)
        self.assertIsInstance(result, expected_type)
        self.assertEqual(result, expected_value)

    def test_edge_case(self):
        """Test edge case handling."""
        with self.assertRaises(ValueError):
            function_to_test(None)
```

### **Adding Test Fixtures**

1. Create utility functions in `src/tests/fixtures/`
2. Make functions reusable across multiple test files
3. Include proper documentation and type hints
4. Ensure fixtures are deterministic and reproducible

## 📈 **Test Metrics and Quality**

### **Current Status**

- **Total Tests**: 20+ test methods
- **Coverage Areas**: Core metrics, registry system, utilities
- **Test Types**: Unit tests, edge cases, error handling

### **Quality Indicators**

- ✅ **No Test Dependencies**: Tests can run in any order
- ✅ **Consistent Results**: Same output across different runs
- ✅ **Error Handling**: Tests verify proper error responses
- ✅ **Edge Cases**: Boundary conditions and invalid inputs covered

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Import Errors**

```bash
# Ensure you're in the virtual environment
source venv/bin/activate

# Check Python path
python -c "import sys; print(sys.path)"
```

#### **Test Discovery Issues**

```bash
# Run from project root
cd /path/to/BiasAndFairnessModule

# Use the test runner
python src/tests/run_unit_tests.py
```

#### **Missing Dependencies**

```bash
# Install test dependencies
make install-dev

# Verify environment
make check-env
```

### **Getting Help**

1. Check the test output for specific error messages
2. Verify your virtual environment is activated
3. Ensure all dependencies are installed
4. Run `make check-env` to verify environment setup

## 🔮 **Future Enhancements**

### **Planned Improvements**

- **Pytest Integration**: Add pytest for more advanced testing features
- **Coverage Reporting**: Generate detailed coverage reports
- **Performance Testing**: Add benchmarks for metric calculations
- **Property-Based Testing**: Use hypothesis for more thorough testing
- **Continuous Integration**: Automated testing in CI/CD pipeline

### **Test Expansion**

- **More Metrics**: Test additional fairness metrics as they're added
- **Configuration Tests**: Comprehensive config system testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Benchmark critical functions
- **Documentation Tests**: Verify code examples work correctly

---

**Note**: This test suite is designed to grow with the module. As new features are added, corresponding tests should be created to maintain quality and reliability.
