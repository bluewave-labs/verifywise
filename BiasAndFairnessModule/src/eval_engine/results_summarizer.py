#!/usr/bin/env python3
"""
Results summarizer for the Bias and Fairness Module.
This script provides key insights and recommendations from evaluation results.
"""

import json
import pandas as pd
from pathlib import Path

def summarize_results(results_path: str = 'artifacts/evaluation_results.json') -> None:
    """Summarize the evaluation results and provide insights."""
    
    print("📊 BIAS AND FAIRNESS EVALUATION SUMMARY")
    print("=" * 60)
    
    # Load results
    with open(results_path, 'r') as f:
        results = json.load(f)
    
    # Load post-processed data for additional analysis
    df = pd.read_csv('artifacts/postprocessed_results.csv')
    
    print(f"\n📈 Dataset Overview:")
    print(f"   Total samples: {results['metadata']['total_samples']}")
    print(f"   Protected attributes: {', '.join(results['metadata']['protected_attributes'])}")
    
    # Performance analysis
    print(f"\n🎯 Model Performance:")
    perf = results['performance']
    print(f"   Overall Accuracy: {perf['accuracy']:.1%}")
    print(f"   Precision: {perf['precision']:.1%}")
    print(f"   Recall: {perf['recall']:.1%}")
    print(f"   F1-Score: {perf['f1_score']:.1%}")
    
    # Fairness analysis
    print(f"\n🔍 Fairness Analysis:")
    
    # Demographic parity analysis
    dp_sex = results['fairness']['demographic_parity_sex']
    dp_race = results['fairness']['demographic_parity_race']
    
    print(f"   Demographic Parity (Sex): {dp_sex:.3f}")
    if abs(dp_sex) < 0.1:
        print("     ✅ Good: Low disparity between male and female groups")
    elif abs(dp_sex) < 0.2:
        print("     ⚠️  Moderate: Some disparity between male and female groups")
    else:
        print("     ❌ High: Significant disparity between male and female groups")
    
    print(f"   Demographic Parity (Race): {dp_race:.3f}")
    if abs(dp_race) < 0.1:
        print("     ✅ Good: Low disparity between racial groups")
    elif abs(dp_race) < 0.2:
        print("     ⚠️  Moderate: Some disparity between racial groups")
    else:
        print("     ❌ High: Significant disparity between racial groups")
    
    # Equalized odds analysis
    eo_sex = results['fairness']['equalized_odds_sex']
    eo_race = results['fairness']['equalized_odds_race']
    
    print(f"   Equalized Odds (Sex): {eo_sex:.3f}")
    if abs(eo_sex) < 0.1:
        print("     ✅ Good: Similar true positive and false positive rates")
    elif abs(eo_sex) < 0.2:
        print("     ⚠️  Moderate: Some difference in error rates")
    else:
        print("     ❌ High: Significant difference in error rates")
    
    print(f"   Equalized Odds (Race): {eo_race:.3f}")
    if abs(eo_race) < 0.1:
        print("     ✅ Good: Similar true positive and false positive rates")
    elif abs(eo_race) < 0.2:
        print("     ⚠️  Moderate: Some difference in error rates")
    else:
        print("     ❌ High: Significant difference in error rates")
    
    # Predictive parity analysis
    pp_sex = results['fairness']['predictive_parity_sex']
    pp_race = results['fairness']['predictive_parity_race']
    
    print(f"   Predictive Parity (Sex): {pp_sex:.3f}")
    if abs(pp_sex) < 0.1:
        print("     ✅ Good: Similar positive predictive values")
    elif abs(pp_sex) < 0.2:
        print("     ⚠️  Moderate: Some difference in positive predictive values")
    else:
        print("     ❌ High: Significant difference in positive predictive values")
    
    print(f"   Predictive Parity (Race): {pp_race:.3f}")
    if abs(pp_race) < 0.1:
        print("     ✅ Good: Similar positive predictive values")
    elif abs(pp_race) < 0.2:
        print("     ⚠️  Moderate: Some difference in positive predictive values")
    else:
        print("     ❌ High: Significant difference in positive predictive values")
    
    # Group-specific analysis
    print(f"\n👥 Group-Specific Performance:")
    
    # Sex-based analysis
    male_mask = df['sex'] == 1
    female_mask = df['sex'] == 0
    
    male_accuracy = (df[male_mask]['answer'] == df[male_mask]['prediction']).mean()
    female_accuracy = (df[female_mask]['answer'] == df[female_mask]['prediction']).mean()
    
    print(f"   Male Accuracy: {male_accuracy:.1%} (n={male_mask.sum()})")
    print(f"   Female Accuracy: {female_accuracy:.1%} (n={female_mask.sum()})")
    
    accuracy_diff_sex = abs(male_accuracy - female_accuracy)
    if accuracy_diff_sex < 0.05:
        print("     ✅ Good: Similar accuracy across gender groups")
    elif accuracy_diff_sex < 0.1:
        print("     ⚠️  Moderate: Some accuracy difference across gender groups")
    else:
        print("     ❌ High: Significant accuracy difference across gender groups")
    
    # Race-based analysis
    white_mask = df['race'] == 1
    other_mask = df['race'] == 0
    
    white_accuracy = (df[white_mask]['answer'] == df[white_mask]['prediction']).mean()
    other_accuracy = (df[other_mask]['answer'] == df[other_mask]['prediction']).mean()
    
    print(f"   White Accuracy: {white_accuracy:.1%} (n={white_mask.sum()})")
    print(f"   Black/Other Accuracy: {other_accuracy:.1%} (n={other_mask.sum()})")
    
    accuracy_diff_race = abs(white_accuracy - other_accuracy)
    if accuracy_diff_race < 0.05:
        print("     ✅ Good: Similar accuracy across racial groups")
    elif accuracy_diff_race < 0.1:
        print("     ⚠️  Moderate: Some accuracy difference across racial groups")
    else:
        print("     ❌ High: Significant accuracy difference across racial groups")
    
    # Key insights
    print(f"\n💡 Key Insights:")
    
    if perf['accuracy'] < 0.5:
        print("   • Model performance is below acceptable levels")
    
    if abs(dp_sex) > 0.1 or abs(dp_race) > 0.1:
        print("   • Demographic parity issues detected across protected attributes")
    
    if abs(eo_sex) > 0.1 or abs(eo_race) > 0.1:
        print("   • Equalized odds issues detected, suggesting bias in error rates")
    
    if abs(pp_sex) > 0.1 or abs(pp_race) > 0.1:
        print("   • Predictive parity issues detected, suggesting bias in positive predictive values")
    
    if accuracy_diff_sex > 0.1 or accuracy_diff_race > 0.1:
        print("   • Significant performance disparities across protected groups")
    
    # Recommendations
    print(f"\n🔧 Recommendations:")
    print("   • Consider retraining the model with balanced datasets")
    print("   • Implement post-processing techniques to improve fairness")
    print("   • Review data collection and preprocessing for bias")
    print("   • Consider using fairness-aware training algorithms")
    
    print(f"\n📁 Results saved to: {results_path}")
    print(f"📁 Post-processed data: artifacts/postprocessed_results.csv")

def main():
    """Main entry point for command-line usage."""
    try:
        summarize_results()
        print(f"\n🎉 Summary completed successfully!")
    except Exception as e:
        print(f"\n❌ Summary failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()
