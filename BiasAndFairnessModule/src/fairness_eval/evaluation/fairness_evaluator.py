# bias_fairness_eval.py

from fairlearn.metrics import MetricFrame, demographic_parity_difference, equalized_odds_difference
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
import joblib
import os


def load_csv_dataset(csv_path, protected_attr):
    df = pd.read_csv(csv_path)
    label_col = df.columns[-1]  # assume label is last column
    X = df.drop(columns=[label_col])
    y = df[label_col]
    A = df[protected_attr]
    return X, y, A


def compute_group_metrics(y_true, y_pred, sensitive_features):
    metric_frame = MetricFrame(
        metrics={
            "Demographic Parity Difference": demographic_parity_difference,
            "Equalized Odds Difference": equalized_odds_difference
        },
        y_true=y_true,
        y_pred=y_pred,
        sensitive_features=sensitive_features
    )
    return metric_frame.overall


def evaluate_fairness(X, y, A, model):
    X_train, X_test, y_train, y_test, A_train, A_test = train_test_split(X, y, A, test_size=0.3, random_state=42, shuffle=True)

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    group_metrics = compute_group_metrics(y_test, y_pred, A_test)
    return {
        "Accuracy": accuracy_score(y_test, y_pred),
        **group_metrics
    }


def identify_model_type(model):
    if isinstance(model, (LogisticRegression, RandomForestClassifier, SVC, MLPClassifier)):
        return "tabular_classification"
    # Future extension: handle LLMs or other model types here
    return "unknown"


def load_model(model_path):
    if os.path.exists(model_path):
        return joblib.load(model_path)
    else:
        raise FileNotFoundError(f"Model not found at {model_path}")


if __name__ == "__main__":
    csv_path = "./adult.csv"  # replace with your dataset
    model_path = "./logreg_model.joblib"  # replace with your model path
    protected_attr = "sex"  # replace with your protected attribute

    print("Loading dataset and model...")
    X, y, A = load_csv_dataset(csv_path, protected_attr)
    model = load_model(model_path)

    model_type = identify_model_type(model)
    print(f"Identified model type: {model_type}")

    if model_type == "tabular_classification":
        print("\nModel Fairness Metrics:")
        model_metrics = evaluate_fairness(X, y, A, model)
        for k, v in model_metrics.items():
            print(f"{k}: {v:.4f}")
    else:
        print("Unsupported model type for fairness evaluation.")
