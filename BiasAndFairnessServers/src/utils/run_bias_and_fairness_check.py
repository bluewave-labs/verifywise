import io
import pandas as pd
import joblib
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
import json

def analyze_fairness(model_content: bytes, data_content: bytes, target_column: str, sensitive_column: str):
    # Load the trained pipeline model
    model = joblib.load(io.BytesIO(model_content))

    # Load and prepare data
    data = pd.read_csv(io.BytesIO(data_content))
    
    X = data.drop(columns=[target_column])
    y = data[target_column]
    sensitive_feature = data[sensitive_column]

    # Predict using the pipeline
    y_pred = model.predict(X)

    # Compute fairness metrics
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

    result = {
        "overall": metric_frame.overall.to_dict(),
        "by_group": {metric: {k: v for k, v in group.items() if k != sensitive_column} for metric, group in metric_frame.by_group.to_dict().items()},
        "demographic_parity_difference": float(demographic_parity_difference(y, y_pred, sensitive_features=sensitive_feature)),
        "equal_opportunity_difference": float(equal_opportunity_difference(y, y_pred, sensitive_features=sensitive_feature)),
        "equalized_odds_difference": float(equalized_odds_difference(y, y_pred, sensitive_features=sensitive_feature))
    }

    return result