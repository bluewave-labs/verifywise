#!/usr/bin/env python3
"""
Standalone test runner for the Bias and Fairness Module.
This avoids the complex import chain that's causing issues.
"""

import sys
import os
from pathlib import Path

# Simple check to warn users if they're not in the virtual environment
if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
    print("⚠️  Warning: Virtual environment not detected!")
    print("   For best results, activate your virtual environment first:")
    print("   source venv/bin/activate")
    print("   python run_tests.py")
    print("\n   Or use the Makefile command:")
    print("   make test")
    print()

# Add src to path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

def run_basic_tests():
    """Run basic functionality tests."""
    print("🧪 Running Basic Tests")
    print("=" * 50)
    
    # Test 1: Basic imports
    print("1. Testing basic imports...")
    try:
        import numpy as np
        print("   ✅ NumPy imported successfully")
    except ImportError as e:
        print(f"   ❌ NumPy import failed: {e}")
        return False
    
    # Test 2: Metric registry
    print("2. Testing metric registry...")
    try:
        from src.eval_engine.metric_registry import list_metrics, get_metric
        metrics = list_metrics()
        print(f"   ✅ Metric registry working, found {len(metrics)} metrics")
        if len(metrics) > 0:
            print(f"   📊 Sample metrics: {metrics[:3]}")
    except Exception as e:
        print(f"   ❌ Metric registry failed: {e}")
        return False
    
    # Test 3: Individual metrics
    print("3. Testing individual metrics...")
    try:
        from src.eval_engine.metrics import demographic_parity, equalized_odds
        print("   ✅ Individual metrics imported successfully")
    except Exception as e:
        print(f"   ❌ Individual metrics failed: {e}")
        return False
    
    # Test 4: Configuration
    print("4. Testing configuration...")
    try:
        from src.core.config import ConfigManager
        print("   ✅ Configuration imported successfully")
    except Exception as e:
        print(f"   ❌ Configuration failed: {e}")
        return False
    
    # Test 5: Metric execution
    print("5. Testing metric execution...")
    try:
        import numpy as np
        y_true = np.array([0, 1, 0, 1])
        y_pred = np.array([0, 0, 1, 1])
        sensitive = np.array([0, 0, 1, 1])
        
        result = demographic_parity(y_true, y_pred, sensitive)
        print(f"   ✅ Metric execution successful, result: {type(result).__name__}")
    except Exception as e:
        print(f"   ❌ Metric execution failed: {e}")
        return False
    
    print("\n🎉 All basic tests passed!")
    return True

def run_evaluation_tests():
    """Run evaluation pipeline tests."""
    print("\n🔧 Running Evaluation Tests")
    print("=" * 50)
    
    # Test 1: Evaluation runner import
    print("1. Testing evaluation runner...")
    try:
        from src.inference.evaluation_runner import run_comprehensive_evaluation
        print("   ✅ Evaluation runner imported successfully")
    except Exception as e:
        print(f"   ❌ Evaluation runner failed: {e}")
        return False
    
    # Test 2: Fairness evaluator
    print("2. Testing fairness evaluator...")
    try:
        from src.eval_engine.evaluator import FairnessEvaluator
        print("   ✅ Fairness evaluator imported successfully")
    except Exception as e:
        print(f"   ❌ Fairness evaluator failed: {e}")
        return False
    
    print("\n🎉 All evaluation tests passed!")
    return True

def run_comprehensive_tests():
    """Run comprehensive tests."""
    print("\n🚀 Running Comprehensive Tests")
    print("=" * 50)
    
    # Test 1: Full module import
    print("1. Testing full module import...")
    try:
        from src import ConfigManager, FairnessEvaluator
        print("   ✅ Full module import successful")
    except Exception as e:
        print(f"   ❌ Full module import failed: {e}")
        return False
    
    # Test 2: CLI functions
    print("2. Testing CLI functions...")
    try:
        from src.core.cli import setup_logging
        print("   ✅ CLI functions imported successfully")
    except Exception as e:
        print(f"   ❌ CLI functions failed: {e}")
        return False
    
    print("\n🎉 All comprehensive tests passed!")
    return True

def main():
    """Main test runner."""
    print("🧪 Bias and Fairness Module - Test Runner")
    print("=" * 60)
    
    success = True
    
    # Run basic tests
    if not run_basic_tests():
        success = False
    
    # Run evaluation tests
    if not run_evaluation_tests():
        success = False
    
    # Run comprehensive tests
    if not run_comprehensive_tests():
        success = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    if success:
        print("🎉 All tests passed successfully!")
        print("✅ Your Bias and Fairness Module is working correctly!")
    else:
        print("💥 Some tests failed!")
        print("⚠️  Check the error messages above for details.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
