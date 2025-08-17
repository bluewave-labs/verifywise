#!/usr/bin/env python3
"""
Environment Check Script for Bias and Fairness Module

This script verifies that your Python environment is properly configured
and all dependencies are available.
"""

import sys
import importlib
from pathlib import Path

def check_python_version():
    """Check Python version compatibility."""
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        print(f"   ✅ Python {version.major}.{version.minor}.{version.micro} - Compatible")
        return True
    else:
        print(f"   ❌ Python {version.major}.{version.minor}.{version.micro} - Requires Python 3.8+")
        return False

def check_virtual_environment():
    """Check if running in a virtual environment."""
    print("\n🔧 Checking virtual environment...")
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print(f"   ✅ Virtual environment active: {sys.prefix}")
        return True
    else:
        print("   ⚠️  No virtual environment detected")
        return False

def check_dependencies():
    """Check if all required dependencies are available."""
    print("\n📦 Checking dependencies...")
    
    dependencies = {
        'numpy': 'Numerical computing',
        'pandas': 'Data manipulation',
        'pydantic': 'Data validation',
        'yaml': 'YAML parsing',
        'sklearn': 'Machine learning (scikit-learn)',
        'fairlearn': 'Fairness metrics',
        'langfair': 'Language fairness',
        'torch': 'PyTorch',
        'transformers': 'Hugging Face transformers',
        'datasets': 'Hugging Face datasets',
        'pyarrow': 'Data serialization',
        'tqdm': 'Progress bars'
    }
    
    all_available = True
    for package, description in dependencies.items():
        try:
            module = importlib.import_module(package)
            version = getattr(module, '__version__', 'unknown')
            print(f"   ✅ {package} ({description}) - {version}")
        except ImportError:
            print(f"   ❌ {package} ({description}) - Not found")
            all_available = False
    
    return all_available

def check_numpy_compatibility():
    """Check NumPy version compatibility."""
    print("\n🔢 Checking NumPy compatibility...")
    try:
        import numpy as np
        version = np.__version__
        major, minor = map(int, version.split('.')[:2])
        
        if major == 1 and minor >= 26:
            print(f"   ✅ NumPy {version} - Compatible (>=1.26, <2.0)")
            return True
        elif major >= 2:
            print(f"   ❌ NumPy {version} - Incompatible (>=2.0, requires <2.0)")
            return False
        else:
            print(f"   ⚠️  NumPy {version} - May have compatibility issues")
            return False
    except ImportError:
        print("   ❌ NumPy not found")
        return False

def check_project_structure():
    """Check if project files are in place."""
    print("\n📁 Checking project structure...")
    
    required_files = [
        'src/__init__.py',
        'src/eval_engine/metrics.py',
        'src/eval_engine/metric_registry.py',
        'src/core/config.py',
        'requirements.txt',
        'run_tests.py'
    ]
    
    all_present = True
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"   ✅ {file_path}")
        else:
            print(f"   ❌ {file_path} - Missing")
            all_present = False
    
    return all_present

def main():
    """Run all environment checks."""
    print("🔍 Bias and Fairness Module - Environment Check")
    print("=" * 60)
    
    checks = [
        check_python_version(),
        check_virtual_environment(),
        check_dependencies(),
        check_numpy_compatibility(),
        check_project_structure()
    ]
    
    print("\n" + "=" * 60)
    print("📊 CHECK SUMMARY")
    print("=" * 60)
    
    if all(checks):
        print("🎉 All checks passed! Your environment is ready.")
        print("\n🚀 Next steps:")
        print("   1. Run tests: make test")
        print("   2. Check status: make status")
        print("   3. Run evaluation: python src/inference/evaluation_runner.py")
    else:
        print("💥 Some checks failed. Please fix the issues above.")
        print("\n🔧 Common solutions:")
        print("   1. Activate virtual environment: source venv/bin/activate")
        print("   2. Install dependencies: make install")
        print("   3. Check NumPy version: make status")
    
    return all(checks)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
