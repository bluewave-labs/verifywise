"""
LLM Evaluation Report Generator (EvalCards Standard)

Generates PDF reports from experiment evaluation data using ReportLab.
"""

import io
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
)

COLORS = {
    "primary": colors.HexColor("#111827"),
    "secondary": colors.HexColor("#6B7280"),
    "accent": colors.HexColor("#13715B"),
    "success": colors.HexColor("#16A34A"),
    "danger": colors.HexColor("#DC2626"),
    "warning": colors.HexColor("#D97706"),
    "light_bg": colors.HexColor("#F9FAFB"),
    "border": colors.HexColor("#E5E7EB"),
    "white": colors.white,
    "safety_header": colors.HexColor("#991B1B"),
    "safety_row": colors.HexColor("#FEF2F2"),
}

SAFETY_METRICS = ["bias", "toxicity", "hallucination", "conversationsafety"]

MARGIN = 18 * mm


def _is_safety_metric(name: str) -> bool:
    lower = name.lower()
    return any(m in lower for m in SAFETY_METRICS)


def _is_inverted_metric(name: str) -> bool:
    lower = name.lower()
    return any(m in lower for m in ["bias", "toxicity", "hallucination"])


def _format_metric_name(name: str) -> str:
    if not name:
        return name
    import re
    spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", name)
    spaced = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", spaced)
    return " ".join(w.capitalize() for w in spaced.split())


def _score_label(score: float, inverted: bool) -> str:
    effective = 1 - score if inverted else score
    if effective >= 0.8:
        return "Excellent"
    if effective >= 0.6:
        return "Good"
    if effective >= 0.4:
        return "Fair"
    return "Poor"


def _did_pass(score: float, threshold: float, inverted: bool) -> bool:
    return score <= threshold if inverted else score >= threshold


def _safe_str(val: Any, default: str = "N/A") -> str:
    if val is None:
        return default
    s = str(val)
    return s if s.strip() else default


def _get_styles() -> Dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ReportTitle",
            parent=base["Title"],
            fontSize=22,
            leading=26,
            textColor=COLORS["primary"],
            spaceAfter=4 * mm,
        ),
        "subtitle": ParagraphStyle(
            "ReportSubtitle",
            parent=base["Normal"],
            fontSize=14,
            leading=18,
            textColor=COLORS["accent"],
            spaceAfter=6 * mm,
        ),
        "section_header": ParagraphStyle(
            "SectionHeader",
            parent=base["Heading2"],
            fontSize=13,
            leading=16,
            textColor=COLORS["primary"],
            spaceBefore=6 * mm,
            spaceAfter=3 * mm,
            borderWidth=0,
        ),
        "body": ParagraphStyle(
            "ReportBody",
            parent=base["Normal"],
            fontSize=10,
            leading=14,
            textColor=COLORS["secondary"],
        ),
        "body_bold": ParagraphStyle(
            "ReportBodyBold",
            parent=base["Normal"],
            fontSize=10,
            leading=14,
            textColor=COLORS["primary"],
            fontName="Helvetica-Bold",
        ),
        "small": ParagraphStyle(
            "ReportSmall",
            parent=base["Normal"],
            fontSize=9,
            leading=12,
            textColor=COLORS["secondary"],
        ),
        "kv_key": ParagraphStyle(
            "KVKey",
            parent=base["Normal"],
            fontSize=9,
            leading=12,
            textColor=COLORS["secondary"],
            fontName="Helvetica-Bold",
        ),
        "kv_value": ParagraphStyle(
            "KVValue",
            parent=base["Normal"],
            fontSize=9,
            leading=12,
            textColor=COLORS["primary"],
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=base["Normal"],
            fontSize=7,
            leading=9,
            textColor=COLORS["secondary"],
        ),
    }


def _section_header(styles: dict, title: str) -> List:
    return [
        Spacer(1, 3 * mm),
        Paragraph(title, styles["section_header"]),
        HRFlowable(
            width="100%",
            thickness=0.6,
            color=COLORS["accent"],
            spaceAfter=4 * mm,
        ),
    ]


def _kv_row(styles: dict, key: str, value: str) -> Paragraph:
    return Paragraph(
        f'<b>{key}:</b>&nbsp;&nbsp;&nbsp;{_safe_str(value)}',
        styles["body"],
    )


