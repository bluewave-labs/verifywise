"""
Evaluation engine package for Bias and Fairness Module.
"""

from .evaluator import FairnessEvaluator
from .evaluation_module import FairnessEvaluator as LegacyFairnessEvaluator
from .fairness_compass_engine import FairnessCompassEngine
from .compass_router import route_metric, get_task_type_from_config, get_label_behavior_from_data
from .metrics import *
from .metric_registry import register_metric, get_metric, list_metrics, remove_metric
from .postprocessing import PostProcessor
from .results_summarizer import summarize_results
from .data_cleaner import clean_predictions

__all__ = [
    'FairnessEvaluator',
    'LegacyFairnessEvaluator', 
    'FairnessCompassEngine',
    'route_metric',
    'get_task_type_from_config',
    'get_label_behavior_from_data',
    'register_metric',
    'get_metric',
    'list_metrics',
    'remove_metric',
    'PostProcessor',
    'summarize_results',
    'clean_predictions'
]
