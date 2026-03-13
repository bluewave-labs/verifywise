import litellm
from fastapi import APIRouter, Request

from src.config import settings
from src.services.cost_service import validate_model

router = APIRouter()


@router.get("/v1/models")
async def list_models(request: Request):
    """Return list of supported models grouped by provider."""
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

    return {
        "providers": sorted(models_by_provider.keys()),
        "models": models_by_provider,
        "total": len(litellm.model_cost),
    }


@router.get("/v1/models/{model:path}/validate")
async def validate_model_endpoint(request: Request, model: str):
    """Validate a model string and return its info."""
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
