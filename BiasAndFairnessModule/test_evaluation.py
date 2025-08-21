#!/usr/bin/env python3
"""
Simple test script to run bias and fairness evaluation
"""

import sys
import os
from pathlib import Path

# Add the project root directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from src.core.cli import run_prompt_evaluation

def main():
    """Run a simple prompt evaluation test."""
    print("🚀 Starting Bias and Fairness Evaluation Test")
    print("=" * 50)
    
    try:
        # Run prompt evaluation with default config
        results = run_prompt_evaluation(
            config_path="configs/config.yaml",
            limit_samples=10,
            output_path="artifacts/test_results.json",
            verbose=True
        )
        
        print("\n✅ Evaluation completed successfully!")
        print(f"Results saved to: artifacts/test_results.json")
        
        # Print some key metrics
        if results and "fairness_metrics" in results:
            print("\n📊 Key Fairness Metrics:")
            fairness_metrics = results["fairness_metrics"]
            
            # Show first few metrics
            count = 0
            for metric_name, metric_data in fairness_metrics.items():
                if count >= 5:  # Show only first 5
                    break
                if isinstance(metric_data, dict) and "value" in metric_data:
                    print(f"  {metric_name}: {metric_data['value']:.4f}")
                    count += 1
        
        if results and "performance" in results:
            print("\n🎯 Performance Metrics:")
            performance = results["performance"]
            for metric, value in performance.items():
                if isinstance(value, (int, float)):
                    print(f"  {metric}: {value:.4f}")
        
        if results and "data_quality" in results:
            print("\n🔍 Data Quality:")
            data_quality = results["data_quality"]
            if "data_quality_score" in data_quality:
                score = data_quality["data_quality_score"]
                print(f"  Overall Score: {score:.3f} ({score*100:.1f}%)")
            
            if "insights" in data_quality:
                print("  Insights:")
                for insight in data_quality["insights"][:3]:  # Show first 3
                    print(f"    • {insight}")
        
        print("\n🎉 Test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
