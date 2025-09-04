from typing import Any, Dict, List, Optional
from openai import OpenAI

from .base import LLMClient


class OpenAIChatClient(LLMClient):
    """LLM client for OpenAI-compatible chat completion endpoints.

    Works with OpenAI and OpenAI-compatible providers by configuring `base_url`.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str,
        model_id: str,
        timeout: Optional[float] = None,
    ) -> None:
        self.base_url = base_url
        self.api_key = api_key
        self.model_id = model_id
        self.timeout = timeout

        # Initialize a reusable client to benefit from HTTP connection pooling
        self.client = OpenAI(base_url=self.base_url, api_key=self.api_key, timeout=self.timeout)

    def generate(
        self,
        prompt: str,
        *,
        max_new_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        # Assert that the prompt is a list of messages
        assert isinstance(prompt, list), "OpenAIChatClient expects messages list"
        messages: List[Dict[str, Any]] = prompt  # type: ignore[assignment]

        response = self.client.chat.completions.create(
            model=self.model_id,
            messages=messages,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_new_tokens,
        )

        if not response.choices:
            return ""
        message = response.choices[0].message
        return getattr(message, "content", "") or ""


