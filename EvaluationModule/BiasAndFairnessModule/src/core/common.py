import os
import json
from typing import Dict, Iterable, List, TypeVar, Optional, Any

import yaml


def read_yaml(file_path: str) -> Dict:
    """Read and parse a YAML file.

    Args:
        file_path (str): Path to the YAML file to read.

    Returns:
        Dict: The parsed YAML content as a dictionary.

    Raises:
        FileNotFoundError: If the YAML file doesn't exist.
        yaml.YAMLError: If the YAML file is invalid or cannot be parsed.
        TypeError: If the YAML content is not a dictionary.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"YAML file not found at: {file_path}")

    with open(file_path, "r") as f:
        try:
            content = yaml.safe_load(f)

            if not isinstance(content, dict):
                raise TypeError(
                    f"YAML content must be a dictionary, got {type(content)}"
                )

            return content
        except yaml.YAMLError as e:
            raise yaml.YAMLError(f"Error parsing YAML file: {str(e)}")


T = TypeVar("T")


def chunked(items: List[T], n: Optional[int]) -> Iterable[List[T]]:
    """Yield consecutive chunks of size ``n`` from ``items``.

    If ``n`` is None or <= 0, yields the entire ``items`` as a single chunk.
    """
    if n is None or n <= 0:
        yield items
        return
    for i in range(0, len(items), n):
        yield items[i : i + n]


def parse_json_strict(result_text: str) -> Dict[str, Any]:
    """Parse a model result string strictly into a dictionary.

    The expected JSON structure is: {"prediction": str, "confidence": float}

    - Rejects non-JSON input (raises ValueError)
    - Rejects non-object top-level JSON (raises TypeError)
    - Requires exactly the keys {"prediction", "confidence"} (raises KeyError)
    - Validates types: prediction is str, confidence is number (raises TypeError)
    - Accepts optional Markdown code fences around the JSON block

    Args:
        result_text (str): Raw string output from the model.

    Returns:
        Dict[str, Any]: Parsed and validated result.
    """
    text = result_text.strip()

    # Strip Markdown code fences if present, e.g., ```json\n{...}\n```
    if text.startswith("```"):
        newline_index = text.find("\n")
        if newline_index != -1:
            # Remove opening fence line (which may include a language tag like 'json')
            inner = text[newline_index + 1 :]
            closing_index = inner.rfind("```")
            if closing_index != -1:
                text = inner[:closing_index].strip()
            else:
                text = inner.strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {e.msg}") from e

    if not isinstance(parsed, dict):
        raise TypeError(f"Top-level JSON must be an object, got {type(parsed)}")

    required_keys = {"prediction", "confidence"}
    parsed_keys = set(parsed.keys())
    if parsed_keys != required_keys:
        raise KeyError(f"Expected keys {required_keys}, got {parsed_keys}")

    prediction = parsed["prediction"]
    confidence_value = parsed["confidence"]

    if not isinstance(prediction, str):
        raise TypeError("Field 'prediction' must be a string")

    if isinstance(confidence_value, (int, float)):
        confidence = float(confidence_value)
    else:
        raise TypeError("Field 'confidence' must be a number")

    return {"prediction": prediction, "confidence": confidence}
