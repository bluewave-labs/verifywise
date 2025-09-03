from copy import deepcopy
from typing import Any, Dict
from .config import PromptingConfig


def deep_merge(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    out = deepcopy(a)
    for k, v in (b or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def resolve_prompt_config(cfg: PromptingConfig, class_defaults: Dict[str, Any]) -> Dict[str, Any]:
    """
    Resolution order: defaults -> formatter-specific -> class defaults (fill missing).
    The last step is a fill-in, not an overwrite.
    """
    name = cfg.formatter
    # Convert pydantic models to plain dicts, preserving None (so we don't overwrite later)
    defaults = (cfg.defaults.model_dump() if hasattr(cfg, "defaults") and cfg.defaults is not None else {})
    per_fmt_model = (cfg.formatters.get(name) if hasattr(cfg, "formatters") and cfg.formatters is not None else None)
    per_fmt = per_fmt_model.model_dump() if per_fmt_model is not None else {}

    merged = deep_merge(defaults, per_fmt)

    # fill missing keys from class defaults (non-destructive)
    for k, v in class_defaults.items():
        merged.setdefault(k, v)
    return {"name": name, "params": merged}


