"""
CRUD operations for report generation.
Aggregates experiment and log data for PDF/CSV report building.
"""

import json
import re
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_experiments_for_report(
    db: AsyncSession,
    tenant: str,
    experiment_ids: List[str],
) -> List[Dict[str, Any]]:
    """Fetch experiment details for the given IDs, including computed metric summaries."""

    if not experiment_ids:
        return []

    placeholders = ", ".join(f":id_{i}" for i in range(len(experiment_ids)))
    params = {f"id_{i}": eid for i, eid in enumerate(experiment_ids)}

    result = await db.execute(
        text(f'''
            SELECT id, project_id, name, description, config, status, results,
                   started_at, completed_at, created_at, created_by
            FROM "{tenant}".llm_evals_experiments
            WHERE id IN ({placeholders})
            ORDER BY created_at DESC
        '''),
        params,
    )

    rows = result.mappings().all()
    experiments = []

    for row in rows:
        config = row["config"] or {}
        if isinstance(config, str):
            config = json.loads(config)
        results = row["results"] or {}
        if isinstance(results, str):
            results = json.loads(results)

        # Build metric summaries from results.avg_scores or from logs
        metric_summaries: Dict[str, Dict] = {}
        metric_thresholds: Dict[str, float] = {}

        avg_scores = results.get("avg_scores", {})
        if avg_scores:
            for key, val in avg_scores.items():
                score = float(val) if isinstance(val, (int, float)) else 0.0
                metric_summaries[key] = {
                    "averageScore": score,
                    "passRate": 100.0 if score >= 0.5 else 0.0,
                    "minScore": score,
                    "maxScore": score,
                    "totalEvaluated": results.get("total_prompts", 0),
                }
        else:
            logs_summaries = await _compute_metrics_from_logs(
                db, tenant, row["id"]
            )
            metric_summaries = logs_summaries

        thresholds = results.get("metric_thresholds") or config.get("metric_thresholds", {})
        if thresholds:
            for k, v in thresholds.items():
                metric_thresholds[k] = float(v) if v is not None else 0.5

        experiments.append({
            "id": row["id"],
            "name": row["name"] or config.get("name", row["id"]),
            "status": row["status"] or "unknown",
            "model": config.get("model", {}).get("name") or config.get("model", {}).get("model_name") or results.get("model", "Unknown"),
            "dataset": config.get("dataset", {}).get("name") or results.get("dataset", ""),
            "judge": config.get("judgeLlm", {}).get("model") or config.get("judge", {}).get("model_name", ""),
            "scorer": config.get("scorer", {}).get("name", ""),
            "useCase": config.get("use_case", ""),
            "totalSamples": results.get("total_prompts", 0),
            "createdAt": row["created_at"].isoformat() if row["created_at"] else "",
            "completedAt": row["completed_at"].isoformat() if row["completed_at"] else "",
            "duration": results.get("duration"),
            "metricSummaries": metric_summaries,
            "metricThresholds": metric_thresholds,
        })

    return experiments


async def _compute_metrics_from_logs(
    db: AsyncSession,
    tenant: str,
    experiment_id: str,
) -> Dict[str, Dict]:
    """Compute metric summaries from individual evaluation logs."""

    result = await db.execute(
        text(f'''
            SELECT metadata
            FROM "{tenant}".llm_evals_logs
            WHERE experiment_id = :experiment_id
              AND metadata IS NOT NULL
            ORDER BY timestamp DESC
            LIMIT 2000
        '''),
        {"experiment_id": experiment_id},
    )

    rows = result.mappings().all()
    agg: Dict[str, Dict] = {}

    for row in rows:
        metadata = row["metadata"]
        if isinstance(metadata, str):
            metadata = json.loads(metadata)
        if not metadata:
            continue

        scores = metadata.get("metric_scores", {})
        for raw_key, value in scores.items():
            key = re.sub(r"^G-Eval\s*\((.+)\)$", r"\1", raw_key, flags=re.IGNORECASE)
            score = value if isinstance(value, (int, float)) else (value.get("score") if isinstance(value, dict) else None)
            if not isinstance(score, (int, float)):
                continue
            score = float(score)

            if key not in agg:
                agg[key] = {"sum": 0.0, "count": 0, "min": 1.0, "max": 0.0, "pass": 0}
            agg[key]["sum"] += score
            agg[key]["count"] += 1
            agg[key]["min"] = min(agg[key]["min"], score)
            agg[key]["max"] = max(agg[key]["max"], score)
            if score >= 0.5:
                agg[key]["pass"] += 1

    summaries = {}
    for key, val in agg.items():
        count = val["count"]
        summaries[key] = {
            "averageScore": val["sum"] / count if count else 0,
            "passRate": (val["pass"] / count * 100) if count else 0,
            "minScore": val["min"],
            "maxScore": val["max"],
            "totalEvaluated": count,
        }

    return summaries


async def get_project_info(
    db: AsyncSession,
    tenant: str,
    project_id: str,
) -> Optional[Dict[str, Any]]:
    """Get project name and details for the report cover."""

    result = await db.execute(
        text(f'''
            SELECT id, name, description, org_id, use_case
            FROM "{tenant}".llm_evals_projects
            WHERE id = :project_id
        '''),
        {"project_id": project_id},
    )

    row = result.mappings().first()
    if row:
        return {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "orgId": row["org_id"],
            "useCase": row["use_case"],
        }
    return None
