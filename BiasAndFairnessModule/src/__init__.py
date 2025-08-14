"""
Bias and Fairness Module

A comprehensive module for evaluating bias and fairness in machine learning models.
"""

# Import main components from subpackages
from .core import ConfigManager, Config
from .model_loader import ModelLoader, load_sklearn_model
from .dataset_loader import DataLoader
from .inference import ModelInferencePipeline, run_comprehensive_evaluation
from .eval_engine import (
    FairnessEvaluator,
    FairnessCompassEngine,
    route_metric,
    PostProcessor,
    summarize_results,
    clean_predictions,
    register_metric,
    get_metric,
    list_metrics
)

__version__ = "0.1.0"
__author__ = "VerifyWise Team"

__all__ = [
    # Core
    'ConfigManager',
    'Config',
    
    # Model Loading
    'ModelLoader',
    'load_sklearn_model',
    
    # Data Loading
    'DataLoader',
    
    # Inference
    'ModelInferencePipeline',
    'run_comprehensive_evaluation',
    
    # Evaluation
    'FairnessEvaluator',
    'FairnessCompassEngine',
    'route_metric',
    'PostProcessor',
    'summarize_results',
    'clean_predictions',
    
    # Metrics
    'register_metric',
    'get_metric',
    'list_metrics'
]
