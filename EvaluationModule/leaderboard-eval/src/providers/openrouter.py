"""OpenRouter API provider - aggregates many model providers."""

import httpx
from .base import BaseProvider


class OpenRouterProvider(BaseProvider):
    """OpenRouter API client - access to 200+ models."""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.api_key = self._get_api_key(config.get("api_key_env", "OPENROUTER_API_KEY"))
        self.base_url = config.get("base_url", "https://openrouter.ai/api/v1")
    
    async def complete(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> str:
        """Generate completion using OpenRouter API."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://verifywise.ai",
                    "X-Title": "VerifyWise Arena",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
