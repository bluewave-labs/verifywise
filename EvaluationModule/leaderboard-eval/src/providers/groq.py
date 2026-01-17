"""Groq API provider - Free tier available."""

import httpx
from .base import BaseProvider


class GroqProvider(BaseProvider):
    """Groq API client - fast inference, free tier."""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.api_key = self._get_api_key(config.get("api_key_env", "GROQ_API_KEY"))
        self.base_url = "https://api.groq.com/openai/v1"
    
    async def complete(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> str:
        """Generate completion using Groq API."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
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
