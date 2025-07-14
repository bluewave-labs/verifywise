from typing import List, Optional, Union

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from transformers.modeling_utils import PreTrainedModel
from transformers.tokenization_utils import PreTrainedTokenizer

from .config import ConfigManager, HuggingFaceModelConfig


class ModelLoader:
    """Handles loading and inference for language models."""

    def __init__(self, config_manager: Optional[ConfigManager] = None):
        """Initialize the model loader.

        Args:
            config_manager (Optional[ConfigManager]): Configuration manager instance.
                If None, uses the default config manager.
        """
        if config_manager is None:
            config_manager = ConfigManager()

        self.config = config_manager.get_model_config()
        self.model: Optional[PreTrainedModel] = None
        self.tokenizer: Optional[PreTrainedTokenizer] = None

        if self.config.huggingface.enabled:
            self._initialize_huggingface_model()

    def _initialize_huggingface_model(self) -> None:
        """Initialize the Hugging Face model and tokenizer."""
        config = self.config.huggingface

        # Set device
        device = config.device
        if device == "cuda" and not torch.cuda.is_available():
            print("CUDA not available, falling back to CPU")
            device = "cpu"

        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            config.model_id, trust_remote_code=True
        )
        if not self.tokenizer.pad_token_id:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            config.model_id,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            trust_remote_code=True,
        ).to(device)

    def _format_prompt(self, prompt: str) -> str:
        """Format the prompt for TinyLlama chat model.

        Args:
            prompt (str): The raw prompt

        Returns:
            str: Formatted prompt following TinyLlama chat format
        """
        return f"<|system|>You are a helpful AI assistant.<|user|>{prompt}<|assistant|>"

    def generate(
        self,
        prompts: Union[str, List[str]],
        max_length: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
    ) -> List[str]:
        """Generate responses for the given prompts.

        Args:
            prompts (Union[str, List[str]]): Input prompt(s) for generation
            max_length (Optional[int]): Override config max_length if provided
            temperature (Optional[float]): Override config temperature if provided
            top_p (Optional[float]): Override config top_p if provided

        Returns:
            List[str]: Generated responses

        Raises:
            RuntimeError: If no model is loaded or if the model type is not supported
        """
        if not self.model or not self.tokenizer:
            raise RuntimeError("No model has been loaded. Check your configuration.")

        # Convert single prompt to list
        if isinstance(prompts, str):
            prompts = [prompts]

        # Format prompts for chat
        formatted_prompts = [self._format_prompt(p) for p in prompts]

        # Get generation config from model config
        config = self.config.huggingface
        max_length = max_length or config.max_length
        temperature = temperature or config.temperature
        top_p = top_p or config.top_p

        # Tokenize inputs
        inputs = self.tokenizer(
            formatted_prompts, padding=True, truncation=True, return_tensors="pt"
        )

        # Move inputs to model device
        device = next(self.model.parameters()).device
        inputs = {k: v.to(device) for k, v in inputs.items()}

        # Generate
        with torch.no_grad():
            generation_kwargs = {
                "input_ids": inputs["input_ids"],
                "attention_mask": inputs.get("attention_mask", None),
                "max_new_tokens": max_length,
                "temperature": temperature,
                "top_p": top_p,
                "do_sample": True,
                "pad_token_id": self.tokenizer.pad_token_id,
                "eos_token_id": self.tokenizer.eos_token_id,
            }
            outputs = self.model.generate(**generation_kwargs)

        # Decode outputs and extract only the assistant's response
        responses = []
        for output in outputs:
            full_response = self.tokenizer.decode(output, skip_special_tokens=True)
            # Extract only the assistant's response
            assistant_response = full_response.split("<|assistant|>")[-1].strip()
            responses.append(assistant_response)

        return responses
