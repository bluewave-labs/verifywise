"""Model provider clients for various API services."""

from .base import BaseProvider
from .groq import GroqProvider
from .openrouter import OpenRouterProvider
from .together import TogetherProvider
from .direct import DirectProvider

__all__ = [
    "BaseProvider",
    "GroqProvider", 
    "OpenRouterProvider",
    "TogetherProvider",
    "DirectProvider",
    "get_provider",
]


def get_provider(provider_name: str, config: dict) -> BaseProvider:
    """Factory function to get provider instance."""
    providers = {
        "groq": GroqProvider,
        "openrouter": OpenRouterProvider,
        "together": TogetherProvider,
        "direct": DirectProvider,
    }
    
    if provider_name not in providers:
        raise ValueError(f"Unknown provider: {provider_name}")
    
    return providers[provider_name](config)
