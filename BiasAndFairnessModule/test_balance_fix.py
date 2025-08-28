#!/usr/bin/env python3
"""
Simple test script to verify our balance metrics NaN fix works
"""

import sys
import os
from pathlib import Path
import numpy as np

# Add the src directory to Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

# Import the specific functions we need
sys.path.insert(0, str(src_dir / "eval_engine"))

def test_balance_metrics_directly():
    """Test the balance metrics by importing and testing them directly."""
    
    print("🧪 Testing Balance Metrics Fix Directly")
    print("=" * 50)
    
    try:
        # Import the specific functions
        from metrics import balance_positive_class, balance_negative_class
        
        print("✅ Successfully imported balance metrics functions")
        
        # Test case: Edge case that would cause NaN
        print("\n📊 Testing edge case that would cause NaN...")
        
        # Create data where one group has no positive samples
        y_true = np.array([1, 0, 0, 0, 0, 0, 0, 0])  # Only 1 positive sample
        y_scores = np.array([0.8, 0.2, 0.1, 0.3, 0.4, 0.5, 0.6, 0.7])
        sensitive = np.array([0, 0, 0, 0, 1, 1, 1, 1])  # Group 0 has 1 positive, Group 1 has 0
        
        print(f"   Ground truth: {y_true}")
        print(f"   Scores: {y_scores}")
        print(f"   Sensitive groups: {sensitive}")
        print(f"   Group 0 positives: {np.sum((y_true == 1) & (sensitive == 0))}")
        print(f"   Group 1 positives: {np.sum((y_true == 1) & (sensitive == 1))}")
        
        # Test balance_positive_class
        result = balance_positive_class(y_true, y_scores, sensitive)
        print(f"\n   ✅ balance_positive_class result: {type(result)}")
        
        if hasattr(result, 'by_group'):
            group_values = result.by_group.to_dict()
            print(f"   Group values: {group_values}")
            
            # Check if we have None values instead of NaN
            for group, value in group_values.items():
                if value is None:
                    print(f"   ✅ Group {group}: None (no NaN!)")
                elif np.isnan(value):
                    print(f"   ❌ Group {group}: NaN (still broken)")
                else:
                    print(f"   ✅ Group {group}: {value} (numeric value)")
        
        # Test balance_negative_class
        result = balance_negative_class(y_true, y_scores, sensitive)
        print(f"\n   ✅ balance_negative_class result: {type(result)}")
        
        if hasattr(result, 'by_group'):
            group_values = result.by_group.to_dict()
            print(f"   Group values: {group_values}")
            
            # Check if we have None values instead of NaN
            for group, value in group_values.items():
                if value is None:
                    print(f"   ✅ Group {group}: None (no NaN!)")
                elif np.isnan(value):
                    print(f"   ❌ Group {group}: NaN (still broken)")
                else:
                    print(f"   ✅ Group {group}: {value} (numeric value)")
        
        print("\n🎯 Test completed! Check above for NaN vs None values.")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("   This suggests the import paths are still broken")
    except Exception as e:
        print(f"❌ Other error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_balance_metrics_directly()
