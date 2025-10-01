from typing import Dict

from .base import PromptFormatter
from .tinyllama import TinyLlamaFormatter
from .chat_openai import OpenAIChatJSONFormatter


def _normalize(name: str) -> str:
    if not isinstance(name, str) or not name.strip():
        raise ValueError("Formatter name must be a non-empty string")
    return name.strip().lower()


FORMATTERS: Dict[str, PromptFormatter] = {
    _normalize("tinyllama-chat"): TinyLlamaFormatter(),
    _normalize("openai-chat-json"): OpenAIChatJSONFormatter(),
}


def get_formatter(fmt_name: str) -> PromptFormatter:
    name = _normalize(fmt_name)
    try:
        return FORMATTERS[name]
    except KeyError:
        raise ValueError(f"Unknown prompt formatter: {fmt_name}")


def register_formatter(name: str, formatter: PromptFormatter) -> None:
    normalized = _normalize(name)
    if not isinstance(formatter, PromptFormatter):
        raise TypeError("formatter must be an instance of PromptFormatter")
    if normalized in FORMATTERS:
        raise ValueError(f"Formatter already registered: {name}")
    FORMATTERS[normalized] = formatter


