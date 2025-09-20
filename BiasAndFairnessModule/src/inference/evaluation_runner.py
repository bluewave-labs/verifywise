#!/usr/bin/env python3
"""
Evaluation runner script for the Bias and Fairness Module.
This script runs the complete evaluation pipeline and provides comprehensive results.
"""

import sys
import os
from pathlib import Path

# Add the project root directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pandas as pd
import numpy as np
import json
from typing import Dict, Any

from src.eval_engine.evaluator import FairnessEvaluator
from src.core.config import ConfigManager
from src.eval_engine.metric_registry import get_metric, list_metrics
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

def run_comprehensive_evaluation() -> Dict[str, Any]:
    """Run comprehensive evaluation using the integrated system."""
    
    print("🚀 Running Comprehensive Bias and Fairness Evaluation")
    print("=" * 60)
    
    # Load configuration and data
    print("📋 Loading configuration...")
    config_manager = ConfigManager()
    
    print("📊 Loading post-processed data...")
    df = pd.read_csv('artifacts/postprocessed_results.csv')
    print(f"   Loaded {len(df)} samples")
    print(f"   Columns: {list(df.columns)}")
    
    # Show data sample
    print("\n📈 Data Sample:")
    print(df[['sample_id', 'answer', 'prediction', 'sex', 'race']].head())
    
    # Prepare data for evaluation
    y_true = df['answer'].values
    y_pred = df['prediction'].values
    
    print(f"\n🎯 Ground Truth Distribution:")
    print(f"   >50K: {np.sum(y_true == 1)} ({np.mean(y_true == 1)*100:.1f}%)")
    print(f"   <=50K: {np.sum(y_true == 0)} ({np.mean(y_true == 0)*100:.1f}%)")
    
    print(f"\n🤖 Prediction Distribution:")
    print(f"   >50K: {np.sum(y_pred == 1)} ({np.mean(y_pred == 1)*100:.1f}%)")
    print(f"   <=50K: {np.sum(y_pred == 0)} ({np.mean(y_pred == 0)*100:.1f}%)")
    
    # Run fairness evaluation
    print("\n🔍 Running Fairness Evaluation...")
    evaluator = FairnessEvaluator(config_manager.get_metrics_config(), 'artifacts/postprocessed_results.csv')
    metric_functions = evaluator.evaluate()
    
    # Calculate fairness metrics
    fairness_results = {}
    for metric_name, metric_func in metric_functions['fairness'].items():
        try:
            print(f"   Calculating {metric_name}...")
            
            # For sex-based evaluation
            sex_sensitive = df['sex'].values
            sex_result = metric_func(y_true, y_pred, sex_sensitive)
            fairness_results[f"{metric_name}_sex"] = sex_result
            
            # For race-based evaluation
            race_sensitive = df['race'].values
            race_result = metric_func(y_true, y_pred, race_sensitive)
            fairness_results[f"{metric_name}_race"] = race_result
            
        except Exception as e:
            print(f"   ❌ Error calculating {metric_name}: {str(e)}")
            fairness_results[f"{metric_name}_sex"] = None
            fairness_results[f"{metric_name}_race"] = None
    
    # Convert complex metric results to float values for JSON serialization
    print("\n🔄 Converting metric results for JSON serialization...")
    converted_fairness_results = {}
    for metric_name, value in fairness_results.items():
        if value is not None:
            try:
                if hasattr(value, 'by_group'):  # MetricFrame
                    # Extract the difference between max and min group values
                    group_values = value.by_group.values
                    if len(group_values) >= 2:
                        converted_value = float(max(group_values) - min(group_values))
                    else:
                        converted_value = 0.0
                elif isinstance(value, dict):
                    # For dict results, calculate disparity
                    values = [v for v in value.values() if isinstance(v, (int, float))]
                    if len(values) >= 2:
                        converted_value = float(max(values) - min(values))
                    else:
                        converted_value = 0.0
                elif isinstance(value, (int, float)):
                    converted_value = float(value)
                else:
                    converted_value = 0.0
                
                converted_fairness_results[metric_name] = converted_value
                print(f"   ✅ {metric_name}: {converted_value:.4f}")
            except Exception as e:
                print(f"   ❌ Error converting {metric_name}: {str(e)}")
                converted_fairness_results[metric_name] = 0.0
        else:
            converted_fairness_results[metric_name] = None
    
    # Calculate basic performance metrics
    print("\n📊 Calculating Performance Metrics...")
    
    performance_results = {
        'accuracy': accuracy_score(y_true, y_pred),
        'precision': precision_score(y_true, y_pred, zero_division=0),
        'recall': recall_score(y_true, y_pred, zero_division=0),
        'f1_score': f1_score(y_true, y_pred, zero_division=0)
    }
    
    # Display results
    print("\n" + "=" * 60)
    print("📊 EVALUATION RESULTS")
    print("=" * 60)
    
    print("\n🎯 Performance Metrics:")
    for metric, value in performance_results.items():
        print(f"   {metric.capitalize()}: {value:.4f}")
    
    print("\n🔍 Fairness Metrics:")
    for metric, value in fairness_results.items():
        if value is not None:
            # Convert MetricFrame and other complex types to float for display
            try:
                if hasattr(value, 'by_group'):  # MetricFrame
                    # Extract the difference between max and min group values
                    group_values = value.by_group.values
                    if len(group_values) >= 2:
                        display_value = float(max(group_values) - min(group_values))
                    else:
                        display_value = 0.0
                elif isinstance(value, dict):
                    # For dict results, calculate disparity
                    values = [v for v in value.values() if isinstance(v, (int, float))]
                    if len(values) >= 2:
                        display_value = float(max(values) - min(values))
                    else:
                        display_value = 0.0
                elif isinstance(value, (int, float)):
                    display_value = float(value)
                else:
                    display_value = 0.0
                
                print(f"   {metric}: {display_value:.4f}")
            except Exception as e:
                print(f"   {metric}: ❌ Error formatting: {str(e)}")
        else:
            print(f"   {metric}: ❌ Failed")
    
    # Calculate group-specific metrics
    print("\n👥 Group-Specific Analysis:")
    
    # Sex-based analysis
    print("\n   📊 By Sex:")
    for sex in [0, 1]:  # 0=unprivileged (Female), 1=privileged (Male)
        sex_mask = df['sex'] == sex
        sex_name = "Male" if sex == 1 else "Female"
        if np.sum(sex_mask) > 0:
            sex_accuracy = accuracy_score(y_true[sex_mask], y_pred[sex_mask])
            sex_count = np.sum(sex_mask)
            print(f"     {sex_name} (n={sex_count}): Accuracy = {sex_accuracy:.4f}")
    
    # Race-based analysis
    print("\n   📊 By Race:")
    for race in [0, 1]:  # 0=unprivileged (Black/Other), 1=privileged (White)
        race_mask = df['race'] == race
        race_name = "White" if race == 1 else "Black/Other"
        if np.sum(race_mask) > 0:
            race_accuracy = accuracy_score(y_true[race_mask], y_pred[race_mask])
            race_count = np.sum(race_mask)
            print(f"     {race_name} (n={race_count}): Accuracy = {race_accuracy:.4f}")
    
    # Save results
    print("\n💾 Saving results...")
    results = {
        'performance': performance_results,
        'fairness': converted_fairness_results,  # Use converted values for JSON
        'metadata': {
            'total_samples': len(df),
            'protected_attributes': ['sex', 'race'],
            'evaluation_timestamp': pd.Timestamp.now().isoformat()
        }
    }
    
    output_path = Path('artifacts/evaluation_results.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"✅ Evaluation completed! Results saved to {output_path}")
    
    return results

def main():
    """Main entry point for the evaluation runner."""
    try:
        results = run_comprehensive_evaluation()
        print(f"\n🎉 Evaluation completed successfully!")
        return results
    except Exception as e:
        print(f"\n❌ Evaluation failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()
