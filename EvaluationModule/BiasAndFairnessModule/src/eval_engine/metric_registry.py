"""
Metric Registry Module

This module provides a centralized registry for bias and fairness metrics.
Each metric is registered with a unique name using a decorator pattern.
"""

from typing import Any, Callable, Dict

# Global registry to store all metrics
METRIC_REGISTRY: Dict[str, Callable[..., Any]] = {}


def register_metric(name: str) -> Callable:
    """
    Decorator to register a metric function with the given name.

    Args:
        name (str): The unique name of the metric

    Returns:
        Callable: Decorator function that registers the metric

    Example:
        @register_metric("demographic_parity")
        def demographic_parity_difference(y_true, y_pred, protected_attributes):
            # Implementation here
            pass
    """

    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        if name in METRIC_REGISTRY:
            raise ValueError(f"Metric '{name}' is already registered")
        METRIC_REGISTRY[name] = fn
        return fn

    return decorator


def get_metric(name: str) -> Callable[..., Any]:
    """
    Retrieve a metric function by its name.

    Args:
        name (str): The name of the metric to retrieve

    Returns:
        Callable: The metric function

    Raises:
        KeyError: If no metric is registered with the given name
    """
    if name not in METRIC_REGISTRY:
        raise KeyError(f"No metric registered with name '{name}'")
    return METRIC_REGISTRY[name]


def list_metrics() -> list[str]:
    """
    Get a list of all registered metric names.

    Returns:
        list[str]: List of registered metric names
    """
    return list(METRIC_REGISTRY.keys())


def remove_metric(name: str) -> None:
    """
    Remove a metric from the registry.

    Args:
        name (str): The name of the metric to remove

    Raises:
        KeyError: If no metric is registered with the given name
    """
    if name not in METRIC_REGISTRY:
        raise KeyError(f"No metric registered with name '{name}'")
    del METRIC_REGISTRY[name]
