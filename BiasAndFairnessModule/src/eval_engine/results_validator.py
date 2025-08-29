"""
Results Validator for Bias and Fairness Metrics

This module validates metric results and identifies problematic values that shouldn't
be presented to users as legitimate metrics.
"""

from typing import Dict, List, Any, Tuple
import json
import numpy as np


class MetricResultValidator:
    """Validates metric results and identifies problematic values."""
    
    # Special values that indicate "no data" or "calculation failed"
    PROBLEMATIC_VALUES = {
        -1.0: "no_data_available",
        float('inf'): "infinite_value", 
        float('-inf'): "negative_infinite_value",
        float('nan'): "not_a_number"
    }
    
    # Thresholds for suspicious values
    SUSPICIOUS_THRESHOLDS = {
        'demographic_parity': {'min': 0.0, 'max': 1.0},
        'equalized_odds': {'min': 0.0, 'max': 1.0},
        'predictive_parity': {'min': 0.0, 'max': 1.0},
        'balance_positive_class': {'min': 0.0, 'max': 1.0},
        'balance_negative_class': {'min': 0.0, 'max': 1.0},
        'calibration': {'min': 0.0, 'max': 1.0}
    }
    
    def __init__(self):
        self.validation_results = {}
        self.problematic_metrics = {}
        self.clean_metrics = {}
    
    def validate_metric_result(self, metric_name: str, value: Any, protected_attribute: str = None) -> Dict[str, Any]:
        """
        Validate a single metric result.
        
        Args:
            metric_name: Name of the metric
            value: The metric value
            protected_attribute: Protected attribute (e.g., 'sex', 'race')
            
        Returns:
            Dict with validation results
        """
        full_metric_name = f"{metric_name}_{protected_attribute}" if protected_attribute else metric_name
        
        validation_result = {
            'metric_name': full_metric_name,
            'value': value,
            'is_valid': True,
            'issues': [],
            'recommendation': 'metric_ok'
        }
        
        # Check for problematic special values
        if value in self.PROBLEMATIC_VALUES:
            validation_result['is_valid'] = False
            validation_result['issues'].append(f"Special value: {self.PROBLEMATIC_VALUES[value]}")
            validation_result['recommendation'] = 'exclude_from_report'
            return validation_result
        
        # Check for NaN or infinite values
        if isinstance(value, (int, float)):
            if np.isnan(value):
                validation_result['is_valid'] = False
                validation_result['issues'].append("Value is NaN")
                validation_result['recommendation'] = 'exclude_from_report'
                return validation_result
            
            if np.isinf(value):
                validation_result['is_valid'] = False
                validation_result['issues'].append("Value is infinite")
                validation_result['recommendation'] = 'exclude_from_report'
                return validation_result
        
        # Check for suspicious values based on metric type
        if metric_name in self.SUSPICIOUS_THRESHOLDS:
            thresholds = self.SUSPICIOUS_THRESHOLDS[metric_name]
            if isinstance(value, (int, float)):
                if value < thresholds['min'] or value > thresholds['max']:
                    validation_result['is_valid'] = False
                    validation_result['issues'].append(
                        f"Value {value} outside expected range [{thresholds['min']}, {thresholds['max']}]"
                    )
                    validation_result['recommendation'] = 'flag_for_review'
        
        return validation_result
    
    def validate_comprehensive_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate comprehensive fairness evaluation results.
        
        Args:
            results: Results from comprehensive evaluation
            
        Returns:
            Dict with validation results and cleaned data
        """
        validation_summary = {
            'total_metrics': 0,
            'valid_metrics': 0,
            'problematic_metrics': 0,
            'excluded_metrics': 0,
            'flagged_metrics': 0,
            'validation_details': {},
            'clean_results': {},
            'problematic_summary': {}
        }
        
        # Extract fairness metrics
        fairness_metrics = results.get('fairness_metrics', {})
        
        for metric_name, value in fairness_metrics.items():
            validation_summary['total_metrics'] += 1
            
            # Parse metric name to extract base metric and protected attribute
            if '_' in metric_name:
                parts = metric_name.split('_')
                if len(parts) >= 2:
                    base_metric = '_'.join(parts[:-1])  # Everything except last part
                    protected_attribute = parts[-1]  # Last part (sex, race, etc.)
                else:
                    base_metric = metric_name
                    protected_attribute = None
            else:
                base_metric = metric_name
                protected_attribute = None
            
            # Validate the metric
            validation_result = self.validate_metric_result(base_metric, value, protected_attribute)
            validation_summary['validation_details'][metric_name] = validation_result
            
            if validation_result['is_valid']:
                validation_summary['valid_metrics'] += 1
                validation_summary['clean_results'][metric_name] = value
            else:
                validation_summary['problematic_metrics'] += 1
                
                if validation_result['recommendation'] == 'exclude_from_report':
                    validation_summary['excluded_metrics'] += 1
                elif validation_result['recommendation'] == 'flag_for_review':
                    validation_summary['flagged_metrics'] += 1
                
                # Store problematic metrics for summary
                issue_type = validation_result['issues'][0] if validation_result['issues'] else 'unknown'
                if issue_type not in validation_summary['problematic_summary']:
                    validation_summary['problematic_summary'][issue_type] = []
                validation_summary['problematic_summary'][issue_type].append(metric_name)
        
        return validation_summary
    
    def generate_validation_report(self, validation_results: Dict[str, Any]) -> str:
        """
        Generate a human-readable validation report.
        
        Args:
            validation_results: Results from validate_comprehensive_results
            
        Returns:
            Formatted report string
        """
        report = []
        report.append("🔍 METRIC VALIDATION REPORT")
        report.append("=" * 50)
        
        # Summary
        report.append(f"📊 Summary:")
        report.append(f"   Total metrics: {validation_results['total_metrics']}")
        report.append(f"   ✅ Valid metrics: {validation_results['valid_metrics']}")
        report.append(f"   ⚠️  Problematic metrics: {validation_results['problematic_metrics']}")
        report.append(f"   🚫 Excluded from report: {validation_results['excluded_metrics']}")
        report.append(f"   🚩 Flagged for review: {validation_results['flagged_metrics']}")
        
        # Problematic metrics breakdown
        if validation_results['problematic_summary']:
            report.append(f"\n🚨 Problematic Metrics Breakdown:")
            for issue_type, metrics in validation_results['problematic_summary'].items():
                report.append(f"   {issue_type}: {len(metrics)} metrics")
                for metric in metrics[:5]:  # Show first 5
                    report.append(f"     - {metric}")
                if len(metrics) > 5:
                    report.append(f"     ... and {len(metrics) - 5} more")
        
        # Recommendations
        report.append(f"\n💡 Recommendations:")
        if validation_results['excluded_metrics'] > 0:
            report.append(f"   • {validation_results['excluded_metrics']} metrics should be excluded from user reports")
            report.append(f"   • These metrics couldn't be calculated due to insufficient data")
        
        if validation_results['flagged_metrics'] > 0:
            report.append(f"   • {validation_results['flagged_metrics']} metrics should be flagged for manual review")
            report.append(f"   • These metrics have values outside expected ranges")
        
        if validation_results['problematic_metrics'] == 0:
            report.append(f"   • All metrics are valid and ready for reporting")
        
        return "\n".join(report)
    
    def get_clean_results_for_reporting(self, validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get cleaned results suitable for user-facing reports.
        
        Args:
            validation_results: Results from validate_comprehensive_results
            
        Returns:
            Dict with only valid metrics and problematic metrics marked
        """
        clean_results = {
            'valid_metrics': validation_results['clean_results'],
            'excluded_metrics': {},
            'flagged_metrics': {}
        }
        
        # Add excluded metrics with explanation
        for metric_name, validation_detail in validation_results['validation_details'].items():
            if validation_detail['recommendation'] == 'exclude_from_report':
                clean_results['excluded_metrics'][metric_name] = {
                    'reason': validation_detail['issues'][0] if validation_detail['issues'] else 'No data available',
                    'original_value': validation_detail['value']
                }
            
            elif validation_detail['recommendation'] == 'flag_for_review':
                clean_results['flagged_metrics'][metric_name] = {
                    'reason': validation_detail['issues'][0] if validation_detail['issues'] else 'Value outside expected range',
                    'value': validation_detail['value'],
                    'recommendation': 'Review manually'
                }
        
        return clean_results


