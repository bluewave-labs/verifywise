from typing import Any, Dict, Optional

from ..core.config import ConfigManager, ModelConfig
from ..core.config import PromptingConfig
from .engine import InferenceEngine
from .clients.openai_chat import OpenAIChatClient


def build_engine(
    config_manager: ConfigManager,
    *,
    api_key: Optional[str] = None,
) -> InferenceEngine:
    """Create an InferenceEngine based on the configured model provider.

    For now, only remote OpenAI-style providers are implemented. Hugging Face local
    models are intentionally skipped per instruction.
    """
    model_cfg: ModelConfig = config_manager.get_model_config()
    prompting_cfg: PromptingConfig = config_manager.get_prompting_config()

    provider = (model_cfg.provider or "").strip().lower()

    gen_params: Dict[str, Any] = {
        "max_new_tokens": model_cfg.max_new_tokens,
        "temperature": model_cfg.temperature,
        "top_p": model_cfg.top_p,
    }

    if provider == "openai":
        if not api_key:
            raise ValueError("API key is required for OpenAI provider")
        client = OpenAIChatClient(
            base_url=model_cfg.base_url,
            api_key=api_key,
            model_id=model_cfg.model_id,
            timeout=30.0,
        )
        return InferenceEngine(client=client, gen_params=gen_params, prompting_config=prompting_cfg)

    # Placeholder for future providers; deliberately skip Hugging Face implementation
    raise ValueError(f"Unsupported or unimplemented provider: {model_cfg.provider}")