def _build_metric_table(
    entries: List[Tuple[str, Dict]],
    thresholds: Dict[str, float],
    header_color: Any = None,
    alt_row_color: Any = None,
) -> Optional[Table]:
    if not entries:
        return None

    if header_color is None:
        header_color = COLORS["accent"]
    if alt_row_color is None:
        alt_row_color = COLORS["light_bg"]

    header = ["Metric", "Avg Score", "Pass Rate", "Threshold", "Status", "Rating"]
    rows = [header]
    status_cells: List[Tuple[int, bool]] = []

    for name, m in entries:
        inverted = _is_inverted_metric(name)
        avg = m.get("averageScore", 0)
        pass_rate = m.get("passRate", 0)
        threshold = thresholds.get(name, 0.5)
        passed = _did_pass(avg, threshold, inverted)
        status_cells.append((len(rows), passed))
        rows.append([
            _format_metric_name(name),
            f"{avg * 100:.1f}%",
            f"{pass_rate:.1f}%",
            f"{threshold * 100:.0f}%",
            "PASS" if passed else "FAIL",
            _score_label(avg, inverted),
        ])

    col_widths = [55 * mm, 25 * mm, 25 * mm, 25 * mm, 20 * mm, 25 * mm]
    table = Table(rows, colWidths=col_widths, repeatRows=1)

    style_commands: List = [
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), COLORS["white"]),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("TOPPADDING", (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 3),
        ("TOPPADDING", (0, 1), (-1, -1), 3),
        ("GRID", (0, 0), (-1, -1), 0.3, COLORS["border"]),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]

    for i in range(1, len(rows)):
        if i % 2 == 0:
            style_commands.append(("BACKGROUND", (0, i), (-1, i), alt_row_color))

    for row_idx, passed in status_cells:
        color = COLORS["success"] if passed else COLORS["danger"]
        style_commands.append(("TEXTCOLOR", (4, row_idx), (4, row_idx), color))
        style_commands.append(("FONTNAME", (4, row_idx), (4, row_idx), "Helvetica-Bold"))

    table.setStyle(TableStyle(style_commands))
    return table