def validate_fairness_results(results_file_path: str) -> Dict[str, Any]:
    """
    Convenience function to validate fairness results from a JSON file.
    
    Args:
        results_file_path: Path to the results JSON file
        
    Returns:
        Validation results
    """
    try:
        with open(results_file_path, 'r') as f:
            results = json.load(f)
        
        validator = MetricResultValidator()
        validation_results = validator.validate_comprehensive_results(results)
        
        # Generate report
        report = validator.generate_validation_report(validation_results)
        print(report)
        
        return validation_results
        
    except Exception as e:
        print(f"❌ Error validating results: {str(e)}")
        return {}


if __name__ == "__main__":
    # Test the validator
    print("🧪 Testing Metric Result Validator")
    print("=" * 40)
    
    validator = MetricResultValidator()
    
    # Test cases
    test_cases = [
        ("demographic_parity", 0.5, "sex"),
        ("balance_positive_class", -1.0, "race"),  # Problematic: no data
        ("equalized_odds", 1.5, "sex"),  # Problematic: outside range
        ("calibration", 0.8, "race"),  # Valid
        ("demographic_parity", float('nan'), "sex"),  # Problematic: NaN
    ]
    
    for metric_name, value, protected_attribute in test_cases:
        result = validator.validate_metric_result(metric_name, value, protected_attribute)
        status = "✅" if result['is_valid'] else "❌"
        print(f"{status} {metric_name}_{protected_attribute}: {value} -> {result['recommendation']}")
        if result['issues']:
            print(f"   Issues: {', '.join(result['issues'])}")
