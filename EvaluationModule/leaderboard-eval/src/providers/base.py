"""Base provider class for LLM API clients."""

import os
import asyncio
from abc import ABC, abstractmethod
from typing import Optional
from tenacity import retry, stop_after_attempt, wait_exponential


class BaseProvider(ABC):
    """Base class for LLM API providers."""
    
    def __init__(self, config: dict):
        self.config = config
        self.rate_limit = config.get("rate_limit", 60)
        self._last_call_time = 0
        self._min_interval = 60.0 / self.rate_limit  # Seconds between calls
    
    async def _rate_limit_wait(self):
        """Wait to respect rate limits."""
        now = asyncio.get_event_loop().time()
        elapsed = now - self._last_call_time
        if elapsed < self._min_interval:
            await asyncio.sleep(self._min_interval - elapsed)
        self._last_call_time = asyncio.get_event_loop().time()
    
    def _get_api_key(self, env_var: str) -> str:
        """Get API key from environment."""
        key = os.getenv(env_var)
        if not key:
            raise ValueError(f"Missing API key: {env_var}")
        return key
    
    @abstractmethod
    async def complete(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> str:
        """Generate completion from the model."""
        pass
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
    )
    async def complete_with_retry(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> str:
        """Complete with automatic retry on failure."""
        await self._rate_limit_wait()
        return await self.complete(model, prompt, max_tokens, temperature)
