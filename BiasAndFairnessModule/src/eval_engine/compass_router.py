from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


def route_metric(task_type: str, label_behavior: str, **kwargs) -> List[str]:
    """
    Route to appropriate fairness metrics based on task type and label behavior.
    
    Implements the decision logic from the Fairness Compass paper (arXiv:2102.08453).
    
    Args:
        task_type: Type of task ("binary_classification", "multiclass_classification", 
                   "regression", "generation", "ranking")
        label_behavior: Type of label behavior ("binary", "continuous", "categorical")
        **kwargs: Additional parameters for fine-grained routing
        
    Returns:
        List[str]: List of applicable fairness metrics
    """
    
    # Initialize metrics list
    metrics = []
    
    # Binary classification tasks
    if task_type == "binary_classification":
        if label_behavior == "binary":
            metrics.extend([
                "demographic_parity",
                "equalized_odds", 
                "equalized_opportunity",
                "predictive_equality",
                "predictive_parity",
                "conditional_use_accuracy_equality"
            ])
        else:
            metrics.extend([
                "demographic_parity",
                "equalized_odds"
            ])
    
    # Multiclass classification tasks
    elif task_type == "multiclass_classification":
        if label_behavior == "categorical":
            metrics.extend([
                "demographic_parity",
                "equalized_odds",
                "multiclass_demographic_parity",
                "multiclass_equalized_odds"
            ])
        else:
            metrics.extend([
                "demographic_parity",
                "equalized_odds"
            ])
    
    # Regression tasks
    elif task_type == "regression":
        if label_behavior == "continuous":
            metrics.extend([
                "balance_for_positive_class",
                "balance_for_negative_class",
                "regression_demographic_parity"
            ])
        else:
            metrics.extend([
                "regression_demographic_parity"
            ])
    
    # Generation tasks (LLM evaluation)
    elif task_type == "generation":
        metrics.extend([
            "toxicity_gap",
            "sentiment_gap", 
            "stereotype_gap",
            "exposure_disparity",
            "representation_disparity",
            "prompt_fairness"
        ])
    
    # Ranking tasks
    elif task_type == "ranking":
        metrics.extend([
            "ranking_demographic_parity",
            "ranking_equalized_odds",
            "exposure_disparity"
        ])
    
    else:
        logger.warning(f"Unknown task_type: {task_type}, using default metrics")
        metrics.extend([
            "demographic_parity",
            "equalized_odds"
        ])
    
    # Add common metrics for all tasks
    metrics.extend([
        "accuracy_difference",
        "precision_difference", 
        "recall_difference",
        "f1_difference"
    ])
    
    # Remove duplicates while preserving order
    seen = set()
    unique_metrics = []
    for metric in metrics:
        if metric not in seen:
            seen.add(metric)
            unique_metrics.append(metric)
    
    logger.info(f"Routed {len(unique_metrics)} metrics for {task_type}/{label_behavior}")
    return unique_metrics


def get_task_type_from_config(model_type: str, output_type: str) -> str:
    """
    Determine task type from model configuration.
    
    Args:
        model_type: Type of model ("llm", "tabular", "ranking")
        output_type: Type of output ("classification", "regression", "generation")
        
    Returns:
        str: Task type for metric routing
    """
    if model_type == "llm":
        return "generation"
    elif model_type == "tabular":
        if output_type == "classification":
            return "binary_classification"  # Default, can be overridden
        elif output_type == "regression":
            return "regression"
        else:
            return "binary_classification"
    elif model_type == "ranking":
        return "ranking"
    else:
        return "binary_classification"  # Default fallback


def get_label_behavior_from_data(y: Optional[List], task_type: str) -> str:
    """
    Determine label behavior from data characteristics.
    
    Args:
        y: Target labels
        task_type: Task type
        
    Returns:
        str: Label behavior type
    """
    if task_type == "generation":
        return "continuous"  # Generation tasks typically have continuous outputs
    
    if y is None:
        return "binary"  # Default fallback
    
    # Analyze label distribution
    unique_values = set(y)
    n_unique = len(unique_values)
    
    if n_unique == 2:
        return "binary"
    elif n_unique <= 10:
        return "categorical"
    else:
        return "continuous"


def validate_metric_availability(metrics: List[str], available_metrics: List[str]) -> List[str]:
    """
    Validate that requested metrics are available.
    
    Args:
        metrics: Requested metrics
        available_metrics: Available metrics
        
    Returns:
        List[str]: Validated metrics that are available
    """
    available_set = set(available_metrics)
    valid_metrics = [metric for metric in metrics if metric in available_set]
    
    missing_metrics = set(metrics) - available_set
    if missing_metrics:
        logger.warning(f"Missing metrics: {missing_metrics}")
    
    return valid_metrics 