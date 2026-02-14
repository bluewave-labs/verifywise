"""
Parse CSV demographic data for bias audits.

Reads a CSV file with demographic columns and a binary outcome column,
then produces structured records for the computation engine.
"""

import csv
import io
from typing import Dict, List, Tuple


def _decode_csv(csv_bytes: bytes) -> str:
    """Decode CSV bytes with fallback encodings."""
    for encoding in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
        try:
            return csv_bytes.decode(encoding)
        except (UnicodeDecodeError, ValueError):
            continue
    raise ValueError("Unable to decode CSV file. Please ensure it is UTF-8 encoded.")


def parse_csv_dataset(
    csv_bytes: bytes,
    column_mapping: Dict[str, str],
    outcome_column: str,
) -> Tuple[List[Dict[str, str]], int]:
    """
    Parse CSV bytes into a list of record dicts.

    Args:
        csv_bytes: Raw CSV file content.
        column_mapping: Maps preset category keys to CSV column names.
            e.g. {"sex": "Gender", "race_ethnicity": "Race"}
        outcome_column: Name of the CSV column containing the binary outcome
            (1/true/yes/selected = selected, 0/false/no = not selected).

    Returns:
        Tuple of (records, unknown_count):
        - records: List of dicts with keys for each category + "selected" (bool).
        - unknown_count: Number of rows with missing demographic data in any
          mapped category.
    """
    text = _decode_csv(csv_bytes)
    reader = csv.DictReader(io.StringIO(text))

    records: List[Dict[str, str]] = []
    unknown_count = 0

    # Normalize header names for case-insensitive matching
    if reader.fieldnames is None:
        return [], 0

    header_map: Dict[str, str] = {h.strip().lower(): h.strip() for h in reader.fieldnames}

    # Resolve column mapping to actual CSV header names (skip empty mappings)
    resolved_mapping: Dict[str, str] = {}
    for category_key, csv_col in column_mapping.items():
        if not csv_col or not csv_col.strip():
            continue
        csv_col_lower = csv_col.strip().lower()
        if csv_col_lower in header_map:
            resolved_mapping[category_key] = header_map[csv_col_lower]
        else:
            resolved_mapping[category_key] = csv_col.strip()

    outcome_col_lower = outcome_column.strip().lower()
    resolved_outcome = header_map.get(outcome_col_lower, outcome_column.strip())

    for row in reader:
        record: Dict[str, str] = {}
        has_missing = False

        for category_key, csv_col in resolved_mapping.items():
            value = (row.get(csv_col) or "").strip()
            if not value:
                has_missing = True
            record[category_key] = value

        # Parse outcome
        outcome_raw = (row.get(resolved_outcome) or "").strip().lower()
        record["selected"] = outcome_raw in ("1", "true", "yes", "selected", "hired", "promoted")

        if has_missing:
            unknown_count += 1
        else:
            records.append(record)

    return records, unknown_count


def parse_csv_headers(csv_bytes: bytes) -> List[str]:
    """
    Parse just the headers from a CSV file.
    Used client-side (or server-side) for column mapping UI.

    Args:
        csv_bytes: Raw CSV file content.

    Returns:
        List of column header names.
    """
    text = _decode_csv(csv_bytes)
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        return []
    return [h.strip() for h in reader.fieldnames]
