from typing import Any, Dict, Optional, List, Union, overload

from .clients.base import LLMClient
from ..prompts.base import PromptInput
from ..prompts.registry import get_formatter
from ..core.prompt_config import resolve_prompt_config
from ..core.config import PromptingConfig


Features = Dict[str, Any]


class InferenceEngine:
    """Provider-agnostic inference engine.

    Orchestrates prompt formatting and delegates generation to a concrete
    `LLMClient` implementation.
    """

    def __init__(
        self,
        client: LLMClient,
        gen_params: Dict[str, Any],
        prompting_config: Optional[PromptingConfig] = None,
    ) -> None:
        self.client = client
        self.gen_params = dict(gen_params or {})
        self.prompting_config = prompting_config

    def _format_prompt(self, features: Dict[str, Any]) -> Any:
        """Build the provider-specific prompt body using the configured formatter.

        Returns either a string or an OpenAI-style messages list depending on the
        selected formatter.
        """
        cfg = self.prompting_config
        formatter = get_formatter(cfg.formatter)

        # Merge defaults and formatter-specific options to produce prompt params
        class_defaults = getattr(formatter.__class__, "DEFAULTS", {}) or {}
        resolved = resolve_prompt_config(cfg, class_defaults)
        params = resolved["params"]

        prompt_input = PromptInput(
            instruction=params.get("instruction") or "",
            features=features,
            system_prompt=params.get("system_prompt"),
            assistant_preamble=params.get("assistant_preamble"),
        )
        return formatter.format(prompt_input)

    @overload
    def predict(self, features: Features) -> str: ...

    @overload
    def predict(self, features: List[Features]) -> List[str]: ...

    def predict(self, features: Union[Features, List[Features]]):
        """Generate prediction(s) for one or more feature dicts.

        Accepts a single features dict or a list of them, formats prompts,
        and delegates to the client's batch generation API.
        """
        params = {
            "max_new_tokens": int(self.gen_params.get("max_new_tokens", 256)),
            "temperature": float(self.gen_params.get("temperature", 0.7)),
            "top_p": float(self.gen_params.get("top_p", 0.9)),
        }

        if isinstance(features, dict):
            prompts = [self._format_prompt(features)]
            outputs = self.client.generate_batch(prompts=prompts, **params)
            return outputs[0]

        prompts = [self._format_prompt(f) for f in features]
        return self.client.generate_batch(prompts=prompts, **params)