def generate_pdf_report(
    config: Dict[str, Any],
    experiments: List[Dict[str, Any]],
    project_name: str,
    org_name: str,
) -> bytes:
    """
    Generate a PDF report and return it as bytes.
    """
    buffer = io.BytesIO()
    styles = _get_styles()

    enabled_sections = set()
    for s in config.get("sections", []):
        if s.get("enabled", True):
            enabled_sections.add(s["id"])

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN + 5 * mm,
    )

    story: List = []
    title = config.get("title") or f"{project_name} - Evaluation Report"

    # Cover
    story.append(Spacer(1, 25 * mm))
    story.append(Paragraph("LLM Evaluation Report", styles["title"]))
    story.append(Paragraph(title, styles["subtitle"]))
    story.append(Spacer(1, 4 * mm))

    cover_info = [
        f"<b>Project:</b> {_safe_str(project_name)}",
        f"<b>Organization:</b> {_safe_str(org_name)}",
        f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
        f"<b>Experiments included:</b> {len(experiments)}",
        f"<b>Report standard:</b> EvalCards",
    ]
    for line in cover_info:
        story.append(Paragraph(line, styles["body"]))
        story.append(Spacer(1, 1.5 * mm))

    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width="100%", thickness=0.3, color=COLORS["border"], spaceAfter=6 * mm))

    # Executive Summary
    if "executive-summary" in enabled_sections and experiments:
        story.extend(_section_header(styles, "1. Executive Summary"))

        for exp in experiments:
            metrics = exp.get("metricSummaries", {})
            thresholds = exp.get("metricThresholds", {})
            entries = list(metrics.items())
            total = len(entries)
            passing = sum(
                1 for name, m in entries
                if _did_pass(m.get("averageScore", 0), thresholds.get(name, 0.5), _is_inverted_metric(name))
            )
            avg = (sum(m.get("averageScore", 0) for _, m in entries) / total) if total else 0

            if total == 0:
                verdict = "N/A"
            elif passing == total:
                verdict = "PASS"
            elif passing >= total * 0.7:
                verdict = "PARTIAL PASS"
            else:
                verdict = "FAIL"

            story.append(Paragraph(f"Experiment: {_safe_str(exp.get('name', exp.get('id', 'Unknown')))}", styles["body_bold"]))
            story.append(_kv_row(styles, "Model", _safe_str(exp.get("model"))))
            story.append(_kv_row(styles, "Overall avg score", f"{avg * 100:.1f}%"))
            story.append(_kv_row(styles, "Metrics passing", f"{passing} / {total}"))
            story.append(_kv_row(styles, "Verdict", verdict))
            story.append(_kv_row(styles, "Samples evaluated", _safe_str(exp.get("totalSamples", 0))))
            story.append(Spacer(1, 3 * mm))

    # Evaluation Context
    if "evaluation-context" in enabled_sections:
        story.extend(_section_header(styles, "2. Evaluation Context"))
        story.append(_kv_row(styles, "Project", _safe_str(project_name)))
        story.append(_kv_row(styles, "Organization", _safe_str(org_name)))
        story.append(_kv_row(styles, "Report date", datetime.now().strftime("%Y-%m-%d")))
        story.append(_kv_row(styles, "Experiments", str(len(experiments))))
        if experiments and experiments[0].get("useCase"):
            story.append(_kv_row(styles, "Use case", experiments[0]["useCase"]))
        story.append(Spacer(1, 2 * mm))

    # Model Under Test
    if "model-under-test" in enabled_sections:
        story.extend(_section_header(styles, "3. Model Under Test"))
        for exp in experiments:
            story.append(Paragraph(f"Experiment: {_safe_str(exp.get('name', exp.get('id')))}", styles["body_bold"]))
            story.append(_kv_row(styles, "Model", _safe_str(exp.get("model"))))
            story.append(_kv_row(styles, "Dataset", _safe_str(exp.get("dataset"))))
            story.append(_kv_row(styles, "Judge / Scorer", _safe_str(exp.get("judge") or exp.get("scorer"))))
            story.append(_kv_row(styles, "Created", _safe_str(exp.get("createdAt"))))
            if exp.get("duration"):
                story.append(_kv_row(styles, "Duration", f"{exp['duration'] / 1000:.1f}s"))
            story.append(Spacer(1, 3 * mm))

    # Evaluation Setup
    if "evaluation-setup" in enabled_sections:
        story.extend(_section_header(styles, "4. Evaluation Setup"))
        for exp in experiments:
            story.append(Paragraph(f"Experiment: {_safe_str(exp.get('name', exp.get('id')))}", styles["body_bold"]))
            story.append(_kv_row(styles, "Total samples", str(exp.get("totalSamples", 0))))

            thresholds = exp.get("metricThresholds", {})
            if thresholds:
                thresh_str = ", ".join(
                    f"{_format_metric_name(k)}: {v * 100:.0f}%"
                    for k, v in thresholds.items()
                    if v is not None
                )
                if thresh_str:
                    story.append(_kv_row(styles, "Thresholds", thresh_str))

            metric_names = [_format_metric_name(k) for k in exp.get("metricSummaries", {}).keys()]
            story.append(_kv_row(styles, "Enabled metrics", ", ".join(metric_names) or "N/A"))
            story.append(Spacer(1, 3 * mm))

    # Metric Results
    if "metric-results" in enabled_sections:
        story.extend(_section_header(styles, "5. Metric Results"))

        for exp in experiments:
            summaries = exp.get("metricSummaries", {})
            thresholds = exp.get("metricThresholds", {})

            story.append(Paragraph(f"Experiment: {_safe_str(exp.get('name', exp.get('id')))}", styles["body_bold"]))
            story.append(Spacer(1, 2 * mm))

            quality = [(n, m) for n, m in summaries.items() if not _is_safety_metric(n)]
            safety = [(n, m) for n, m in summaries.items() if _is_safety_metric(n)]

            if quality:
                story.append(Paragraph("Quality Metrics", styles["body_bold"]))
                story.append(Spacer(1, 1 * mm))
                table = _build_metric_table(quality, thresholds)
                if table:
                    story.append(table)
                story.append(Spacer(1, 4 * mm))

            if safety:
                story.append(Paragraph("Safety Metrics", styles["body_bold"]))
                story.append(Spacer(1, 1 * mm))
                table = _build_metric_table(
                    safety,
                    thresholds,
                    header_color=COLORS["safety_header"],
                    alt_row_color=COLORS["safety_row"],
                )
                if table:
                    story.append(table)
                story.append(Spacer(1, 4 * mm))

    # Safety & Compliance
    if "safety-compliance" in enabled_sections:
        story.extend(_section_header(styles, "6. Safety & Compliance"))
        story.append(Paragraph(
            "This section highlights safety-relevant metrics in the context of AI governance frameworks "
            "such as the EU AI Act (Article 55) and the EvalCards standard for safety documentation.",
            styles["small"],
        ))
        story.append(Spacer(1, 2 * mm))

        for exp in experiments:
            summaries = exp.get("metricSummaries", {})
            thresholds = exp.get("metricThresholds", {})
            safety = [(n, m) for n, m in summaries.items() if _is_safety_metric(n)]

            if not safety:
                story.append(Paragraph(
                    "No safety metrics were evaluated for this experiment.",
                    ParagraphStyle("Warning", parent=styles["body"], textColor=COLORS["warning"]),
                ))
                continue

            story.append(Paragraph(f"Experiment: {_safe_str(exp.get('name', exp.get('id')))}", styles["body_bold"]))
            for name, m in safety:
                avg = m.get("averageScore", 0)
                threshold = thresholds.get(name, 0.5)
                inverted = _is_inverted_metric(name)
                passed = _did_pass(avg, threshold, inverted)
                pct = f"{avg * 100:.1f}%"
                status = "PASS" if passed else "FAIL"

                story.append(_kv_row(styles, _format_metric_name(name), f"{pct} ({status})"))

                if not passed:
                    if inverted:
                        note = (
                            f"Score of {pct} exceeds the {threshold * 100:.0f}% threshold. "
                            f"Review flagged samples and consider additional safeguards."
                        )
                    else:
                        note = (
                            f"Score of {pct} is below the {threshold * 100:.0f}% threshold. "
                            f"Further investigation recommended."
                        )
                    story.append(Paragraph(
                        f"&rarr; {note}",
                        ParagraphStyle("DangerNote", parent=styles["small"], textColor=COLORS["danger"]),
                    ))
            story.append(Spacer(1, 3 * mm))

    # Arena Comparison
    if "arena-comparison" in enabled_sections:
        arena_data = config.get("arenaData", [])
        if arena_data:
            story.extend(_section_header(styles, "7. Arena Comparison"))
            for arena in arena_data:
                story.append(Paragraph(f"Arena: {_safe_str(arena.get('name', arena.get('id')))}", styles["body_bold"]))
                story.append(_kv_row(styles, "Winner", _safe_str(arena.get("winner", "Tie"))))
                story.append(_kv_row(styles, "Rounds", str(arena.get("rounds", 0))))
                criteria = arena.get("criteria", [])
                if criteria:
                    story.append(_kv_row(styles, "Criteria", ", ".join(str(c) for c in criteria)))
                story.append(Spacer(1, 2 * mm))

                contestants = arena.get("contestants", [])
                if contestants:
                    header = ["Model", "Wins", "Losses", "Ties", "Avg Score"]
                    rows = [header]
                    for c in contestants:
                        rows.append([
                            _safe_str(c.get("model")),
                            str(c.get("wins", 0)),
                            str(c.get("losses", 0)),
                            str(c.get("ties", 0)),
                            f"{c.get('avgScore', 0) * 100:.1f}%",
                        ])

                    col_widths = [45 * mm, 25 * mm, 25 * mm, 25 * mm, 30 * mm]
                    table = Table(rows, colWidths=col_widths, repeatRows=1)
                    table.setStyle(TableStyle([
                        ("BACKGROUND", (0, 0), (-1, 0), COLORS["accent"]),
                        ("TEXTCOLOR", (0, 0), (-1, 0), COLORS["white"]),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("GRID", (0, 0), (-1, -1), 0.3, COLORS["border"]),
                        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                    ]))
                    story.append(table)
                story.append(Spacer(1, 4 * mm))

    # Recommendations
    if "recommendations" in enabled_sections:
        story.extend(_section_header(styles, "8. Limitations & Recommendations"))

        recommendations: List[str] = []
        for exp in experiments:
            summaries = exp.get("metricSummaries", {})
            thresholds = exp.get("metricThresholds", {})
            for name, m in summaries.items():
                avg = m.get("averageScore", 0)
                threshold = thresholds.get(name, 0.5)
                inverted = _is_inverted_metric(name)
                if not _did_pass(avg, threshold, inverted):
                    display = _format_metric_name(name)
                    exp_name = _safe_str(exp.get("name", exp.get("id")))
                    if inverted:
                        recommendations.append(
                            f"{display} score ({avg * 100:.1f}%) exceeds threshold in \"{exp_name}\". "
                            f"Consider adding guardrails or content filters."
                        )
                    else:
                        recommendations.append(
                            f"{display} score ({avg * 100:.1f}%) is below threshold in \"{exp_name}\". "
                            f"Consider fine-tuning, prompt engineering, or switching models."
                        )

        if not recommendations:
            story.append(Paragraph(
                "All evaluated metrics are within configured thresholds. Continue monitoring.",
                ParagraphStyle("SuccessNote", parent=styles["body"], textColor=COLORS["success"]),
            ))
        else:
            for rec in recommendations:
                story.append(Paragraph(f"&bull; {rec}", styles["small"]))
                story.append(Spacer(1, 1 * mm))

        story.append(Spacer(1, 4 * mm))
        story.append(Paragraph(
            "Limitations: Evaluation results depend on the dataset, judge model, and configured thresholds. "
            "Scores should be interpreted in context and validated against domain-specific requirements. "
            "This report follows the EvalCards framework for standardized documentation.",
            styles["small"],
        ))

    # Build with page footer
    def add_page_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(COLORS["secondary"])
        canvas.drawString(MARGIN, 10 * mm, "VerifyWise — LLM Evaluation Report")
        page_text = f"Page {canvas.getPageNumber()}"
        canvas.drawRightString(A4[0] - MARGIN, 10 * mm, page_text)
        canvas.restoreState()

    doc.build(story, onFirstPage=add_page_footer, onLaterPages=add_page_footer)

    return buffer.getvalue()


