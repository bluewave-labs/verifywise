#!/usr/bin/env python3
"""
Complete Fairness Evaluation Pipeline Runner

This script runs the complete pipeline from inference to evaluation:
1. Data Loading and Model Inference
2. Post-processing (encoding, attribute expansion)
3. Comprehensive Fairness Evaluation
4. Results Processing and Reporting
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

# Import all necessary components
from src.core.config import ConfigManager
from src.inference.inference import ModelInferencePipeline
from src.eval_engine.postprocessing import PostProcessor
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
from src.eval_engine.enhanced_results_processor import EnhancedResultsProcessor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


def run_complete_pipeline():
    """Run the complete pipeline from inference to evaluation."""
    
    print("🚀 Running Complete Fairness Evaluation Pipeline")
    print("=" * 70)
    
    # Initialize configuration
    print("📋 Loading configuration...")
    config_manager = ConfigManager()
    config = config_manager.config
    
    # Step 1: Run Model Inference
    print("\n📊 Step 1: Running Model Inference...")
    try:
        inference_pipeline = ModelInferencePipeline()
        
        # Run inference with config settings
        inference_results = inference_pipeline.run_batch_inference(
            batch_size=None,  # No batching for now
            limit_samples=None,  # Use all samples
            auto_save=True
        )
        
        print(f"   ✅ Inference completed: {len(inference_results)} samples processed")
        
    except Exception as e:
        print(f"   ❌ Inference failed: {str(e)}")
        return None
    
    # Step 1.5: Normalize predictions to strict tokens expected by the pipeline
    try:
        _normalize_predictions_to_tokens(config)
    except Exception as e:
        print(f"   ❌ Prediction normalization failed: {str(e)}")
        return None

    # Step 2: Run Post-processing
    print("\n🔧 Step 2: Running Post-processing...")
    try:
        postprocessor = PostProcessor(config_manager)
        postprocessed_data = postprocessor.run()
        
        print(f"   ✅ Post-processing completed: {len(postprocessed_data)} samples processed")
        print(f"   📊 Columns: {list(postprocessed_data.columns)}")
        
    except Exception as e:
        print(f"   ❌ Post-processing failed: {str(e)}")
        return None
    
    # Step 3: Run Comprehensive Evaluation
    print("\n🔍 Step 3: Running Comprehensive Evaluation...")
    try:
        # Prepare data for evaluation
        df = postprocessed_data
        y_true = df['answer'].values
        y_pred = df['prediction'].values
        sex_sensitive = df['sex'].values
        race_sensitive = df['race'].values
        
        print(f"   📊 Data Overview:")
        print(f"      Total samples: {len(df)}")
        print(f"      Ground Truth Distribution: {np.bincount(y_true)}")
        print(f"      Prediction Distribution: {np.bincount(y_pred)}")
        print(f"      Sex Distribution: {np.bincount(sex_sensitive)} (0=Female, 1=Male)")
        print(f"      Race Distribution: {np.bincount(race_sensitive)} (0=Black/Other, 1=White)")
        
        # Get metrics from config
        user_selected_metrics = config.metrics.fairness.metrics if config.metrics.fairness.enabled else []
        print(f"   📋 User Selected Metrics: {user_selected_metrics}")
        
        # Fairness Compass recommended metrics
        fairness_compass_metrics = [
            'equalized_opportunity', 'predictive_equality', 'conditional_use_accuracy_equality',
            'accuracy_difference', 'precision_difference', 'recall_difference', 'f1_difference'
        ]
        
        # All available metrics
        all_available_metrics = [
            'equal_selection_parity', 'conditional_statistical_parity', 'calibration',
            'balance_positive_class', 'balance_negative_class', 'toxicity_gap',
            'sentiment_gap', 'stereotype_gap', 'exposure_disparity', 'representation_disparity',
            'prompt_fairness', 'multiclass_demographic_parity', 'multiclass_equalized_odds',
            'regression_demographic_parity'
        ]
        
        print(f"   📋 Metrics Configuration:")
        print(f"      User Selected: {len(user_selected_metrics)} metrics")
        print(f"      Fairness Compass: {len(fairness_compass_metrics)} metrics")
        print(f"      All Available: {len(all_available_metrics)} metrics")
        
        # Run metrics in priority order
        all_results = {}
        
        # 1. User selected metrics (highest priority)
        if user_selected_metrics:
            print(f"\n   🎯 Running User Selected Metrics:")
            for metric_name in user_selected_metrics:
                _run_metric(metric_name, y_true, y_pred, sex_sensitive, race_sensitive, all_results)
        
        # 2. Fairness Compass additional metrics
        print(f"\n   🧭 Running Fairness Compass Additional Metrics:")
        for metric_name in fairness_compass_metrics:
            _run_metric(metric_name, y_true, y_pred, sex_sensitive, race_sensitive, all_results)
        
        # 3. All available metrics
        print(f"\n   🔧 Running All Available Metrics:")
        for metric_name in all_available_metrics:
            _run_metric(metric_name, y_true, y_pred, sex_sensitive, race_sensitive, all_results)
        
        # Calculate performance metrics
        performance_results = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, zero_division=0),
            'recall': recall_score(y_true, y_pred, zero_division=0),
            'f1_score': f1_score(y_true, y_pred, zero_division=0)
        }
        
        print(f"\n   📊 Performance Metrics:")
        for metric, value in performance_results.items():
            print(f"      {metric.capitalize()}: {value:.4f}")
        
        # Compile comprehensive results
        comprehensive_results = {
            'metadata': {
                'evaluation_type': 'complete_pipeline_evaluation',
                'dataset': config.dataset.name,
                'model': config.model.huggingface.model_id,
                'model_task': config.model.model_task,
                'label_behavior': config.model.label_behavior,
                'evaluation_timestamp': pd.Timestamp.now().isoformat(),
                'total_samples': len(df),
                'protected_attributes': config.dataset.protected_attributes,
                'pipeline_steps': ['inference', 'postprocessing', 'evaluation'],
                'metrics_configuration': {
                    'user_selected_metrics': user_selected_metrics,
                    'fairness_compass_recommended_metrics': fairness_compass_metrics,
                    'all_available_metrics': all_available_metrics,
                },
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
        
        print(f"   ✅ Evaluation completed: {comprehensive_results['metric_summary']['successful_metrics']}/{comprehensive_results['metric_summary']['total_metrics_tested']} metrics successful")
        
    except Exception as e:
        print(f"   ❌ Evaluation failed: {str(e)}")
        return None
    
    # Step 4: Process and Save Results
    print("\n💾 Step 4: Processing and Saving Results...")
    try:
        # Initialize results processor
        results_processor = EnhancedResultsProcessor()
        
        # Process the results
        clean_results = results_processor.process_comprehensive_results(comprehensive_results)
        
        # Save clean results
        output_path = Path('artifacts/clean_results.json')
        output_path.parent.mkdir(exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(clean_results, f, indent=2, default=str)
        
        print(f"   ✅ Clean results saved to {output_path}")
        
        # Generate and display quality report
        report = results_processor.generate_user_friendly_report()
        print(f"\n📋 Evaluation Report:")
        print(report)
        
        # Print summary
        _print_pipeline_summary(comprehensive_results, clean_results)
        
        return clean_results
        
    except Exception as e:
        print(f"   ❌ Results processing failed: {str(e)}")
        return None


def _run_metric(metric_name: str, y_true: np.ndarray, y_pred: np.ndarray, 
               sex_sensitive: np.ndarray, race_sensitive: np.ndarray, 
               all_results: dict):
    """Run a single metric for both sex and race attributes."""
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
        
        print(f"      ✅ {metric_name}: sex={sex_value:.4f}, race={race_value:.4f}")
        
    except Exception as e:
        print(f"      ❌ {metric_name}: Error - {str(e)}")
        all_results[f"{metric_name}_sex"] = None
        all_results[f"{metric_name}_race"] = None


def _normalize_predictions_to_tokens(config) -> None:
    """Normalize free-form LLM predictions to strict tokens ('>50K' or '<=50K').

    This function reads the inference results CSV specified in the config and ensures
    the 'prediction' column contains only the two allowed binary string values
    expected by the rest of the pipeline. The normalization strategy is:
      1) If the explicit tokens '>50K' or '<=50K' appear anywhere, use them.
      2) Otherwise, apply heuristic phrase checks ('greater than', 'above', 'at least' → >50K;
         'less than or equal', 'or less', 'at most' → <=50K).
      3) Otherwise, extract the first numeric quantity (including forms like 55K or 50,000)
         and map >= 50k → >50K, else <=50K.

    If no mapping can be determined, the original value is left unchanged.
    """
    results_path = Path(config.artifacts.inference_results_path)
    if not results_path.exists():
        # Some pipelines save to a slightly different name; try a common alternative
        alt_path = Path('artifacts/inference_results.csv')
        results_path = alt_path if alt_path.exists() else Path(config.artifacts.inference_results_path)

    if not results_path.exists():
        print(f"   ❌ Prediction normalization skipped: file not found at {results_path}")
        return

    import re

    def extract_numeric_value(text: str) -> float:
        """Extract a numeric value from text; understands '55K' and '50,000' forms.
        Returns value in absolute dollars when possible, else NaN.
        """
        if not isinstance(text, str):
            return float('nan')
        # 55K / 55k style
        m = re.search(r"(\d{1,3})(?:\.(\d+))?\s*[kK]", text)
        if m:
            whole = float(m.group(1) + ('.' + m.group(2) if m.group(2) else ''))
            return whole * 1000.0
        # 50,000 / 50000 style
        m = re.search(r"\b(\d{1,3}(?:,\d{3})+|\d{5,})\b", text)
        if m:
            num = float(m.group(1).replace(',', ''))
            return num
        return float('nan')

    def map_to_token(value: str) -> str:
        if not isinstance(value, str):
            return value
        text = value
        # Fast path: explicit tokens present
        if '>50K' in text:
            return '>50K'
        if '<=50K' in text:
            return '<=50K'
        lower = text.lower()
        # Phrase heuristics
        greater_phrases = [
            'greater than 50', 'above 50', 'more than 50', 'over 50', 'at least 50'
        ]
        less_phrases = [
            'less than or equal', '50,000 or less', 'or less', 'at most 50'
        ]
        if any(p in lower for p in greater_phrases):
            return '>50K'
        if any(p in lower for p in less_phrases):
            return '<=50K'
        # Numeric heuristic
        num = extract_numeric_value(text)
        if num == num:  # not NaN
            return '>50K' if num >= 50000 else '<=50K'
        return value

    df = pd.read_csv(results_path)
    if 'prediction' not in df.columns:
        print(f"   ❌ Prediction normalization skipped: 'prediction' column missing in {results_path}")
        return

    original = df['prediction'].copy()
    df['prediction'] = df['prediction'].apply(map_to_token)

    # Second pass: enforce strict tokens. If still not one of the two, fallback to '<=50K'.
    valid_tokens = {'>50K', '<=50K'}
    not_valid_mask = ~df['prediction'].isin(valid_tokens)
    num_second_pass = int(not_valid_mask.sum())
    if num_second_pass:
        df.loc[not_valid_mask, 'prediction'] = '<=50K'

    num_changed = int((df['prediction'] != original).sum())
    num_total = int(len(df))
    print(f"   🔧 Normalized predictions: {num_changed}/{num_total} updated; {num_second_pass} forced to '<=50K'")

    # Save back to the same path for the post-processor to consume
    df.to_csv(results_path, index=False)

def _print_pipeline_summary(comprehensive_results: dict, clean_results: dict):
    """Print a comprehensive pipeline summary."""
    print(f"\n📊 Complete Pipeline Summary:")
    print("=" * 50)
    
    # Pipeline steps
    print(f"🔄 Pipeline Steps Completed:")
    print(f"   1. Inference: ✅")
    print(f"   2. Post-processing: ✅")
    print(f"   3. Evaluation: ✅")
    print(f"   4. Results Processing: ✅")
    
    # Metrics summary
    metric_summary = comprehensive_results['metric_summary']
    print(f"\n📈 Metrics Summary:")
    print(f"   Total metrics tested: {metric_summary['total_metrics_tested']}")
    print(f"   Successful: {metric_summary['successful_metrics']}")
    print(f"   Failed: {metric_summary['failed_metrics']}")
    print(f"   Success rate: {metric_summary['success_rate']}")
    
    # Data quality summary
    if 'data_quality' in clean_results:
        data_quality = clean_results['data_quality']
        print(f"\n🔍 Data Quality Summary:")
        print(f"   Data quality score: {data_quality['data_quality_score']:.1%}")
        print(f"   Valid metrics: {len(clean_results['fairness_metrics'])}")
        print(f"   Flagged metrics: {len(data_quality['flagged_metrics'])}")
        print(f"   Excluded metrics: {len(data_quality['excluded_metrics'])}")
    
    # Key insights
    print(f"\n🎯 Key Fairness Insights:")
    fairness_values = {k: v for k, v in comprehensive_results['fairness_metrics'].items() 
                      if v is not None and 'sex' in k}
    if fairness_values:
        max_disparity_sex = max(fairness_values.values())
        max_metric_sex = max(fairness_values, key=fairness_values.get)
        print(f"   Highest sex-based disparity: {max_metric_sex} = {max_disparity_sex:.4f}")
    
    fairness_values_race = {k: v for k, v in comprehensive_results['fairness_metrics'].items() 
                           if v is not None and 'race' in k}
    if fairness_values_race:
        max_disparity_race = max(fairness_values_race.values())
        max_metric_race = max(fairness_values_race, key=fairness_values_race.get)
        print(f"   Highest race-based disparity: {max_metric_race} = {max_disparity_race:.4f}")
    
    print(f"\n✅ Complete pipeline evaluation finished successfully!")


def run_comprehensive_fairness_evaluation():
    """Legacy function for backward compatibility."""
    return run_complete_pipeline()


def main():
    """Main entry point."""
    try:
        results = run_complete_pipeline()
        return results
    except Exception as e:
        print(f"\n❌ Pipeline execution failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()
