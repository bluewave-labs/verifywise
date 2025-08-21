#!/usr/bin/env python3
"""
Simple test script to test balance metrics and verify NaN fix
"""

import sys
import os
from pathlib import Path
import numpy as np

# Add the src directory to Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

from eval_engine.metrics import balance_positive_class, balance_negative_class
from eval_engine.metric_registry import list_metrics

def test_balance_metrics():
    """Test the balance metrics with scenarios that could cause NaN."""
    
    print("🧪 Testing Balance Metrics for NaN Fix")
    print("=" * 50)
    
    # Test case 1: Normal case with positive samples
    print("\n📊 Test Case 1: Normal case with positive samples")
    y_true = np.array([1, 1, 0, 0, 1, 0, 0, 1])
    y_scores = np.array([0.8, 0.9, 0.2, 0.1, 0.7, 0.3, 0.4, 0.6])
    sensitive = np.array([0, 1, 0, 1, 0, 1, 0, 1])  # 2 groups
    
    try:
        result = balance_positive_class(y_true, y_scores, sensitive)
        print(f"   ✅ balance_positive_class: {type(result)}")
        print(f"   Result: {result}")
    except Exception as e:
        print(f"   ❌ balance_positive_class: {str(e)}")
    
    try:
        result = balance_negative_class(y_true, y_scores, sensitive)
        print(f"   ✅ balance_negative_class: {type(result)}")
        print(f"   Result: {result}")
    except Exception as e:
        print(f"   ❌ balance_negative_class: {str(e)}")
    
    # Test case 2: Edge case - no positive samples in one group
    print("\n📊 Test Case 2: Edge case - no positive samples in one group")
    y_true = np.array([1, 0, 0, 0, 0, 0, 0, 0])  # Only 1 positive sample
    y_scores = np.array([0.8, 0.2, 0.1, 0.3, 0.4, 0.5, 0.6, 0.7])
    sensitive = np.array([0, 0, 0, 0, 1, 1, 1, 1])  # Group 0 has 1 positive, Group 1 has 0
    
    try:
        result = balance_positive_class(y_true, y_scores, sensitive)
        print(f"   ✅ balance_positive_class: {type(result)}")
        print(f"   Result: {result}")
        if hasattr(result, 'by_group'):
            print(f"   Group values: {result.by_group.to_dict()}")
    except Exception as e:
        print(f"   ❌ balance_positive_class: {str(e)}")
    
    try:
        result = balance_negative_class(y_true, y_scores, sensitive)
        print(f"   ✅ balance_negative_class: {type(result)}")
        print(f"   Result: {result}")
        if hasattr(result, 'by_group'):
            print(f"   Group values: {result.by_group.to_dict()}")
    except Exception as e:
        print(f"   ❌ balance_negative_class: {str(e)}")
    
    # Test case 3: Extreme edge case - no positive samples at all
    print("\n📊 Test Case 3: Extreme edge case - no positive samples at all")
    y_true = np.array([0, 0, 0, 0, 0, 0, 0, 0])  # No positive samples
    y_scores = np.array([0.2, 0.1, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8])
    sensitive = np.array([0, 0, 0, 0, 1, 1, 1, 1])
    
    try:
        result = balance_positive_class(y_true, y_scores, sensitive)
        print(f"   ✅ balance_positive_class: {type(result)}")
        print(f"   Result: {result}")
        if hasattr(result, 'by_group'):
            print(f"   Group values: {result.by_group.to_dict()}")
    except Exception as e:
        print(f"   ❌ balance_positive_class: {str(e)}")
    
    print("\n✅ Balance metrics testing completed!")

if __name__ == "__main__":
    test_balance_metrics()
