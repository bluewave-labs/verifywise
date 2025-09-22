#!/usr/bin/env python3
"""
Test script to run fairness metrics and generate actual metric values.

This script creates synthetic data, runs all the fairness metrics,
and generates a results file similar to fairness_compass_results.json
but with actual calculated metric values.
"""

import numpy as np
import pandas as pd
import json
from pathlib import Path
import sys
import os

# Add the src directory to Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

from eval_engine.metrics import (
    demographic_parity, equalized_odds, equalized_opportunity, predictive_equality,
    predictive_parity, conditional_use_accuracy_equality, accuracy_difference,
    precision_difference, recall_difference, f1_difference, toxicity_gap,
    sentiment_gap, stereotype_gap, exposure_disparity, representation_disparity,
    prompt_fairness, multiclass_demographic_parity, multiclass_equalized_odds,
    regression_demographic_parity, balance_positive_class, balance_negative_class,
    calibration, conditional_statistical_parity, equal_selection_parity
)
from eval_engine.metric_registry import list_metrics


def create_synthetic_data(n_samples=1000, random_state=42):
    """Create synthetic data for testing."""
    np.random.seed(random_state)
    
    # Create features
    X = np.random.randn(n_samples, 5)
    
    # Create target with some bias
    # Group A has higher probability of positive class
    group_a_mask = np.random.choice([True, False], size=n_samples, p=[0.6, 0.4])
    y_true = np.zeros(n_samples)
    
    # Higher probability for group A
    y_true[group_a_mask] = np.random.binomial(1, 0.7, size=np.sum(group_a_mask))
    y_true[~group_a_mask] = np.random.binomial(1, 0.3, size=np.sum(~group_a_mask))
    
    # Create predictions with some bias
    y_pred = np.zeros(n_samples)
    y_pred[group_a_mask] = np.random.binomial(1, 0.75, size=np.sum(group_a_mask))
    y_pred[~group_a_mask] = np.random.binomial(1, 0.25, size=np.sum(~group_a_mask))
    
    # Create probability scores
    y_scores = np.random.random(n_samples)
    y_scores[group_a_mask] += 0.2  # Bias towards group A
    
    # Create sensitive attributes
    sensitive_attributes = np.where(group_a_mask, 'A', 'B')
    
    # Create legitimate attributes for conditional metrics
    legitimate_attributes = np.random.choice(['low', 'medium', 'high'], size=n_samples)
    
    return X, y_true, y_pred, y_scores, sensitive_attributes, legitimate_attributes


