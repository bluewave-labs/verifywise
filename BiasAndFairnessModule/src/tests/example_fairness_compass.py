#!/usr/bin/env python3
"""
Example script demonstrating the integrated Fairness Compass system.

This script shows how to use the Fairness Compass Engine with both LLM and tabular evaluations.
"""

import json
from ..inference.inference import run_all_evaluations, run_fairness_compass_evaluation
from ..eval_engine.fairness_compass_engine import FairnessCompassEngine


def example_llm_evaluation():
    """Example of LLM evaluation with fairness compass integration."""
    print("=== LLM Evaluation with Fairness Compass ===\n")
    
    # Define compass configuration for LLM evaluation
    compass_config = {
        "enforce_policy": False,
        "ground_truth_available": True,
        "output_type": "label",
        "fairness_focus": "precision",
        "error_sensitivity": "false_positive"
    }
    
    # Run evaluation
    results = run_all_evaluations(
        limit_samples=8,  # Small sample for quick testing
        compass_config=compass_config
    )
    
    print("LLM Evaluation Results:")
    print(json.dumps(results, indent=2))
    
    return results


def example_tabular_evaluation():
    """Example of tabular evaluation with fairness compass."""
    print("\n=== Tabular Evaluation with Fairness Compass ===\n")
    
    # Define compass configuration for tabular evaluation
    compass_config = {
        "enforce_policy": False,
        "ground_truth_available": True,
        "output_type": "label",
        "fairness_focus": "recall",
        "error_sensitivity": "false_negative"
    }
    
    # Run fairness compass evaluation
    results = run_fairness_compass_evaluation(compass_config=compass_config)
    
    print("Tabular Fairness Compass Results:")
    print(json.dumps(results, indent=2))
    
    return results


def example_compass_decision_logic():
    """Example of using the Fairness Compass decision logic directly."""
    print("\n=== Fairness Compass Decision Logic Examples ===\n")
    
    # Example 1: Policy enforcement
    print("Example 1: Policy Enforcement")
    engine1 = FairnessCompassEngine(
        enforce_policy=True,
        representation_type="equal_number"
    )
    recommendations1 = engine1.get_metric_recommendations()
    explanation1 = engine1.explain()
    print(f"Recommendations: {recommendations1}")
    print(f"Reasoning: {explanation1['reasoning']}\n")
    
    # Example 2: Score-based output
    print("Example 2: Score-based Output")
    engine2 = FairnessCompassEngine(
        enforce_policy=False,
        ground_truth_available=True,
        output_type="score",
        error_sensitivity="false_positive"
    )
    recommendations2 = engine2.get_metric_recommendations()
    explanation2 = engine2.explain()
    print(f"Recommendations: {recommendations2}")
    print(f"Reasoning: {explanation2['reasoning']}\n")
    
    # Example 3: Label output with precision focus
    print("Example 3: Label Output with Precision Focus")
    engine3 = FairnessCompassEngine(
        enforce_policy=False,
        ground_truth_available=True,
        output_type="label",
        fairness_focus="precision"
    )
    recommendations3 = engine3.get_metric_recommendations()
    explanation3 = engine3.explain()
    print(f"Recommendations: {recommendations3}")
    print(f"Reasoning: {explanation3['reasoning']}\n")


def example_metric_calculation():
    """Example of calculating fairness metrics with synthetic data."""
    print("\n=== Fairness Metric Calculation Example ===\n")
    
    import numpy as np
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    
    # Create synthetic biased data
    np.random.seed(42)
    n_samples = 1000
    
    # Create features with bias
    X = np.random.randn(n_samples, 5)
    sensitive_attr = np.random.choice([0, 1], size=n_samples, p=[0.7, 0.3])
    
    # Create biased labels (group 1 has higher positive rate)
    y = np.zeros(n_samples)
    for i in range(n_samples):
        if sensitive_attr[i] == 0:
            y[i] = np.random.choice([0, 1], p=[0.8, 0.2])
        else:
            y[i] = np.random.choice([0, 1], p=[0.6, 0.4])
    
    # Split data
    X_train, X_test, y_train, y_test, A_train, A_test = train_test_split(
        X, y, sensitive_attr, test_size=0.3, random_state=42
    )
    
    # Train a model
    model = RandomForestClassifier(random_state=42)
    model.fit(X_train, y_train)
    
    # Get predictions and scores
    y_pred = model.predict(X_test)
    y_scores = model.predict_proba(X_test)[:, 1]
    
    # Create Fairness Compass Engine
    engine = FairnessCompassEngine(
        enforce_policy=False,
        ground_truth_available=True,
        output_type="label",
        fairness_focus="precision"
    )
    
    # Calculate fairness metrics
    fairness_metrics = engine.calculate_fairness_metrics(
        y_true=y_test,
        y_pred=y_pred,
        sensitive_attr=A_test,
        y_scores=y_scores
    )
    
    print("Fairness Metrics Results:")
    for metric, value in fairness_metrics.items():
        if not np.isnan(value):
            print(f"  {metric}: {value:.4f}")
    
    # Get recommendations and explanation
    recommendations = engine.get_metric_recommendations()
    explanation = engine.explain()
    
    print(f"\nRecommended Metrics: {recommendations}")
    print(f"Reasoning: {explanation['reasoning']}")


def main():
    """Run all examples."""
    print("Fairness Compass Integration Examples")
    print("=" * 50)
    
    try:
        # Example 1: Compass decision logic
        example_compass_decision_logic()
        
        # Example 2: Metric calculation with synthetic data
        example_metric_calculation()
        
        # Example 3: LLM evaluation (if LLM is configured)
        print("\n" + "=" * 50)
        print("Note: LLM evaluation requires proper model configuration.")
        print("Uncomment the following line to run LLM evaluation:")
        print("# example_llm_evaluation()")
        
        # Example 4: Tabular evaluation (if model.joblib exists)
        print("\nNote: Tabular evaluation requires model.joblib file.")
        print("Uncomment the following line to run tabular evaluation:")
        print("# example_tabular_evaluation()")
        
    except Exception as e:
        print(f"Error running examples: {str(e)}")
        print("Make sure all dependencies are installed and configuration is correct.")


if __name__ == "__main__":
    main() 