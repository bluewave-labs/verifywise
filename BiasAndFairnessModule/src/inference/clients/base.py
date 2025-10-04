from abc import ABC, abstractmethod
from typing import Union, List, Dict


Prompt = Union[str, List[Dict[str, str]]]


class LLMClient(ABC):
    """Abstract interface for Large Language Model clients.

    Implementations should wrap a specific inference provider (e.g., local
    Hugging Face, OpenAI-compatible HTTP APIs) and expose a uniform `generate`
    method for text generation.
    """

    @abstractmethod
    def generate(
        self,
        prompt: Prompt,
        *,
        max_new_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        """Generate text from a prompt.

        Args:
            prompt: The input prompt to condition generation on. Can be a raw
                string or a list of role/content dicts for chat-style models.
            max_new_tokens: Maximum number of new tokens to generate.
            temperature: Sampling temperature; higher values produce more random output.
            top_p: Nucleus sampling probability mass to consider during decoding.

        Returns:
            The generated text as a string.
        """
        raise NotImplementedError


    def generate_batch(
        self,
        prompts: List[Prompt],
        *,
        max_new_tokens: int,
        temperature: float,
        top_p: float,
    ) -> List[str]:
        """Generate text for a batch of prompts.

        Iterates over the provided prompts and calls `generate` for each.

        Args:
            prompts: List of prompts to generate outputs for.
            max_new_tokens: Maximum number of new tokens to generate for each prompt.
            temperature: Sampling temperature; higher values produce more random output.
            top_p: Nucleus sampling probability mass to consider during decoding.

        Returns:
            A list of generated texts corresponding to each input prompt.
        """
        results: List[str] = []
        for prompt in prompts:
            result = self.generate(
                prompt,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p,
            )
            results.append(result)
        return results