def test_binary_classification_metrics(y_true, y_pred, y_scores, sensitive_attributes):
    """Test binary classification metrics."""
    print("Testing binary classification metrics...")
    
    results = {}
    
    try:
        results["demographic_parity"] = demographic_parity(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ demographic_parity: {results['demographic_parity']:.4f}")
    except Exception as e:
        print(f"  ❌ demographic_parity: {str(e)}")
        results["demographic_parity"] = None
    
    try:
        results["equalized_odds"] = equalized_odds(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ equalized_odds: {results['equalized_odds']:.4f}")
    except Exception as e:
        print(f"  ❌ equalized_odds: {str(e)}")
        results["equalized_odds"] = None
    
    try:
        results["equalized_opportunity"] = equalized_opportunity(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ equalized_opportunity: {results['equalized_opportunity']:.4f}")
    except Exception as e:
        print(f"  ❌ equalized_opportunity: {str(e)}")
        results["equalized_opportunity"] = None
    
    try:
        results["predictive_equality"] = predictive_equality(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ predictive_equality: {results['predictive_equality']:.4f}")
    except Exception as e:
        print(f"  ❌ predictive_equality: {str(e)}")
        results["predictive_equality"] = None
    
    try:
        results["predictive_parity"] = predictive_parity(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ predictive_parity: {results['predictive_parity']:.4f}")
    except Exception as e:
        print(f"  ❌ predictive_parity: {str(e)}")
        results["predictive_parity"] = None
    
    try:
        results["conditional_use_accuracy_equality"] = conditional_use_accuracy_equality(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ conditional_use_accuracy_equality: {type(results['conditional_use_accuracy_equality'])}")
    except Exception as e:
        print(f"  ❌ conditional_use_accuracy_equality: {str(e)}")
        results["conditional_use_accuracy_equality"] = None
    
    try:
        results["accuracy_difference"] = accuracy_difference(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ accuracy_difference: {results['accuracy_difference']:.4f}")
    except Exception as e:
        print(f"  ❌ accuracy_difference: {str(e)}")
        results["accuracy_difference"] = None
    
    try:
        results["precision_difference"] = precision_difference(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ precision_difference: {results['precision_difference']:.4f}")
    except Exception as e:
        print(f"  ❌ precision_difference: {str(e)}")
        results["precision_difference"] = None
    
    try:
        results["recall_difference"] = recall_difference(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ recall_difference: {results['recall_difference']:.4f}")
    except Exception as e:
        print(f"  ❌ recall_difference: {str(e)}")
        results["recall_difference"] = None
    
    try:
        results["f1_difference"] = f1_difference(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ f1_difference: {results['f1_difference']:.4f}")
    except Exception as e:
        print(f"  ❌ f1_difference: {str(e)}")
        results["f1_difference"] = None
    
    return results


def test_generation_metrics(y_true, y_pred, y_scores, sensitive_attributes):
    """Test generation and continuous metrics."""
    print("Testing generation metrics...")
    
    results = {}
    
    try:
        results["toxicity_gap"] = toxicity_gap(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ toxicity_gap: {results['toxicity_gap']:.4f}")
    except Exception as e:
        print(f"  ❌ toxicity_gap: {str(e)}")
        results["toxicity_gap"] = None
    
    try:
        results["sentiment_gap"] = sentiment_gap(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ sentiment_gap: {results['sentiment_gap']:.4f}")
    except Exception as e:
        print(f"  ❌ sentiment_gap: {str(e)}")
        results["sentiment_gap"] = None
    
    try:
        results["stereotype_gap"] = stereotype_gap(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ stereotype_gap: {results['stereotype_gap']:.4f}")
    except Exception as e:
        print(f"  ❌ stereotype_gap: {str(e)}")
        results["stereotype_gap"] = None
    
    try:
        results["exposure_disparity"] = exposure_disparity(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ exposure_disparity: {results['exposure_disparity']:.4f}")
    except Exception as e:
        print(f"  ❌ exposure_disparity: {str(e)}")
        results["exposure_disparity"] = None
    
    try:
        results["representation_disparity"] = representation_disparity(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ representation_disparity: {results['representation_disparity']:.4f}")
    except Exception as e:
        print(f"  ❌ representation_disparity: {str(e)}")
        results["representation_disparity"] = None
    
    try:
        results["prompt_fairness"] = prompt_fairness(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ prompt_fairness: {results['prompt_fairness']:.4f}")
    except Exception as e:
        print(f"  ❌ prompt_fairness: {str(e)}")
        results["prompt_fairness"] = None
    
    return results


def test_regression_metrics(y_true, y_pred, y_scores, sensitive_attributes):
    """Test regression metrics."""
    print("Testing regression metrics...")
    
    results = {}
    
    try:
        results["regression_demographic_parity"] = regression_demographic_parity(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ regression_demographic_parity: {results['regression_demographic_parity']:.4f}")
    except Exception as e:
        print(f"  ❌ regression_demographic_parity: {str(e)}")
        results["regression_demographic_parity"] = None
    
    try:
        results["balance_positive_class"] = balance_positive_class(y_true, y_scores, sensitive_attributes)
        print(f"  ✅ balance_positive_class: {type(results['balance_positive_class'])}")
    except Exception as e:
        print(f"  ❌ balance_positive_class: {str(e)}")
        results["balance_positive_class"] = None
    
    try:
        results["balance_negative_class"] = balance_negative_class(y_true, y_scores, sensitive_attributes)
        print(f"  ✅ balance_negative_class: {type(results['balance_negative_class'])}")
    except Exception as e:
        print(f"  ❌ balance_negative_class: {str(e)}")
        results["balance_negative_class"] = None
    
    return results


def test_multiclass_metrics(y_true, y_pred, y_scores, sensitive_attributes):
    """Test multiclass classification metrics."""
    print("Testing multiclass metrics...")
    
    results = {}
    
    try:
        results["multiclass_demographic_parity"] = multiclass_demographic_parity(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ multiclass_demographic_parity: {results['multiclass_demographic_parity']:.4f}")
    except Exception as e:
        print(f"  ❌ multiclass_demographic_parity: {str(e)}")
        results["multiclass_demographic_parity"] = None
    
    try:
        results["multiclass_equalized_odds"] = multiclass_equalized_odds(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ multiclass_equalized_odds: {results['multiclass_equalized_odds']:.4f}")
    except Exception as e:
        print(f"  ❌ multiclass_equalized_odds: {str(e)}")
        results["multiclass_equalized_odds"] = None
    
    return results


def test_other_metrics(y_true, y_pred, y_scores, sensitive_attributes, legitimate_attributes):
    """Test other metrics."""
    print("Testing other metrics...")
    
    results = {}
    
    try:
        results["equal_selection_parity"] = equal_selection_parity(y_true, y_pred, sensitive_attributes)
        print(f"  ✅ equal_selection_parity: {type(results['equal_selection_parity'])}")
    except Exception as e:
        print(f"  ❌ equal_selection_parity: {str(e)}")
        results["equal_selection_parity"] = None
    
    try:
        results["conditional_statistical_parity"] = conditional_statistical_parity(y_pred, sensitive_attributes, legitimate_attributes)
        print(f"  ✅ conditional_statistical_parity: {type(results['conditional_statistical_parity'])}")
    except Exception as e:
        print(f"  ❌ conditional_statistical_parity: {str(e)}")
        results["conditional_statistical_parity"] = None
    
    try:
        results["calibration"] = calibration(y_true, y_scores, sensitive_attributes)
        print(f"  ✅ calibration: {type(results['calibration'])}")
    except Exception as e:
        print(f"  ❌ calibration: {str(e)}")
        results["calibration"] = None
    
    return results


def main():
    """Main function to run all metric tests."""
    print("🚀 Testing Fairness Metrics with Synthetic Data")
    print("=" * 60)
    
    # Create synthetic data
    print("📊 Creating synthetic data...")
    X, y_true, y_pred, y_scores, sensitive_attributes, legitimate_attributes = create_synthetic_data()
    
    print(f"   Dataset size: {len(y_true)} samples")
    print(f"   Sensitive groups: {np.unique(sensitive_attributes)}")
    print(f"   Target distribution: {np.bincount(y_true)}")
    print(f"   Prediction distribution: {np.bincount(y_pred)}")
    
    # Test all metric categories
    all_results = {}
    
    # Binary classification metrics
    binary_results = test_binary_classification_metrics(y_true, y_pred, y_scores, sensitive_attributes)
    all_results.update(binary_results)
    
    # Generation metrics
    generation_results = test_generation_metrics(y_true, y_pred, y_scores, sensitive_attributes)
    all_results.update(generation_results)
    
    # Regression metrics
    regression_results = test_regression_metrics(y_true, y_pred, y_scores, sensitive_attributes)
    all_results.update(regression_results)
    
    # Multiclass metrics
    multiclass_results = test_multiclass_metrics(y_true, y_pred, y_scores, sensitive_attributes)
    all_results.update(multiclass_results)
    
    # Other metrics
    other_results = test_other_metrics(y_true, y_pred, y_scores, sensitive_attributes, legitimate_attributes)
    all_results.update(other_results)
    
    # Show available metrics
    print(f"\n📋 Available metrics in registry: {len(list_metrics())}")
    print(f"   Registry metrics: {list_metrics()}")
    
    # Create comprehensive results structure
    comprehensive_results = {
        "metadata": {
            "evaluation_type": "comprehensive_metric_testing",
            "dataset": "synthetic_binary_classification",
            "model": "synthetic_model",
            "model_task": "binary_classification",
            "label_behavior": "binary",
            "evaluation_timestamp": pd.Timestamp.now().isoformat(),
            "total_samples": len(y_true),
            "sensitive_groups": list(np.unique(sensitive_attributes)),
            "target_distribution": y_true.tolist(),
            "prediction_distribution": y_pred.tolist()
        },
        "metric_results": all_results,
        "metric_summary": {
            "total_metrics_tested": len(all_results),
            "successful_metrics": len([v for v in all_results.values() if v is not None]),
            "failed_metrics": len([v for v in all_results.values() if v is None]),
            "success_rate": f"{len([v for v in all_results.values() if v is not None]) / len(all_results) * 100:.1f}%"
        },
        "data_statistics": {
            "group_a_samples": int(np.sum(sensitive_attributes == 'A')),
            "group_b_samples": int(np.sum(sensitive_attributes == 'B')),
            "group_a_positive_rate": float(np.mean(y_true[sensitive_attributes == 'A'])),
            "group_b_positive_rate": float(np.mean(y_true[sensitive_attributes == 'B'])),
            "group_a_prediction_rate": float(np.mean(y_pred[sensitive_attributes == 'A'])),
            "group_b_prediction_rate": float(np.mean(y_pred[sensitive_attributes == 'B']))
        }
    }
    
    # Save results
    print("\n💾 Saving comprehensive results...")
    output_path = Path('artifacts/comprehensive_metric_results.json')
    output_path.parent.mkdir(exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(comprehensive_results, f, indent=2, default=str)
    
    print(f"✅ Results saved to {output_path}")
    
    # Print summary
    print(f"\n📊 Test Summary:")
    print(f"   Total metrics tested: {comprehensive_results['metric_summary']['total_metrics_tested']}")
    print(f"   Successful: {comprehensive_results['metric_summary']['successful_metrics']}")
    print(f"   Failed: {comprehensive_results['metric_summary']['failed_metrics']}")
    print(f"   Success rate: {comprehensive_results['metric_summary']['success_rate']}")
    
    print("\n✅ Metric testing completed successfully!")


if __name__ == "__main__":
    main()