def generate_csv_report(
    experiments: List[Dict[str, Any]],
    project_name: str,
) -> str:
    """Generate CSV report content as a string."""
    rows: List[List[str]] = []

    rows.append(["LLM Evaluation Report"])
    rows.append(["Project", project_name])
    rows.append(["Generated", datetime.now().isoformat()])
    rows.append([])

    rows.append(["EXPERIMENT SUMMARY"])
    rows.append(["Experiment", "Model", "Dataset", "Judge/Scorer", "Samples", "Status", "Created"])
    for exp in experiments:
        rows.append([
            _safe_str(exp.get("name", exp.get("id"))),
            _safe_str(exp.get("model")),
            _safe_str(exp.get("dataset"), ""),
            _safe_str(exp.get("judge") or exp.get("scorer"), ""),
            str(exp.get("totalSamples", 0)),
            _safe_str(exp.get("status")),
            _safe_str(exp.get("createdAt"), ""),
        ])
    rows.append([])

    rows.append(["METRIC RESULTS"])
    rows.append(["Experiment", "Metric", "Avg Score", "Pass Rate", "Min", "Max", "Threshold", "Status", "Category"])
    for exp in experiments:
        summaries = exp.get("metricSummaries", {})
        thresholds = exp.get("metricThresholds", {})
        for name, m in summaries.items():
            inverted = _is_inverted_metric(name)
            threshold = thresholds.get(name, 0.5)
            avg = m.get("averageScore", 0)
            passed = _did_pass(avg, threshold, inverted)
            rows.append([
                _safe_str(exp.get("name", exp.get("id"))),
                _format_metric_name(name),
                f"{avg * 100:.1f}%",
                f"{m.get('passRate', 0):.1f}%",
                f"{m.get('minScore', 0) * 100:.1f}%",
                f"{m.get('maxScore', 0) * 100:.1f}%",
                f"{threshold * 100:.0f}%",
                "PASS" if passed else "FAIL",
                "Safety" if _is_safety_metric(name) else "Quality",
            ])

    import csv
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)
    for row in rows:
        writer.writerow(row)
    return output.getvalue()
