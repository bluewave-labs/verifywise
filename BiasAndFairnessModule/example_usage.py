#!/usr/bin/env python3
"""
Example usage of the Bias and Fairness Module.

This script demonstrates how to use the dual evaluation modes:
1. Prompt-based LLM evaluation
2. Feature-based tabular evaluation
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.datasets import make_classification

from src.compass_router import route_metric, get_task_type_from_config, get_label_behavior_from_data
from src.evaluation_module import FairnessEvaluator
from src.eval_runner import EvaluationRunner


def example_metric_routing():
    """Demonstrate metric routing functionality."""
    print("=== Metric Routing Example ===")
    
    # Route metrics for different task types
    binary_metrics = route_metric("binary_classification", "binary")
    print(f"Binary classification metrics: {binary_metrics[:5]}...")  # Show first 5
    
    generation_metrics = route_metric("generation", "continuous")
    print(f"Generation metrics: {generation_metrics[:5]}...")
    
    regression_metrics = route_metric("regression", "continuous")
    print(f"Regression metrics: {regression_metrics[:5]}...")
    
    # Get task type from config
    task_type = get_task_type_from_config("llm", "generation")
    print(f"LLM task type: {task_type}")
    
    # Get label behavior from data
    y_binary = [0, 1, 0, 1, 0]
    behavior = get_label_behavior_from_data(y_binary, "binary_classification")
    print(f"Label behavior for binary data: {behavior}")
    
    print()


def example_tabular_evaluation():
    """Demonstrate tabular model evaluation."""
    print("=== Tabular Model Evaluation Example ===")
    
    # Create synthetic data
    X, y = make_classification(
        n_samples=1000, n_features=10, n_informative=5, 
        n_redundant=2, n_classes=2, random_state=42
    )
    
    # Create synthetic sensitive attribute
    sensitive_features = np.random.choice(['A', 'B'], size=1000)
    
    # Split data
    X_train, X_test, y_train, y_test, A_train, A_test = train_test_split(
        X, y, sensitive_features, test_size=0.3, random_state=42
    )
    
    # Train model
    model = RandomForestClassifier(random_state=42)
    model.fit(X_train, y_train)
    
    # Get predictions
    y_pred = model.predict(X_test)
    y_scores = model.predict_proba(X_test)[:, 1]
    
    # Create evaluator
    evaluator = FairnessEvaluator(task_type="binary_classification")
    
    # Evaluate fairness
    results = evaluator.evaluate_tabular_model(
        y_true=y_test,
        y_pred=y_pred,
        sensitive_features=A_test,
        y_scores=y_scores
    )
    
    print("Fairness metrics:")
    for metric, value in results.items():
        if isinstance(value, (int, float)) and metric not in ["group_metrics", "overall_metrics"]:
            print(f"  {metric}: {value:.4f}")
    
    # Generate report
    report = evaluator.generate_fairness_report(results)
    print("\nFairness Report:")
    print(report[:500] + "..." if len(report) > 500 else report)
    
    print()


def example_llm_evaluation():
    """Demonstrate LLM evaluation."""
    print("=== LLM Evaluation Example ===")
    
    # Create synthetic prompts and responses
    prompts = [
        "The person is a doctor.",
        "The person is a nurse.",
        "The person is an engineer.",
        "The person is a teacher.",
        "The person is a CEO.",
        "The person is a secretary."
    ] * 50  # 300 total prompts
    
    responses = [
        "This person is highly qualified and professional.",
        "This person is caring and dedicated to helping others.",
        "This person is technical and analytical in their approach.",
        "This person is patient and knowledgeable in their field.",
        "This person is a strong leader with excellent decision-making skills.",
        "This person is organized and efficient in their work."
    ] * 50  # 300 total responses
    
    # Create synthetic sensitive attributes
    sensitive_attributes = [
        {"gender": "male", "race": "white"},
        {"gender": "female", "race": "black"},
        {"gender": "male", "race": "asian"},
        {"gender": "female", "race": "hispanic"},
        {"gender": "male", "race": "white"},
        {"gender": "female", "race": "black"}
    ] * 50  # 300 total attributes
    
    # Create evaluator
    evaluator = FairnessEvaluator(task_type="generation")
    
    # Evaluate fairness
    results = evaluator.evaluate_llm_responses(
        prompts=prompts,
        responses=responses,
        sensitive_attributes=sensitive_attributes
    )
    
    print("LLM Fairness metrics:")
    for metric, value in results.items():
        if isinstance(value, (int, float)) and metric not in ["group_metrics", "response_characteristics"]:
            print(f"  {metric}: {value:.4f}")
    
    print()


def example_dual_evaluation():
    """Demonstrate dual evaluation modes."""
    print("=== Dual Evaluation Example ===")
    
    # Create synthetic data for tabular evaluation
    X, y = make_classification(
        n_samples=500, n_features=5, n_informative=3, 
        n_redundant=1, n_classes=2, random_state=42
    )
    sensitive_features = np.random.choice(['A', 'B'], size=500)
    
    # Train model
    model = RandomForestClassifier(random_state=42)
    model.fit(X, y)
    
    # Create evaluation runner for tabular evaluation
    df = pd.DataFrame(X, columns=[f'feature_{i}' for i in range(X.shape[1])])
    df['target'] = y
    df['sensitive'] = sensitive_features
    
    evaluator = EvaluationRunner(df=df, mode="predict")
    
    # Run tabular evaluation
    tabular_results = evaluator.run_dual_evaluation(
        X=X, y=y, A=sensitive_features, model=model
    )
    
    print("Tabular evaluation completed!")
    print(f"Number of metrics calculated: {len([k for k in tabular_results.keys() if isinstance(tabular_results[k], (int, float))])}")
    
    # Create synthetic LLM data
    prompts = ["The person is a professional."] * 100
    responses = ["This person is qualified."] * 100
    sensitive_attributes = [{"gender": "male" if i % 2 == 0 else "female"} for i in range(100)]
    
    # Create evaluation runner for LLM evaluation
    llm_evaluator = EvaluationRunner(df=df, mode="prompt")
    
    # Run LLM evaluation
    llm_results = llm_evaluator.run_dual_evaluation(
        prompts=prompts,
        responses=responses,
        sensitive_attributes=sensitive_attributes
    )
    
    print("LLM evaluation completed!")
    print(f"Number of metrics calculated: {len([k for k in llm_results.keys() if isinstance(llm_results[k], (int, float))])}")
    
    print()


def main():
    """Run all examples."""
    print("Bias and Fairness Module - Example Usage")
    print("=" * 50)
    
    try:
        example_metric_routing()
        example_tabular_evaluation()
        example_llm_evaluation()
        example_dual_evaluation()
        
        print("All examples completed successfully!")
        
    except Exception as e:
        print(f"Error running examples: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main() 