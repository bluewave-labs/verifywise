"""
Bias and Fairness Module

A comprehensive module for evaluating bias and fairness in machine learning models.
"""

# Import main components from subpackages
from .core import ConfigManager, Config
from .model_loader import ModelLoader, load_sklearn_model
from .dataset_loader import DataLoader
from .inference import ModelInferencePipeline
from .eval_engine import (
    PostProcessor,
    summarize_results,
    clean_predictions
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
    
    # Evaluation
    'PostProcessor',
    'summarize_results',
    'clean_predictions'
]
