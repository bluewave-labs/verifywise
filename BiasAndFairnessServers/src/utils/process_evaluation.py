import io
import pandas as pd
import joblib
import json
import asyncio
from typing import List, Dict, Any
from fairlearn.metrics import (
    MetricFrame, 
    selection_rate, 
    true_positive_rate, 
    true_negative_rate, 
    demographic_parity_difference, 
    equal_opportunity_difference, 
    equalized_odds_difference
)
from sklearn.metrics import accuracy_score, classification_report
from database.redis import set_job_status

async def process_evaluation(
    evaluation_id: str,
    model_data: Dict[str, Any],
    dataset_data: Dict[str, Any],
    target_column: str,
    sensitive_columns: List[str],
    evaluation_metrics: List[str],
    fairness_threshold: float,
    bias_detection_methods: List[str],
    tenant: str
):
    """
    Process an advanced bias and fairness evaluation.
    """
    try:
        # Update status to running
        await set_job_status(evaluation_id, {
            "status": "running",
            "progress": 10,
            "message": "Loading model and dataset..."
        })
        
        # Load the trained pipeline model
        model = joblib.load(io.BytesIO(model_data["content"]))
        
        await set_job_status(evaluation_id, {
            "status": "running",
            "progress": 30,
            "message": "Processing dataset..."
        })
        
        # Load and prepare data
        data = pd.read_csv(io.BytesIO(dataset_data["content"]))
        
        await set_job_status(evaluation_id, {
            "status": "running",
            "progress": 50,
            "message": "Running predictions..."
        })
        
        X = data.drop(columns=[target_column] + sensitive_columns)
        y = data[target_column]
        
        # Predict using the pipeline
        y_pred = model.predict(X)
        
        await set_job_status(evaluation_id, {
            "status": "running",
            "progress": 70,
            "message": "Calculating fairness metrics..."
        })
        
        # Initialize results
        results = {
            "fairness_metrics": {},
            "bias_analysis": {},
            "recommendations": [],
            "model_performance": {},
            "data_summary": {}
        }
        
        # Calculate basic model performance
        results["model_performance"] = {
            "accuracy": float(accuracy_score(y, y_pred)),
            "classification_report": classification_report(y, y_pred, output_dict=True)
        }
        
        # Calculate fairness metrics for each sensitive column
        for sensitive_col in sensitive_columns:
            if sensitive_col in data.columns:
                sensitive_feature = data[sensitive_col]
                
                # Basic fairness metrics
                metric_frame = MetricFrame(
                    metrics={
                        "accuracy": accuracy_score,
                        "selection_rate": selection_rate,
                        "TPR": true_positive_rate,
                        "TNR": true_negative_rate,
                    },
                    y_true=y,
                    y_pred=y_pred,
                    sensitive_features=sensitive_feature,
                )
                
                # Calculate fairness differences
                demo_parity_diff = float(demographic_parity_difference(y, y_pred, sensitive_features=sensitive_feature))
                equal_opp_diff = float(equal_opportunity_difference(y, y_pred, sensitive_features=sensitive_feature))
                equalized_odds_diff = float(equalized_odds_difference(y, y_pred, sensitive_features=sensitive_feature))
                
                results["fairness_metrics"][sensitive_col] = {
                    "overall": metric_frame.overall.to_dict(),
                    "by_group": {metric: {k: v for k, v in group.items() if k != sensitive_col} 
                                for metric, group in metric_frame.by_group.to_dict().items()},
                    "demographic_parity_difference": demo_parity_diff,
                    "equal_opportunity_difference": equal_opp_diff,
                    "equalized_odds_difference": equalized_odds_diff
                }
                
                # Bias analysis
                bias_detected = []
                if abs(demo_parity_diff) > fairness_threshold:
                    bias_detected.append(f"Demographic parity bias detected (difference: {demo_parity_diff:.4f})")
                if abs(equal_opp_diff) > fairness_threshold:
                    bias_detected.append(f"Equal opportunity bias detected (difference: {equal_opp_diff:.4f})")
                if abs(equalized_odds_diff) > fairness_threshold:
                    bias_detected.append(f"Equalized odds bias detected (difference: {equalized_odds_diff:.4f})")
                
                results["bias_analysis"][sensitive_col] = {
                    "bias_detected": bias_detected,
                    "fairness_threshold": fairness_threshold,
                    "recommendations": generate_bias_recommendations(
                        demo_parity_diff, equal_opp_diff, equalized_odds_diff, fairness_threshold
                    )
                }
        
        # Data summary
        results["data_summary"] = {
            "total_samples": len(data),
            "target_distribution": data[target_column].value_counts().to_dict(),
            "sensitive_columns_summary": {
                col: {
                    "unique_values": int(data[col].nunique()),
                    "distribution": data[col].value_counts().to_dict()
                } for col in sensitive_columns if col in data.columns
            }
        }
        
        # Generate overall recommendations
        results["recommendations"] = generate_overall_recommendations(results, fairness_threshold)
        
        await set_job_status(evaluation_id, {
            "status": "completed",
            "progress": 100,
            "message": "Evaluation completed successfully",
            "results": results
        })
        
    except Exception as e:
        await set_job_status(evaluation_id, {
            "status": "failed",
            "progress": 0,
            "message": f"Evaluation failed: {str(e)}",
            "error": str(e)
        })

def generate_bias_recommendations(
    demo_parity_diff: float,
    equal_opp_diff: float,
    equalized_odds_diff: float,
    threshold: float
) -> List[str]:
    """
    Generate specific recommendations based on bias metrics.
    """
    recommendations = []
    
    if abs(demo_parity_diff) > threshold:
        recommendations.append("Consider using demographic parity constraints during model training")
        recommendations.append("Review feature engineering to ensure no proxy discrimination")
    
    if abs(equal_opp_diff) > threshold:
        recommendations.append("Implement equal opportunity constraints in the model")
        recommendations.append("Consider using post-processing techniques like equalized odds")
    
    if abs(equalized_odds_diff) > threshold:
        recommendations.append("Use equalized odds post-processing to reduce bias")
        recommendations.append("Review model calibration across different groups")
    
    if not recommendations:
        recommendations.append("Model appears to be fair according to the specified threshold")
    
    return recommendations

def generate_overall_recommendations(results: Dict[str, Any], threshold: float) -> List[str]:
    """
    Generate overall recommendations based on all results.
    """
    recommendations = []
    
    # Check if any bias was detected
    bias_detected = any(
        len(analysis.get("bias_detected", [])) > 0 
        for analysis in results.get("bias_analysis", {}).values()
    )
    
    if bias_detected:
        recommendations.append("Bias detected in the model. Consider implementing fairness constraints.")
        recommendations.append("Review training data for potential biases and imbalances.")
        recommendations.append("Consider using techniques like adversarial debiasing or reweighting.")
    else:
        recommendations.append("No significant bias detected. Continue monitoring for fairness.")
    
    # Performance recommendations
    accuracy = results.get("model_performance", {}).get("accuracy", 0)
    if accuracy < 0.8:
        recommendations.append("Model accuracy is below 80%. Consider improving model performance.")
    
    # Data quality recommendations
    total_samples = results.get("data_summary", {}).get("total_samples", 0)
    if total_samples < 1000:
        recommendations.append("Dataset size is relatively small. Consider collecting more data for robust fairness analysis.")
    
    return recommendations
