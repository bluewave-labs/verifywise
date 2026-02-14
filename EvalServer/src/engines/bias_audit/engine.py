"""
Bias audit computation engine.

Computes selection rates, impact ratios, and intersectional analyses
for demographic bias audits. Operates on structured record data
(not ML tensors or fairlearn MetricFrames).
"""

from typing import Dict, List, Optional
from collections import defaultdict

from .models import (
    BiasAuditConfig,
    BiasAuditResult,
    CategoryTable,
    GroupResult,
)


def compute_bias_audit(
    records: List[Dict],
    config: BiasAuditConfig,
    unknown_count: int = 0,
) -> BiasAuditResult:
    """
    Run the full bias audit computation.

    Args:
        records: List of record dicts. Each has category keys + "selected" (bool).
        config: Audit configuration with categories, thresholds, etc.
        unknown_count: Count of rows excluded due to missing demographic data.

    Returns:
        BiasAuditResult with per-category tables and aggregate statistics.
    """
    total_applicants = len(records)
    total_selected = sum(1 for r in records if r.get("selected"))
    overall_rate = total_selected / total_applicants if total_applicants > 0 else 0.0

    tables: List[CategoryTable] = []
    total_flags = 0
    total_excluded = 0

    # Compute per-category tables
    for category_key, category_config in config.categories.items():
        table = _compute_category_table(
            records=records,
            category_key=category_key,
            category_label=category_config.label,
            total_applicants=total_applicants,
            threshold=config.threshold,
            small_sample_exclusion=config.small_sample_exclusion,
        )
        tables.append(table)
        total_flags += sum(1 for r in table.rows if r.flagged)
        total_excluded += sum(1 for r in table.rows if r.excluded)

    # Compute intersectional table if required
    if config.intersectional.required and len(config.intersectional.cross) >= 2:
        intersectional_table = _compute_intersectional_table(
            records=records,
            cross_keys=config.intersectional.cross,
            categories=config.categories,
            total_applicants=total_applicants,
            threshold=config.threshold,
            small_sample_exclusion=config.small_sample_exclusion,
        )
        tables.append(intersectional_table)
        total_flags += sum(1 for r in intersectional_table.rows if r.flagged)
        total_excluded += sum(1 for r in intersectional_table.rows if r.excluded)

    # Build summary
    summary_parts = [
        f"Audit analyzed {total_applicants:,} applicants with {total_selected:,} selections "
        f"(overall rate: {overall_rate:.1%}).",
    ]
    if unknown_count > 0:
        summary_parts.append(f"{unknown_count:,} rows excluded due to missing demographic data.")
    if total_flags > 0:
        summary_parts.append(
            f"{total_flags} group(s) flagged with impact ratio below "
            f"{config.threshold or 0.80:.2f} threshold."
        )
    else:
        summary_parts.append("No adverse impact flags detected.")
    if total_excluded > 0:
        summary_parts.append(
            f"{total_excluded} group(s) excluded from impact ratio calculations "
            f"due to small sample size."
        )

    return BiasAuditResult(
        tables=tables,
        overall_selection_rate=round(overall_rate, 6),
        total_applicants=total_applicants,
        total_selected=total_selected,
        unknown_count=unknown_count,
        flags_count=total_flags,
        excluded_count=total_excluded,
        summary=" ".join(summary_parts),
    )


def _compute_category_table(
    records: List[Dict],
    category_key: str,
    category_label: str,
    total_applicants: int,
    threshold: Optional[float],
    small_sample_exclusion: Optional[float],
) -> CategoryTable:
    """
    Compute selection rates and impact ratios for a single category.

    Groups records by category value, calculates per-group stats,
    then computes impact ratios relative to the highest selection rate.
    """
    # Group records
    groups: Dict[str, Dict] = defaultdict(lambda: {"applicants": 0, "selected": 0})
    for record in records:
        group_name = record.get(category_key, "")
        if not group_name:
            continue
        groups[group_name]["applicants"] += 1
        if record.get("selected"):
            groups[group_name]["selected"] += 1

    # Compute selection rates
    group_results: List[GroupResult] = []
    highest_rate = 0.0
    highest_group = ""

    for group_name, counts in sorted(groups.items()):
        applicants = counts["applicants"]
        selected = counts["selected"]
        rate = selected / applicants if applicants > 0 else 0.0

        if rate > highest_rate:
            highest_rate = rate
            highest_group = group_name

        group_results.append(GroupResult(
            category_type=category_key,
            category_name=group_name,
            applicant_count=applicants,
            selected_count=selected,
            selection_rate=round(rate, 6),
        ))

    # Compute impact ratios
    for result in group_results:
        # Check small sample exclusion
        if small_sample_exclusion and total_applicants > 0:
            proportion = result.applicant_count / total_applicants
            if proportion < small_sample_exclusion:
                result.excluded = True
                result.impact_ratio = None
                continue

        if highest_rate > 0:
            ratio = result.selection_rate / highest_rate
            result.impact_ratio = round(ratio, 6)

            # Flag if below threshold
            if threshold is not None and ratio < threshold:
                result.flagged = True
        else:
            result.impact_ratio = None

    return CategoryTable(
        title=f"Impact ratios by {category_label.lower()}",
        category_key=category_key,
        rows=group_results,
        highest_group=highest_group,
        highest_rate=round(highest_rate, 6) if highest_rate > 0 else None,
    )


def _compute_intersectional_table(
    records: List[Dict],
    cross_keys: List[str],
    categories: Dict,
    total_applicants: int,
    threshold: Optional[float],
    small_sample_exclusion: Optional[float],
) -> CategoryTable:
    """
    Compute intersectional cross-tabulation.

    Creates compound group names (e.g. "Male - Hispanic or Latino")
    and computes selection rates and impact ratios across all combinations.
    """
    # Group records by compound key
    groups: Dict[str, Dict] = defaultdict(lambda: {"applicants": 0, "selected": 0})

    for record in records:
        parts = []
        skip = False
        for key in cross_keys:
            value = record.get(key, "")
            if not value:
                skip = True
                break
            parts.append(value)
        if skip:
            continue

        compound_name = " - ".join(parts)
        groups[compound_name]["applicants"] += 1
        if record.get("selected"):
            groups[compound_name]["selected"] += 1

    # Compute selection rates
    group_results: List[GroupResult] = []
    highest_rate = 0.0
    highest_group = ""

    for group_name, counts in sorted(groups.items()):
        applicants = counts["applicants"]
        selected = counts["selected"]
        rate = selected / applicants if applicants > 0 else 0.0

        if rate > highest_rate:
            highest_rate = rate
            highest_group = group_name

        group_results.append(GroupResult(
            category_type="intersectional",
            category_name=group_name,
            applicant_count=applicants,
            selected_count=selected,
            selection_rate=round(rate, 6),
        ))

    # Compute impact ratios
    for result in group_results:
        if small_sample_exclusion and total_applicants > 0:
            proportion = result.applicant_count / total_applicants
            if proportion < small_sample_exclusion:
                result.excluded = True
                result.impact_ratio = None
                continue

        if highest_rate > 0:
            ratio = result.selection_rate / highest_rate
            result.impact_ratio = round(ratio, 6)
            if threshold is not None and ratio < threshold:
                result.flagged = True
        else:
            result.impact_ratio = None

    return CategoryTable(
        title="Impact ratios by intersectional category",
        category_key="intersectional",
        rows=group_results,
        highest_group=highest_group,
        highest_rate=round(highest_rate, 6) if highest_rate > 0 else None,
    )
