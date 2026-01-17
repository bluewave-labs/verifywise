"""Direct API providers for premium models (OpenAI, Anthropic, Google)."""

import os
import httpx
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from .base import BaseProvider


class DirectProvider(BaseProvider):
    """Direct API access to premium model providers."""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self._clients = {}
    
    def _get_openai_client(self, api_key_env: str) -> AsyncOpenAI:
        """Get or create OpenAI client."""
        if "openai" not in self._clients:
            api_key = self._get_api_key(api_key_env)
            self._clients["openai"] = AsyncOpenAI(api_key=api_key)
        return self._clients["openai"]
    
    def _get_anthropic_client(self, api_key_env: str) -> AsyncAnthropic:
        """Get or create Anthropic client."""
        if "anthropic" not in self._clients:
            api_key = self._get_api_key(api_key_env)
            self._clients["anthropic"] = AsyncAnthropic(api_key=api_key)
        return self._clients["anthropic"]
    
    async def complete(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
        api_key_env: str = None,
    ) -> str:
        """Generate completion using appropriate provider."""
        
        # Determine provider from model name
        if model.startswith("gpt") or model.startswith("o1"):
            return await self._openai_complete(model, prompt, max_tokens, temperature, api_key_env or "OPENAI_API_KEY")
        elif model.startswith("claude"):
            return await self._anthropic_complete(model, prompt, max_tokens, temperature, api_key_env or "ANTHROPIC_API_KEY")
        elif model.startswith("gemini"):
            return await self._google_complete(model, prompt, max_tokens, temperature, api_key_env or "GOOGLE_API_KEY")
        else:
            raise ValueError(f"Unknown model provider for: {model}")
    
    async def _openai_complete(
        self,
        model: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
        api_key_env: str,
    ) -> str:
        """OpenAI API completion."""
        client = self._get_openai_client(api_key_env)
        
        # o1 models don't support temperature
        kwargs = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
        }
        if not model.startswith("o1"):
            kwargs["temperature"] = temperature
        
        response = await client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
    
    async def _anthropic_complete(
        self,
        model: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
        api_key_env: str,
    ) -> str:
        """Anthropic API completion."""
        client = self._get_anthropic_client(api_key_env)
        response = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
    
    async def _google_complete(
        self,
        model: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
        api_key_env: str,
    ) -> str:
        """Google Gemini API completion."""
        api_key = self._get_api_key(api_key_env)
        
        # Use REST API for Gemini
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                params={"key": api_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "maxOutputTokens": max_tokens,
                        "temperature": temperature,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
