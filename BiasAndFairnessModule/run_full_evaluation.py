#!/usr/bin/env python3
"""
Comprehensive Fairness Evaluation Runner

This script runs the full fairness evaluation using all recommended metrics
from the Fairness Compass system on real data.
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
import json

# Add the src directory to Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

# Import directly from the eval_engine directory
from src.eval_engine.metrics import (
    demographic_parity, equalized_odds, equalized_opportunity, predictive_equality,
    predictive_parity, conditional_use_accuracy_equality, accuracy_difference,
    precision_difference, recall_difference, f1_difference, toxicity_gap,
    sentiment_gap, stereotype_gap, exposure_disparity, representation_disparity,
    prompt_fairness, multiclass_demographic_parity, multiclass_equalized_odds,
    regression_demographic_parity, balance_positive_class, balance_negative_class,
    calibration, conditional_statistical_parity, equal_selection_parity,
    convert_metric_to_float
)
from src.eval_engine.metric_registry import list_metrics


def run_comprehensive_fairness_evaluation():
    """Run comprehensive fairness evaluation with all available metrics."""
    
    print("🚀 Running Comprehensive Fairness Evaluation with All Metrics")
    print("=" * 70)
    
    # Load the real data
    print("📊 Loading real evaluation data...")
    try:
        df = pd.read_csv('artifacts/postprocessed_results.csv')
        print(f"   ✅ Loaded {len(df)} samples from postprocessed_results.csv")
        print(f"   Columns: {list(df.columns)}")
    except Exception as e:
        print(f"   ❌ Error loading data: {str(e)}")
        return None
    
    # Prepare data
    y_true = df['answer'].values
    y_pred = df['prediction'].values
    sex_sensitive = df['sex'].values
    race_sensitive = df['race'].values
    
    # Create probability scores (using predictions as proxy for now)
    y_scores = y_pred.astype(float)
    
    print(f"\n📈 Data Overview:")
    print(f"   Ground Truth Distribution: {np.bincount(y_true)}")
    print(f"   Prediction Distribution: {np.bincount(y_pred)}")
    print(f"   Sex Distribution: {np.bincount(sex_sensitive)} (0=Female, 1=Male)")
    print(f"   Race Distribution: {np.bincount(race_sensitive)} (0=Black/Other, 1=White)")
    
    # Get metrics from different sources
    print(f"\n📋 Metrics Configuration:")
    
    # User selected metrics from config.yaml (highest priority)
    user_selected_metrics = [
        'demographic_parity', 'equalized_odds', 'predictive_parity'
    ]
    print(f"   🎯 User Selected Metrics (config.yaml): {len(user_selected_metrics)} metrics")
    print(f"      {user_selected_metrics}")
    
    # Fairness Compass recommended metrics (intelligent routing)
    fairness_compass_recommended_metrics = [
        'demographic_parity', 'equalized_odds', 'equalized_opportunity', 
        'predictive_equality', 'predictive_parity', 'conditional_use_accuracy_equality',
        'accuracy_difference', 'precision_difference', 'recall_difference', 'f1_difference'
    ]
    print(f"   🧭 Fairness Compass Recommended: {len(fairness_compass_recommended_metrics)} metrics")
    print(f"      {fairness_compass_recommended_metrics}")
    
    # All available metrics in the system
    all_available_metrics = [
        'demographic_parity', 'equalized_odds', 'equalized_opportunity', 
        'predictive_equality', 'predictive_parity', 'conditional_use_accuracy_equality',
        'accuracy_difference', 'precision_difference', 'recall_difference', 'f1_difference',
        'equal_selection_parity', 'conditional_statistical_parity', 'calibration',
        'balance_positive_class', 'balance_negative_class', 'toxicity_gap',
        'sentiment_gap', 'stereotype_gap', 'exposure_disparity', 'representation_disparity',
        'prompt_fairness', 'multiclass_demographic_parity', 'multiclass_equalized_odds',
        'regression_demographic_parity'
    ]
    print(f"   🔧 All Available Metrics: {len(all_available_metrics)} metrics")
    print(f"      {all_available_metrics}")
    
    # Priority order: User selected > Fairness Compass recommended > All available
    priority_metrics = user_selected_metrics + [m for m in fairness_compass_recommended_metrics if m not in user_selected_metrics]
    print(f"\n🎯 Priority Order for Evaluation:")
    print(f"   1. User Selected: {user_selected_metrics}")
    print(f"   2. Fairness Compass Additional: {[m for m in fairness_compass_recommended_metrics if m not in user_selected_metrics]}")
    print(f"   3. Other Available: {[m for m in all_available_metrics if m not in priority_metrics]}")
    
    # Run metrics in priority order
    print(f"\n🔍 Running Fairness Metrics in Priority Order...")
    all_results = {}
    
    # 1. HIGHEST PRIORITY: User selected metrics from config.yaml
    print(f"\n🎯 1. User Selected Metrics (config.yaml) - HIGHEST PRIORITY:")
    for metric_name in user_selected_metrics:
        try:
            metric_func = globals()[metric_name]
            
            # Run for sex
            sex_result = metric_func(y_true, y_pred, sex_sensitive)
            sex_value = convert_metric_to_float(sex_result, metric_name)
            all_results[f"{metric_name}_sex"] = sex_value
            
            # Run for race
            race_result = metric_func(y_true, y_pred, race_sensitive)
            race_value = convert_metric_to_float(race_result, metric_name)
            all_results[f"{metric_name}_race"] = race_value
            
            print(f"   ✅ {metric_name}: sex={sex_value:.4f}, race={race_value:.4f}")
            
        except Exception as e:
            print(f"   ❌ {metric_name}: Error - {str(e)}")
            all_results[f"{metric_name}_sex"] = None
            all_results[f"{metric_name}_race"] = None
    
    # 2. SECOND PRIORITY: Additional Fairness Compass recommended metrics
    print(f"\n🧭 2. Fairness Compass Additional Metrics:")
    additional_compass_metrics = [m for m in fairness_compass_recommended_metrics if m not in user_selected_metrics]
    for metric_name in additional_compass_metrics:
        try:
            metric_func = globals()[metric_name]
            
            # Run for sex
            sex_result = metric_func(y_true, y_pred, sex_sensitive)
            sex_value = convert_metric_to_float(sex_result, metric_name)
            all_results[f"{metric_name}_sex"] = sex_value
            
            # Run for race
            race_result = metric_func(y_true, y_pred, race_sensitive)
            race_value = convert_metric_to_float(race_result, metric_name)
            all_results[f"{metric_name}_race"] = race_value
            
            print(f"   ✅ {metric_name}: sex={sex_value:.4f}, race={race_value:.4f}")
            
        except Exception as e:
            print(f"   ❌ {metric_name}: Error - {str(e)}")
            all_results[f"{metric_name}_sex"] = None
            all_results[f"{metric_name}_race"] = None
    
    # 3. THIRD PRIORITY: Other available metrics
    print(f"\n🔧 3. Other Available Metrics:")
    other_metrics = [m for m in all_available_metrics if m not in fairness_compass_recommended_metrics]
    
    for metric_name in other_metrics:
        try:
            metric_func = globals()[metric_name]
            
            # Run for sex
            sex_result = metric_func(y_true, y_pred, sex_sensitive)
            sex_value = convert_metric_to_float(sex_result, metric_name)
            all_results[f"{metric_name}_sex"] = sex_value
            
            # Run for race
            race_result = metric_func(y_true, y_pred, race_sensitive)
            race_value = convert_metric_to_float(race_result, metric_name)
            all_results[f"{metric_name}_race"] = race_value
            
            print(f"   ✅ {metric_name}: sex={sex_value:.4f}, race={race_value:.4f}")
            
        except Exception as e:
            print(f"   ❌ {metric_name}: Error - {str(e)}")
            all_results[f"{metric_name}_sex"] = None
            all_results[f"{metric_name}_race"] = None
    
    # Calculate performance metrics
    print(f"\n📊 Performance Metrics:")
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    
    performance_results = {
        'accuracy': accuracy_score(y_true, y_pred),
        'precision': precision_score(y_true, y_pred, zero_division=0),
        'recall': recall_score(y_true, y_pred, zero_division=0),
        'f1_score': f1_score(y_true, y_pred, zero_division=0)
    }
    
    for metric, value in performance_results.items():
        print(f"   {metric.capitalize()}: {value:.4f}")
    
    # Group-specific analysis
    print(f"\n👥 Group-Specific Analysis:")
    
    # Sex-based analysis
    print(f"\n   📊 By Sex:")
    for sex in [0, 1]:
        sex_mask = sex_sensitive == sex
        sex_name = "Male" if sex == 1 else "Female"
        if np.sum(sex_mask) > 0:
            sex_accuracy = accuracy_score(y_true[sex_mask], y_pred[sex_mask])
            sex_count = np.sum(sex_mask)
            print(f"     {sex_name} (n={sex_count}): Accuracy = {sex_accuracy:.4f}")
    
    # Race-based analysis
    print(f"\n   📊 By Race:")
    for race in [0, 1]:
        race_mask = race_sensitive == race
        race_name = "White" if race == 1 else "Black/Other"
        if np.sum(race_mask) > 0:
            race_accuracy = accuracy_score(y_true[race_mask], y_pred[race_mask])
            race_count = np.sum(race_mask)
            print(f"     {race_name} (n={race_count}): Accuracy = {race_accuracy:.4f}")
    
    # Compile comprehensive results
    comprehensive_results = {
        'metadata': {
            'evaluation_type': 'comprehensive_fairness_evaluation',
            'dataset': 'adult-census-income',
            'model': 'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
            'model_task': 'binary_classification',
            'label_behavior': 'binary',
            'evaluation_timestamp': pd.Timestamp.now().isoformat(),
            'total_samples': len(df),
            'protected_attributes': ['sex', 'race'],
            'metrics_configuration': {
                'user_selected_metrics': user_selected_metrics,
                'fairness_compass_recommended_metrics': fairness_compass_recommended_metrics,
                'all_available_metrics': all_available_metrics,
                'priority_order': {
                    'highest_priority': user_selected_metrics,
                    'second_priority': [m for m in fairness_compass_recommended_metrics if m not in user_selected_metrics],
                    'third_priority': [m for m in all_available_metrics if m not in fairness_compass_recommended_metrics]
                }
            }
        },
        'performance': performance_results,
        'fairness_metrics': all_results,
        'metric_summary': {
            'total_metrics_tested': len(all_results),
            'successful_metrics': len([v for v in all_results.values() if v is not None]),
            'failed_metrics': len([v for v in all_results.values() if v is None]),
            'success_rate': f"{len([v for v in all_results.values() if v is not None]) / len(all_results) * 100:.1f}%"
        },
        'data_statistics': {
            'ground_truth_distribution': y_true.tolist(),
            'prediction_distribution': y_pred.tolist(),
            'sex_distribution': sex_sensitive.tolist(),
            'race_distribution': race_sensitive.tolist()
        }
    }
    
    # Save results
    print(f"\n💾 Saving comprehensive results...")
    output_path = Path('artifacts/comprehensive_fairness_evaluation.json')
    output_path.parent.mkdir(exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(comprehensive_results, f, indent=2, default=str)
    
    print(f"✅ Results saved to {output_path}")
    
    # Print summary
    print(f"\n📊 Evaluation Summary:")
    print(f"   Total metrics tested: {comprehensive_results['metric_summary']['total_metrics_tested']}")
    print(f"   Successful: {comprehensive_results['metric_summary']['successful_metrics']}")
    print(f"   Failed: {comprehensive_results['metric_summary']['failed_metrics']}")
    print(f"   Success rate: {comprehensive_results['metric_summary']['success_rate']}")
    
    # Show priority-based results
    print(f"\n🎯 Priority-Based Results:")
    
    # User selected metrics (highest priority)
    user_metrics = {k: v for k, v in all_results.items() if any(metric in k for metric in user_selected_metrics)}
    user_success = len([v for v in user_metrics.values() if v is not None])
    print(f"   1. User Selected Metrics: {user_success}/{len(user_metrics)} successful")
    
    # Fairness compass additional metrics
    compass_additional = {k: v for k, v in all_results.items() if any(metric in k for metric in [m for m in fairness_compass_recommended_metrics if m not in user_selected_metrics])}
    compass_success = len([v for v in compass_additional.values() if v is not None])
    print(f"   2. Fairness Compass Additional: {compass_success}/{len(compass_additional)} successful")
    
    # Other available metrics
    other_metrics = {k: v for k, v in all_results.items() if k not in user_metrics and k not in compass_additional}
    other_success = len([v for v in other_metrics.values() if v is not None])
    print(f"   3. Other Available Metrics: {other_success}/{len(other_metrics)} successful")
    
    print(f"\n🎯 Key Fairness Insights:")
    
    # Find the highest fairness disparities
    fairness_values = {k: v for k, v in all_results.items() if v is not None and 'sex' in k}
    if fairness_values:
        max_disparity_sex = max(fairness_values.values())
        max_metric_sex = max(fairness_values, key=fairness_values.get)
        print(f"   Highest sex-based disparity: {max_metric_sex} = {max_disparity_sex:.4f}")
    
    fairness_values_race = {k: v for k, v in all_results.items() if v is not None and 'race' in k}
    if fairness_values_race:
        max_disparity_race = max(fairness_values_race.values())
        max_metric_race = max(fairness_values_race, key=fairness_values_race.get)
        print(f"   Highest race-based disparity: {max_metric_race} = {max_disparity_race:.4f}")
    
    print(f"\n✅ Comprehensive evaluation completed successfully!")
    return comprehensive_results


def main():
    """Main entry point."""
    try:
        results = run_comprehensive_fairness_evaluation()
        return results
    except Exception as e:
        print(f"\n❌ Evaluation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()
