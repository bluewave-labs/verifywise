import logging
import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, Union, Optional
import plotly.graph_objects as go


def get_logger(name: str = "eval") -> logging.Logger:
    """Create and return a configured logger.

    The logger logs to stdout with level INFO and format "[%(levelname)s] %(message)s".
    """

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setLevel(logging.INFO)
        fmt = logging.Formatter("[%(levelname)s] %(message)s")
        handler.setFormatter(fmt)
        logger.addHandler(handler)

    logger.propagate = False
    return logger

def make_run_id() -> str:
    """Return a filename-friendly run id based on local datetime.

    Uses datetime.now() and formats as YYYY-MM-DD_HH-MM-SS.
    """

    return datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

def safe_mkdirs(paths: Union[str, Iterable[str]]) -> None:
    """Create one or multiple directories if they don't exist.

    Accepts a single path string or an iterable of path strings.
    """

    path_list = [paths] if isinstance(paths, str) else list(paths)
    for path_str in path_list:
        if not path_str:
            continue
        Path(path_str).mkdir(parents=True, exist_ok=True)

def hash_config(config: Dict[str, Any]) -> str:
    """Return a short, stable hash of the config dict (first 10 chars).

    Returns "unknown" if hashing fails for any reason.
    """

    try:
        serialized = json.dumps(
            config,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
        )
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:10]
    except Exception:
        return "unknown"

def snapshot_config(
    config: Dict[str, Any], output_dir: str, run_id: Optional[str] = None
) -> Optional[str]:
    """Write a JSON snapshot of the config and return the file path.

    The file name includes the run id (or a generated one) and a short hash.
    Returns None on failure.
    """

    try:
        safe_mkdirs(output_dir)
        rid = run_id or make_run_id()
        cfg_hash = hash_config(config)
        path = Path(output_dir) / f"config_snapshot_{rid}_{cfg_hash}.json"
        with path.open("w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        return str(path)
    except Exception:
        return None

def save_plotly(
    fig: go.Figure,
    base_path_no_ext: str,
    formats: Iterable[str] = ("html", "png"),
    logger: Optional[logging.Logger] = None,
) -> Dict[str, str]:
    """Save a Plotly figure in one or more formats.

    Attempts each format and logs warnings on failure. Returns a map of
    format name to saved file path for successful saves.
    """

    saved_paths: Dict[str, str] = {}
    log = logger or get_logger()

    # Ensure destination directory exists
    out_dir = Path(base_path_no_ext).parent
    safe_mkdirs(str(out_dir))

    for fmt in formats:
        fmt_lower = (fmt or "").lower()
        try:
            if fmt_lower == "html":
                out_path = Path(f"{base_path_no_ext}.html")
                fig.write_html(str(out_path), include_plotlyjs="cdn", full_html=True)
                saved_paths["html"] = str(out_path)
            elif fmt_lower == "png":
                out_path = Path(f"{base_path_no_ext}.png")
                fig.write_image(str(out_path), scale=2)
                saved_paths["png"] = str(out_path)
            else:
                log.warning(f"Unsupported plot format: {fmt}")
        except Exception as exc:
            log.warning(f"Failed to save plot as {fmt_lower}: {exc}")

    return saved_paths


