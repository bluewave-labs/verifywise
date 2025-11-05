"""
Model Runner for DeepEval Evaluation

Generates responses from language models for evaluation prompts.
"""

import os
from typing import Optional, Dict, Any
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch


class ModelRunner:
    """
    Runs inference on language models to generate responses for evaluation.
    
    Supports HuggingFace models, OpenAI API, and Ollama.
    """
    
    def __init__(
        self,
        model_name: str = "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        provider: str = "huggingface",
        device: Optional[str] = None
    ):
        """
        Initialize model runner.
        
        Args:
            model_name: Name of the model (HuggingFace model ID, OpenAI model name, etc.)
            provider: Provider type ("huggingface", "openai", "ollama")
            device: Device to run on ("cpu", "cuda", "mps"). Auto-detected if None.
        """
        self.model_name = model_name
        self.provider = provider.lower()
        
        if device is None:
            if torch.cuda.is_available():
                self.device = "cuda"
            elif torch.backends.mps.is_available():
                self.device = "mps"
            else:
                self.device = "cpu"
        else:
            self.device = device
        
        self.model = None
        self.tokenizer = None
        
        if self.provider == "huggingface":
            self._load_huggingface_model()
        elif self.provider == "openai":
            self._setup_openai()
        elif self.provider == "anthropic":
            self._setup_anthropic()
        elif self.provider == "gemini":
            self._setup_gemini()
        elif self.provider == "xai":
            self._setup_xai()
        elif self.provider == "mistral":
            self._setup_mistral()
        elif self.provider == "ollama":
            self._setup_ollama()
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        print(f"✓ Model runner initialized: {model_name} on {self.device}")
    
    def _load_huggingface_model(self):
        """Load HuggingFace model."""
        print(f"Loading HuggingFace model: {self.model_name}...")
        
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=torch.float16 if self.device in ["cuda", "mps"] else torch.float32,
            device_map="auto" if self.device == "cuda" else None,
        )
        
        if self.device != "cuda":
            self.model = self.model.to(self.device)
        
        self.model.eval()
    
    def _setup_openai(self):
        """Setup OpenAI API."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        try:
            import openai
            self.openai_client = openai.OpenAI(api_key=api_key)
            print(f"✓ OpenAI API configured")
        except ImportError:
            raise ImportError("openai package not installed. Install with: pip install openai")
    
    def _setup_anthropic(self):
        """Setup Anthropic API."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        
        try:
            import anthropic
            self.anthropic_client = anthropic.Anthropic(api_key=api_key)
            print(f"✓ Anthropic API configured")
        except ImportError:
            raise ImportError("anthropic package not installed. Install with: pip install anthropic")
    
    def _setup_gemini(self):
        """Setup Google Gemini API."""
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY environment variable not set")
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.gemini_client = genai.GenerativeModel(self.model_name)
            print(f"✓ Gemini API configured")
        except ImportError:
            raise ImportError("google-generativeai package not installed. Install with: pip install google-generativeai")
    
    def _setup_xai(self):
        """Setup xAI API using official SDK."""
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("XAI_API_KEY environment variable not set")
        
        try:
            from xai_sdk import Client
            self.xai_client = Client(api_key=api_key)
            print(f"✓ xAI API configured")
        except ImportError:
            raise ImportError("xai-sdk package not installed. Install with: pip install xai-sdk")
    
    def _setup_mistral(self):
        """Setup Mistral API using official SDK."""
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("MISTRAL_API_KEY environment variable not set")
        
        try:
            from mistralai import Mistral
            self.mistral_client = Mistral(api_key=api_key)
            print(f"✓ Mistral API configured")
        except ImportError:
            raise ImportError("mistralai package not installed. Install with: pip install mistralai")
    
    def _setup_ollama(self):
        """Setup Ollama."""
        try:
            import ollama
            self.ollama_client = ollama
            print(f"✓ Ollama configured")
        except ImportError:
            raise ImportError("ollama package not installed. Install with: pip install ollama")
    
    def generate(
        self,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> str:
        """
        Generate a response to the given prompt.
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            
        Returns:
            Generated response text
        """
        if self.provider == "huggingface":
            return self._generate_huggingface(prompt, max_tokens, temperature, top_p)
        elif self.provider == "openai":
            return self._generate_openai(prompt, max_tokens, temperature, top_p)
        elif self.provider == "anthropic":
            return self._generate_anthropic(prompt, max_tokens, temperature, top_p)
        elif self.provider == "gemini":
            return self._generate_gemini(prompt, max_tokens, temperature, top_p)
        elif self.provider == "xai":
            return self._generate_xai(prompt, max_tokens, temperature, top_p)
        elif self.provider == "mistral":
            return self._generate_mistral(prompt, max_tokens, temperature, top_p)
        elif self.provider == "ollama":
            return self._generate_ollama(prompt, max_tokens, temperature, top_p)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
    
    def _generate_huggingface(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        """Generate using HuggingFace model."""
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
            )
        
        # Decode only the generated tokens (skip the input)
        generated_tokens = outputs[0][inputs['input_ids'].shape[1]:]
        response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)
        
        return response.strip()
    
    def _generate_openai(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        """Generate using OpenAI API."""
        response = self.openai_client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
        )
        
        return response.choices[0].message.content.strip()
    
    def _generate_anthropic(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        """Generate using Anthropic API."""
        message = self.anthropic_client.messages.create(
            model=self.model_name,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return message.content[0].text.strip()
    
    def _generate_gemini(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        """Generate using Google Gemini API."""
        generation_config = {
            "max_output_tokens": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
        }
        response = self.gemini_client.generate_content(
            prompt,
            generation_config=generation_config
        )
        return response.text.strip()
    
    def _generate_xai(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        """Generate using xAI official SDK (gRPC-based)."""
        from xai_sdk.chat import user
        
        chat = self.xai_client.chat.create(model=self.model_name)
        chat.append(user(prompt))
        response = chat.sample(
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.message.content.strip()
    
    def _generate_mistral(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        """Generate using Mistral official SDK."""
        chat_response = self.mistral_client.chat.complete(
            model=self.model_name,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
        )
        return chat_response.choices[0].message.content.strip()
    
    def _generate_ollama(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        """Generate using Ollama."""
        response = self.ollama_client.generate(
            model=self.model_name,
            prompt=prompt,
            options={
                "num_predict": max_tokens,
                "temperature": temperature,
                "top_p": top_p,
            }
        )
        
        return response['response'].strip()
    
    def generate_batch(
        self,
        prompts: list[str],
        max_tokens: int = 500,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> list[str]:
        """
        Generate responses for multiple prompts.
        
        Args:
            prompts: List of input prompts
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            
        Returns:
            List of generated responses
        """
        responses = []
        for prompt in prompts:
            response = self.generate(prompt, max_tokens, temperature, top_p)
            responses.append(response)
        return responses


if __name__ == "__main__":
    # Test the model runner
    runner = ModelRunner()
    
    test_prompts = [
        "What is the capital of France?",
        "Explain what is recursion in programming.",
        "Write a haiku about technology.",
    ]
    
    print("\n=== Testing Model Runner ===\n")
    for i, prompt in enumerate(test_prompts, 1):
        print(f"{i}. Prompt: {prompt}")
        response = runner.generate(prompt, max_tokens=100)
        print(f"   Response: {response}\n")

