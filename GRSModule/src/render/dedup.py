from __future__ import annotations

import hashlib
import re


_WS_RE = re.compile(r"\s+")


def normalize_prompt(text: str) -> str:
    # normalize whitespace + lowercase for stable hashing
    return _WS_RE.sub(" ", text.strip()).lower()


def prompt_hash(text: str) -> str:
    norm = normalize_prompt(text)
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()
