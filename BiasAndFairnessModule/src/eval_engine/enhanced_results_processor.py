"""
Enhanced Results Processor for Bias and Fairness Metrics

This module processes evaluation results to ensure they are suitable for user consumption,
automatically handling problematic values and providing clear indicators of data quality.
"""

import json
import numpy as np
from typing import Dict, Any, List
from pathlib import Path
from .results_validator import MetricResultValidator


class EnhancedResultsProcessor:
    """Processes and cleans fairness evaluation results for user consumption."""
    
    def __init__(self):
        self.validator = MetricResultValidator()
        self.processed_results = {}
        self.validation_summary = {}
    
    def process_comprehensive_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process comprehensive fairness evaluation results.
        
        Args:
            results: Raw results from comprehensive evaluation
            
        Returns:
            Processed results suitable for user consumption
        """
        # First, validate the results
        validation_results = self.validator.validate_comprehensive_results(results)
        self.validation_summary = validation_results
        
        # Create processed results structure - simplified and focused
        processed_results = {
            'metadata': {
                'evaluation_type': results.get('metadata', {}).get('evaluation_type', ''),
                'dataset': results.get('metadata', {}).get('dataset', ''),
                'model': results.get('metadata', {}).get('model', ''),
                'model_task': results.get('metadata', {}).get('model_task', ''),
                'evaluation_timestamp': results.get('metadata', {}).get('evaluation_timestamp', ''),
                'total_samples': results.get('metadata', {}).get('total_samples', 0),
                'protected_attributes': results.get('metadata', {}).get('protected_attributes', []),
                'metrics_configuration': {
                    'user_selected_metrics': results.get('metadata', {}).get('metrics_configuration', {}).get('user_selected_metrics', []),
                    'fairness_compass_recommended_metrics': results.get('metadata', {}).get('metrics_configuration', {}).get('fairness_compass_recommended_metrics', []),
                    'all_available_metrics': results.get('metadata', {}).get('metrics_configuration', {}).get('all_available_metrics', [])
                }
            },
            'performance': results.get('performance', {}),
            'fairness_metrics': {},
            'data_quality': {
                'excluded_metrics': {},
                'flagged_metrics': {},
                'data_quality_score': self._calculate_data_quality_score(validation_results),
                'insights': []
            }
        }
        
        # Process fairness metrics
        fairness_metrics = results.get('fairness_metrics', {})
        for metric_name, value in fairness_metrics.items():
            validation_detail = validation_results['validation_details'].get(metric_name, {})
            
            if validation_detail.get('is_valid', True):
                # Valid metric - include as is
                processed_results['fairness_metrics'][metric_name] = {
                    'value': value,
                    'status': 'valid',
                    'confidence': 'high'
                }
            else:
                # Problematic metric - handle based on recommendation
                recommendation = validation_detail.get('recommendation', 'exclude_from_report')
                
                if recommendation == 'exclude_from_report':
                    # Store in excluded metrics with explanation
                    processed_results['data_quality']['excluded_metrics'][metric_name] = {
                        'reason': validation_detail.get('issues', ['Unknown issue'])[0],
                        'original_value': value,
                        'recommendation': 'This metric could not be calculated due to insufficient data'
                    }
                    
                    # Don't include in main fairness metrics
                    continue
                    
                elif recommendation == 'flag_for_review':
                    # Include but mark as flagged
                    processed_results['fairness_metrics'][metric_name] = {
                        'value': value,
                        'status': 'flagged',
                        'confidence': 'low',
                        'warning': validation_detail.get('issues', ['Value outside expected range'])[0],
                        'recommendation': 'Review manually - value may be unreliable'
                    }
                    
                    # Store in flagged metrics
                    processed_results['data_quality']['flagged_metrics'][metric_name] = {
                        'reason': validation_detail.get('issues', ['Unknown issue'])[0],
                        'value': value,
                        'recommendation': 'Review manually'
                    }
        
        # Add data quality insights
        processed_results['data_quality']['insights'] = self._generate_data_quality_insights(validation_results)
        
        self.processed_results = processed_results
        return processed_results
    
    def _calculate_data_quality_score(self, validation_results: Dict[str, Any]) -> float:
        """Calculate a data quality score from 0.0 to 1.0."""
        total = validation_results.get('total_metrics', 0)
        if total == 0:
            return 0.0
        
        valid = validation_results.get('valid_metrics', 0)
        excluded = validation_results.get('excluded_metrics', 0)
        flagged = validation_results.get('flagged_metrics', 0)
        
        # Weight: valid=1.0, flagged=0.5, excluded=0.0
        score = (valid + (flagged * 0.5)) / total
        return round(score, 3)
    
    def _generate_data_quality_insights(self, validation_results: Dict[str, Any]) -> List[str]:
        """Generate insights about data quality."""
        insights = []
        
        total = validation_results.get('total_metrics', 0)
        valid = validation_results.get('valid_metrics', 0)
        excluded = validation_results.get('excluded_metrics', 0)
        flagged = validation_results.get('flagged_metrics', 0)
        
        if total > 0:
            valid_percentage = (valid / total) * 100
            insights.append(f"Data Quality: {valid_percentage:.1f}% of metrics are reliable")
        
        if excluded > 0:
            insights.append(f"WARNING: {excluded} metrics couldn't be calculated due to insufficient data")
            insights.append("   This may indicate demographic imbalance or small sample sizes")
        
        if flagged > 0:
            insights.append(f"FLAGGED: {flagged} metrics have values outside expected ranges")
            insights.append("   These should be reviewed manually before reporting")
        
        if valid_percentage >= 90:
            insights.append("STATUS: Overall data quality is excellent")
        elif valid_percentage >= 75:
            insights.append("STATUS: Overall data quality is good")
        elif valid_percentage >= 50:
            insights.append("STATUS: Overall data quality is fair - some metrics may be unreliable")
        else:
            insights.append("STATUS: Overall data quality is poor - many metrics are unreliable")
        
        return insights
    
    def save_processed_results(self, output_path: str, include_raw: bool = False) -> None:
        """
        Save processed results to file.
        
        Args:
            output_path: Path to save the processed results
            include_raw: Whether to include raw validation details
        """
        if not self.processed_results:
            raise ValueError("No processed results to save. Call process_comprehensive_results first.")
        
        # Prepare output data
        output_data = self.processed_results.copy()
        
        # Ensure output directory exists
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Save to file
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2, default=str)
        
        print(f"✅ Processed results saved to: {output_path}")
    
    def generate_user_friendly_report(self) -> str:
        """Generate a user-friendly report from processed results."""
        if not self.processed_results:
            return "No processed results available."
        
        report = []
        report.append("📊 FAIRNESS EVALUATION REPORT")
        report.append("=" * 50)
        
        # Data quality summary
        data_quality = self.processed_results['data_quality']
        quality_score = data_quality.get('data_quality_score', 0.0)
        
        report.append(f"🔍 Data Quality Score: {quality_score:.1%}")
        
        # Insights
        insights = data_quality.get('insights', [])
        if insights:
            report.append(f"\n💡 Key Insights:")
            for insight in insights:
                report.append(f"   {insight}")
        
        # Fairness metrics summary
        fairness_metrics = self.processed_results.get('fairness_metrics', {})
        valid_metrics = {k: v for k, v in fairness_metrics.items() if v.get('status') == 'valid'}
        flagged_metrics = {k: v for k, v in fairness_metrics.items() if v.get('status') == 'flagged'}
        
        report.append(f"\n📈 Fairness Metrics Summary:")
        report.append(f"   ✅ Reliable metrics: {len(valid_metrics)}")
        report.append(f"   ⚠️  Flagged metrics: {len(flagged_metrics)}")
        
        # Performance metrics
        performance = self.processed_results.get('performance', {})
        if performance:
            report.append(f"\n🎯 Performance Metrics:")
            for metric, value in performance.items():
                report.append(f"   {metric.replace('_', ' ').title()}: {value:.4f}")
        
        # Recommendations
        report.append(f"\nRECOMMENDATIONS:")
        if flagged_metrics:
            report.append(f"   • Review {len(flagged_metrics)} flagged metrics before making decisions")
        
        excluded_count = len(data_quality.get('excluded_metrics', {}))
        if excluded_count > 0:
            report.append(f"   • {excluded_count} metrics couldn't be calculated - consider collecting more data")
        
        if quality_score >= 0.8:
            report.append("   • Data quality is good - results are reliable for decision-making")
        elif quality_score >= 0.6:
            report.append("   • Data quality is acceptable - use results with caution")
        else:
            report.append("   • Data quality is poor - results should not be used for decision-making")
        
        return "\n".join(report)


def process_and_save_results(input_file: str, output_file: str = None, include_raw: bool = False) -> None:
    """
    Convenience function to process and save results.
    
    Args:
        input_file: Path to input results JSON file
        output_file: Path to output processed results (optional)
        include_raw: Whether to include raw validation details
    """
    try:
        # Load input results
        with open(input_file, 'r') as f:
            results = json.load(f)
        
        # Process results
        processor = EnhancedResultsProcessor()
        processed_results = processor.process_comprehensive_results(results)
        
        # Generate output filename if not provided
        if output_file is None:
            input_path = Path(input_file)
            output_file = input_path.parent / "clean_results.json"
        
        # Save processed results
        processor.save_processed_results(str(output_file), include_raw=include_raw)
        
        # Generate and display report
        report = processor.generate_user_friendly_report()
        print("\n" + report)
        
    except Exception as e:
        print(f"❌ Error processing results: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Test the processor
    print("🧪 Testing Enhanced Results Processor")
    print("=" * 45)
    
    # Test with our current results
    test_file = "artifacts/comprehensive_fairness_evaluation.json"
    if Path(test_file).exists():
        print(f"Processing {test_file}...")
        process_and_save_results(test_file, "artifacts/clean_results.json")
    else:
        print(f"Test file {test_file} not found. Run comprehensive evaluation first.")
