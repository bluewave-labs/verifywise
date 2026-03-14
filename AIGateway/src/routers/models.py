import litellm
from fastapi import APIRouter, Request, HTTPException

from src.middlewares.auth import verify_internal_key
from src.services.cost_service import validate_model

router = APIRouter()

# Cache the model list at module scope — computed once on first import
_cached_models: dict | None = None


def _get_models_grouped() -> dict:
    """Build and cache the grouped models dict."""
    global _cached_models
    if _cached_models is not None:
        return _cached_models

    models_by_provider: dict[str, list[dict]] = {}
    for model_key, info in litellm.model_cost.items():
        if not isinstance(info, dict):
            continue
        provider = info.get("litellm_provider", "unknown")
        if provider not in models_by_provider:
            models_by_provider[provider] = []
        models_by_provider[provider].append(
            {
                "id": model_key,
                "provider": provider,
                "mode": info.get("mode", "chat"),
            }
        )

    _cached_models = {
        "providers": sorted(models_by_provider.keys()),
        "models": models_by_provider,
        "total": len(litellm.model_cost),
    }
    return _cached_models


@router.get("/v1/models")
async def list_models(request: Request):
    """Return list of supported models grouped by provider."""
    verify_internal_key(request)
    return _get_models_grouped()


@router.get("/v1/models/{model:path}/validate")
async def validate_model_endpoint(request: Request, model: str):
    """Validate a model string and return its info."""
    verify_internal_key(request)

    info = validate_model(model)
    if info is None:
        return {"valid": False, "model": model}

    return {
        "valid": True,
        "model": model,
        "info": {
            "max_tokens": info.get("max_tokens"),
            "max_input_tokens": info.get("max_input_tokens"),
            "max_output_tokens": info.get("max_output_tokens"),
            "input_cost_per_token": info.get("input_cost_per_token"),
            "output_cost_per_token": info.get("output_cost_per_token"),
            "supports_vision": info.get("supports_vision", False),
            "supports_function_calling": info.get(
                "supports_function_calling", False
            ),
            "supports_streaming": info.get("supports_native_streaming", True),
            "mode": info.get("mode", "chat"),
        },
    }
