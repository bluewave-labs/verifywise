from typing import List, Optional, Union

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from transformers.modeling_utils import PreTrainedModel
from transformers.tokenization_utils import PreTrainedTokenizer

from .config import HuggingFaceModelConfig


class ModelLoader:
    """Handles loading and inference for language models."""

    def __init__(
        self,
        model_id: str,
        device: str = "cuda",
        max_length: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ):
        """Initialize the model loader.

        Args:
            model_id (str): Hugging Face model ID
            device (str, optional): Device to load model on. Defaults to "cuda".
            max_length (int, optional): Maximum sequence length. Defaults to 512.
            temperature (float, optional): Sampling temperature. Defaults to 0.7.
            top_p (float, optional): Top-p sampling parameter. Defaults to 0.9.
        """
        self.model_config = HuggingFaceModelConfig(
            enabled=True,
            model_id=model_id,
            device=device,
            max_length=max_length,
            temperature=temperature,
            top_p=top_p,
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

    def predict(self, prompts: Union[str, List[str]]) -> List[str]:
        """Generate responses for the given prompts using model configuration parameters.

        Args:
            prompts (Union[str, List[str]]): Input prompt(s) for prediction

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
        config = self.model_config

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
                "max_new_tokens": config.max_length,
                "temperature": config.temperature,
                "top_p": config.top_p,
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
