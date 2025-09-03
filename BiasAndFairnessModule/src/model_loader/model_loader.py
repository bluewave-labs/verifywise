from typing import List, Optional, Union, Dict, Any, TYPE_CHECKING

import torch
from transformers import (AutoModelForCausalLM, AutoTokenizer,
                          GenerationConfig, PreTrainedModel,
                          PreTrainedTokenizer)

from ..core.config import HuggingFaceModelConfig, PromptingConfig
from ..prompts.base import PromptInput
from ..prompts.registry import get_formatter

if TYPE_CHECKING:
    from ..core.config import ConfigManager

import joblib
import os

def load_sklearn_model(model_path):
    """Load a scikit-learn model from a joblib file."""
    if os.path.exists(model_path):
        return joblib.load(model_path)
    else:
        raise FileNotFoundError(f"Model not found at {model_path}")


class ModelLoader:
    """Handles loading and inference for language models."""

    def __init__(
        self,
        hf_config: HuggingFaceModelConfig,
        prompting_config: PromptingConfig,
    ):
        """Initialize the model loader with explicit configs.

        Args:
            hf_config (HuggingFaceModelConfig): Hugging Face model configuration
            prompting_config (PromptingConfig): Prompt formatting configuration
        """
        self.model_config = hf_config
        self.prompting_config = prompting_config

        self.model: Optional[PreTrainedModel] = None
        self.tokenizer: Optional[PreTrainedTokenizer] = None

        self._initialize_huggingface_model()

    def _initialize_huggingface_model(self) -> None:
        """Initialize the Hugging Face model and tokenizer."""
        config = self.model_config

        # Set device
        device = config.device
        if device == "cuda" and not torch.cuda.is_available():
            print("CUDA not available, falling back to CPU")
            device = "cpu"

        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(config.model_id)
        if not hasattr(tokenizer, "pad_token_id") or tokenizer.pad_token_id is None:
            if hasattr(tokenizer, "eos_token"):
                tokenizer.pad_token = tokenizer.eos_token
            else:
                raise ValueError("Tokenizer must have either pad_token or eos_token")

        self.tokenizer = tokenizer

        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            config.model_id,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            trust_remote_code=True,
        ).to(device)

    def _format_prompt(self, prompt: Union[str, Dict[str, Any]], system_prompt: Optional[str] = None) -> str:
        """Format the prompt using the configured prompt formatter.

        Args:
            prompt (Union[str, Dict[str, Any]]): Raw instruction string or features dict.
            system_prompt (Optional[str]): Optional system prompt override.

        Returns:
            str: Formatted prompt string as required by the model.
        """
        formatter_name = self.prompting_config.formatter
        formatter = get_formatter(formatter_name)

        # Build PromptInput. If user passed a preformatted string, treat it as instruction
        if isinstance(prompt, str):
            features: Dict[str, Any] = {}
            instruction = prompt
        else:
            features = prompt
            instruction = self.prompting_config.instruction

        p = PromptInput(
            instruction=instruction,
            features=features,
            system_prompt=system_prompt or self.prompting_config.system_prompt,
            assistant_preamble=self.prompting_config.assistant_preamble,
        )
        return formatter.format(p)

    def predict(
        self, prompts: Union[str, Dict[str, Any], List[Union[str, Dict[str, Any]]]], system_prompt: Optional[str] = None
    ) -> List[str]:
        """Generate responses for the given prompts using model configuration parameters.

        Args:
            prompts (Union[str, Dict[str, Any], List[Union[str, Dict[str, Any]]]]): Input prompt(s) for prediction
            system_prompt (Optional[str], optional): System prompt for the model.
                If None, uses the one from model_config. Defaults to None.

        Returns:
            List[str]: Generated responses

        Raises:
            RuntimeError: If no model is loaded or if the model type is not supported
        """
        if not self.model or not self.tokenizer:
            raise RuntimeError("No model has been loaded. Check your configuration.")

        # Convert single prompt to list
        if isinstance(prompts, (str, dict)):
            prompts = [prompts]

        # Format prompts for chat
        formatted_prompts = [self._format_prompt(p, system_prompt) for p in prompts]

        # Get generation config from model config
        config = self.model_config

        # Tokenize inputs
        inputs = self.tokenizer(
            formatted_prompts,
            padding=True,
            padding_side="left",
            truncation=True,
            return_tensors="pt",
        )

        # Move inputs to model device
        device = next(self.model.parameters()).device
        inputs = {k: v.to(device) for k, v in inputs.items()}

        # Generate
        with torch.no_grad():
            generation_config = GenerationConfig(
                max_new_tokens=config.max_new_tokens,
                temperature=config.temperature,
                top_p=config.top_p,
                do_sample=True,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )
            outputs = self.model.generate(**inputs, generation_config=generation_config)

        # Decode outputs and extract only the assistant's response
        responses = []
        for output in outputs:
            full_response = self.tokenizer.decode(output, skip_special_tokens=True)
            # Extract only the assistant's response
            assistant_response = full_response.split("<|assistant|>")[-1].strip()
            responses.append(assistant_response)

        return responses

    @classmethod
    def from_config_manager(cls, cfg_mgr: "ConfigManager") -> "ModelLoader":
        """
        Convenience constructor:
        - pulls `model.huggingface` and `prompting` blocks from your YAML
        """
        # Convert to a plain dict for robust access
        if hasattr(cfg_mgr, "config") and hasattr(cfg_mgr.config, "dict"):
            cfg_dict = cfg_mgr.config.dict()
        else:
            cfg_dict = cfg_mgr.config  # type: ignore[assignment]

        m = cfg_dict["model"]["huggingface"]
        p = cfg_dict["prompting"]

        hf_config = HuggingFaceModelConfig(
            enabled=m.get("enabled", True),
            model_id=m["model_id"],
            device=m.get("device", "cuda"),
            max_new_tokens=m.get("max_new_tokens", 512),
            temperature=m.get("temperature", 0.7),
            top_p=m.get("top_p", 0.9),
            # keep this field but it’s no longer used for formatting:
            prompt_formatter=m.get("prompt_formatter", p.get("formatter", "tinyllama-chat")),
        )
        prompting_config = PromptingConfig(
            formatter=p.get("formatter", "tinyllama-chat"),
            system_prompt=p.get("system_prompt"),
            instruction=p.get("instruction"),
            assistant_preamble=p.get("assistant_preamble"),
        )
        return cls(hf_config=hf_config, prompting_config=prompting_config)
