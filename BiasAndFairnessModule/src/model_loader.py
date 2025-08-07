from typing import List, Optional, Union

import torch
from transformers import (AutoModelForCausalLM, AutoTokenizer,
                          GenerationConfig, PreTrainedModel,
                          PreTrainedTokenizer)

from .config import HuggingFaceModelConfig

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
        model_id: str,
        device: str = "cuda",
        max_new_tokens: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.9,
        system_prompt: str = "You are a helpful AI assistant.",
    ):
        """Initialize the model loader.

        Args:
            model_id (str): Hugging Face model ID
            device (str, optional): Device to load model on. Defaults to "cuda".
            max_new_tokens (int, optional): Maximum sequence length for generations. Defaults to 512.
            temperature (float, optional): Sampling temperature. Defaults to 0.7.
            top_p (float, optional): Top-p sampling parameter. Defaults to 0.9.
            system_prompt (str, optional): System prompt to be prepended to all model inputs.
                Defaults to "You are a helpful AI assistant."
        """
        self.model_config = HuggingFaceModelConfig(
            enabled=True,
            model_id=model_id,
            device=device,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            system_prompt=system_prompt,
        )

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

    def _format_prompt(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Format the prompt for TinyLlama chat model.

        Args:
            prompt (str): The raw prompt
            system_prompt (Optional[str]): The system prompt, defaults to None.
                If None, uses the one from model_config.

        Returns:
            str: Formatted prompt following TinyLlama chat format
        """
        if system_prompt is None:
            system_prompt = self.model_config.system_prompt
        return f"<|system|>{system_prompt}\n<|user|>{prompt}\n<|assistant|>The predicted income is "

    def predict(
        self, prompts: Union[str, List[str]], system_prompt: Optional[str] = None
    ) -> List[str]:
        """Generate responses for the given prompts using model configuration parameters.

        Args:
            prompts (Union[str, List[str]]): Input prompt(s) for prediction
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
        if isinstance(prompts, str):
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
