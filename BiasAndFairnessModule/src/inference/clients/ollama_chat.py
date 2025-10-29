from typing import Any, Dict, List, Optional

from .base import LLMClient


class OllamaChatClient(LLMClient):
    """LLM client for local Ollama chat completion.

    Uses the `ollama` Python package to call the local Ollama daemon
    via its chat API. Expects a messages-style prompt.
    """

    def __init__(self, model_id: str, host: Optional[str] = None) -> None:
        try:
            # Prefer an explicit client instance to control host when provided
            from ollama import Client as _OllamaClient  # type: ignore
        except Exception as exc:
            raise ImportError(
                "The 'ollama' package is required for OllamaChatClient. Install with `pip install ollama`."
            ) from exc

        self.model_id = model_id
        self.host = host
        self.client = _OllamaClient(host=self.host) if self.host else _OllamaClient()

    def generate(
        self,
        prompt: List[Dict[str, Any]],
        *,
        max_new_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        # Enforce messages format for chat models
        assert isinstance(prompt, list), "OllamaChatClient expects messages list"
        messages: List[Dict[str, Any]] = prompt  # type: ignore[assignment]

        # Map our unified parameters to Ollama's options
        options: Dict[str, Any] = {
            "num_predict": max_new_tokens,
            "temperature": temperature,
            "top_p": top_p,
        }

        response = self.client.chat(
            model=self.model_id,
            messages=messages,
            options=options,
        )

        # Normalize response to extract assistant content across SDK variants
        content: Optional[str] = None

        # Object-like response (e.g., ChatResponse)
        if hasattr(response, "message"):
            msg_obj = getattr(response, "message", None)
            if msg_obj is not None and hasattr(msg_obj, "content"):
                content = getattr(msg_obj, "content")

        # Dict-like response
        if content is None and isinstance(response, dict):
            message = response.get("message")
            if isinstance(message, dict):
                content = message.get("content")
            elif hasattr(message, "content"):
                content = getattr(message, "content")

        return str(content).strip() if content else ""


