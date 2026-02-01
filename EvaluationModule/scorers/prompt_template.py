from __future__ import annotations

from dataclasses import replace
from typing import List, Set
from .config_schema import MessageTemplate


class PromptTemplateNormalizer:
    """
    Minimal v1 implementation:
    - Trim whitespace (leading/trailing) on multi-line templates.
    - Validate that placeholders appear in allowed list.
    - Return cleaned MessageTemplate objects.
    """

    def __init__(self, allowed_placeholders: List[str]) -> None:
        # Convert to a fast lookup set.
        self.allowed_placeholders: Set[str] = set(allowed_placeholders or [])

    def normalize_templates(self, messages: List[MessageTemplate]) -> List[MessageTemplate]:
        """
        Apply cleaning + placeholder checks to all templates.
        """
        normalized = []
        for msg in messages:
            cleaned = self._normalize_single(msg)
            normalized.append(cleaned)

        return normalized

    def _normalize_single(self, message: MessageTemplate) -> MessageTemplate:
        """
        Clean & validate placeholders for a single template.
        """
        raw_template = message.template

        # 1. Trim whitespace (strip leading/trailing newlines/spaces)
        cleaned_template = raw_template.strip()

        # 2. Validate placeholders appear correctly
        self._verify_placeholders(cleaned_template)

        # 3. Return new dataclass instance (immutability-friendly)
        return replace(message, template=cleaned_template)

    def _verify_placeholders(self, template: str) -> None:
        """
        Identify all {{placeholder}} occurrences and check them against allowed placeholders.
        If we later add validation, we can throw exceptions here.
        For v1, we simply do no-op if unexpected placeholder appears.
        """
        import re

        pattern = re.compile(r"{{\s*([a-zA-Z0-9_]+)\s*}}")
        found = pattern.findall(template)

        for placeholder in found:
            if placeholder not in self.allowed_placeholders:
                print(
                    f"[PromptTemplateNormalizer] WARNING: Placeholder '{{{{ {placeholder} }}}}' "
                    f"is not in allowed list: {self.allowed_placeholders}"
                )