import os
from typing import Dict, Iterable, List, TypeVar, Optional

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
