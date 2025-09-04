from abc import ABC, abstractmethod


class LLMClient(ABC):
    """Abstract interface for Large Language Model clients.

    Implementations should wrap a specific inference provider (e.g., local
    Hugging Face, OpenAI-compatible HTTP APIs) and expose a uniform `generate`
    method for text generation.
    """

    @abstractmethod
    def generate(
        self,
        prompt: str,
        *,
        max_new_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        """Generate text from a prompt.

        Args:
            prompt: The input prompt to condition generation on.
            max_new_tokens: Maximum number of new tokens to generate.
            temperature: Sampling temperature; higher values produce more random output.
            top_p: Nucleus sampling probability mass to consider during decoding.

        Returns:
            The generated text as a string.
        """
        raise NotImplementedError


