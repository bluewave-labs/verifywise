"""
Bias audit preset loader.

Reads and caches law/framework preset JSON files from the bias_audits directory.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

_PRESETS_DIR = Path(__file__).parent
_cache: Dict[str, dict] = {}


def _load_all() -> Dict[str, dict]:
    """Load all preset JSON files into cache."""
    global _cache
    if _cache:
        return _cache
    for path in sorted(_PRESETS_DIR.glob("*.json")):
        try:
            with open(path, "r", encoding="utf-8") as f:
                preset = json.load(f)
            preset_id = preset.get("id", path.stem)
            _cache[preset_id] = preset
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to load preset {path.name}: {e}")
            continue
    return _cache


def get_preset(preset_id: str) -> Optional[dict]:
    """Get a single preset by ID. Returns None if not found."""
    presets = _load_all()
    return presets.get(preset_id)


def list_presets() -> List[dict]:
    """List all preset summaries (without full category details)."""
    presets = _load_all()
    summaries = []
    for preset in presets.values():
        summaries.append({
            "id": preset["id"],
            "name": preset["name"],
            "jurisdiction": preset.get("jurisdiction", ""),
            "effective_date": preset.get("effective_date", ""),
            "mode": preset["mode"],
            "description": preset.get("description", ""),
        })
    return summaries


def reload_presets() -> None:
    """Force reload of all presets (useful for testing)."""
    global _cache
    _cache = {}
    _load_all()
