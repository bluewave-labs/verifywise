from typing import Any, Dict, Optional, List

from .clients.base import LLMClient
from ..prompts.base import PromptInput
from ..prompts.registry import get_formatter
from ..core.prompt_config import resolve_prompt_config
from ..core.config import PromptingConfig


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

    def predict(self, features: Dict[str, Any]) -> str:
        """Generate a prediction for a single features dict.

        Args:
            features: Tabular features for one sample.

        Returns:
            Model output text.
        """
        prompt_body = self._format_prompt(features)

        max_new_tokens = int(self.gen_params.get("max_new_tokens", 256))
        temperature = float(self.gen_params.get("temperature", 0.7))
        top_p = float(self.gen_params.get("top_p", 0.9))

        return self.client.generate(
            prompt=prompt_body,  # string or messages list per formatter
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
        )

    def predict_batch(self, features_list: List[Dict[str, Any]]) -> List[str]:
        """Generate predictions for a list of feature dicts.

        Args:
            features_list: List of tabular feature dicts.

        Returns:
            List of model outputs in the same order as inputs.
        """
        outputs: List[str] = []
        max_new_tokens = int(self.gen_params.get("max_new_tokens", 256))
        temperature = float(self.gen_params.get("temperature", 0.7))
        top_p = float(self.gen_params.get("top_p", 0.9))

        for features in features_list:
            prompt_body = self._format_prompt(features)
            out = self.client.generate(
                prompt=prompt_body,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p,
            )
            outputs.append(out)
        return outputs


