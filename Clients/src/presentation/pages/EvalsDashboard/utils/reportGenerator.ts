/**
 * LLM Evaluation Report Generator
 *
 * Generates PDF and CSV reports from experiment evaluation data.
 * Follows EvalCards / Eval Factsheets standards for structured reporting.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  ReportConfig,
  ReportExperimentData,
  ReportArenaData,
  MetricSummary,
} from "../types";

const COLORS = {
  primary: [17, 24, 39] as [number, number, number],       // #111827
  secondary: [107, 114, 128] as [number, number, number],   // #6B7280
  accent: [79, 70, 229] as [number, number, number],        // #4F46E5
  success: [22, 163, 74] as [number, number, number],       // #16A34A
  danger: [220, 38, 38] as [number, number, number],        // #DC2626
  warning: [217, 119, 6] as [number, number, number],       // #D97706
  lightBg: [249, 250, 251] as [number, number, number],     // #F9FAFB
  border: [229, 231, 235] as [number, number, number],      // #E5E7EB
  white: [255, 255, 255] as [number, number, number],
};

const SAFETY_METRICS = ["bias", "toxicity", "hallucination", "conversationSafety"];

function isSafetyMetric(name: string): boolean {
  return SAFETY_METRICS.some(m => name.toLowerCase().includes(m.toLowerCase()));
}

function isInvertedMetric(name: string): boolean {
  return ["bias", "toxicity", "hallucination"].some(m =>
    name.toLowerCase().includes(m.toLowerCase())
  );
}

function formatMetricName(name: string): string {
  if (!name) return name;
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function scoreLabel(score: number, inverted: boolean): string {
  const effective = inverted ? 1 - score : score;
  if (effective >= 0.8) return "Excellent";
  if (effective >= 0.6) return "Good";
  if (effective >= 0.4) return "Fair";
  return "Poor";
}

function didPass(score: number, threshold: number, inverted: boolean): boolean {
  return inverted ? score <= threshold : score >= threshold;
}

// ==================== PDF Generation ====================

export async function generatePDFReport(
  config: ReportConfig,
  experiments: ReportExperimentData[],
  arenaData: ReportArenaData[],
  projectName: string,
  orgName: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const enabledSections = new Set(
    config.sections.filter(s => s.enabled).map(s => s.id),
  );

  const addPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      addPage();
    }
  };

  const drawSectionHeader = (title: string) => {
    checkPageBreak(16);
    y += 6;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.6);
    doc.line(margin, y, margin + contentWidth, y);
    y += 7;
  };

  const drawText = (text: string, fontSize = 10, color = COLORS.secondary, bold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * (fontSize * 0.45) + 2);
    doc.text(lines, margin, y);
    y += lines.length * (fontSize * 0.45) + 2;
  };

  const drawKeyValue = (key: string, value: string) => {
    checkPageBreak(6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.secondary);
    doc.text(`${key}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.primary);
    doc.text(value, margin + 42, y);
    y += 5;
  };

  // ── Cover / Title ──
  y = 50;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("LLM Evaluation Report", margin, y);
  y += 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.accent);
  doc.text(config.title || projectName, margin, y);
  y += 12;

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.text(`Project: ${projectName}`, margin, y);
  y += 5;
  doc.text(`Organization: ${orgName}`, margin, y);
  y += 5;
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, margin, y);
  y += 5;
  doc.text(`Experiments included: ${experiments.length}`, margin, y);
  y += 5;
  doc.text(`Report format: EvalCards / Eval Factsheets standard`, margin, y);
  y += 12;

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 10;

  // ── Executive Summary ──
  if (enabledSections.has("executive-summary") && experiments.length > 0) {
    drawSectionHeader("1. Executive Summary");

    for (const exp of experiments) {
      const metrics = Object.entries(exp.metricSummaries);
      const totalMetrics = metrics.length;
      const passing = metrics.filter(([name, m]) => {
        const threshold = exp.metricThresholds[name] ?? (isInvertedMetric(name) ? 0.5 : 0.5);
        return didPass(m.averageScore, threshold, isInvertedMetric(name));
      }).length;
      const avgScore = metrics.length > 0
        ? metrics.reduce((sum, [, m]) => sum + m.averageScore, 0) / metrics.length
        : 0;
      const verdict = passing === totalMetrics ? "PASS" : passing >= totalMetrics * 0.7 ? "PARTIAL PASS" : "FAIL";

      drawText(`Experiment: ${exp.name || exp.id}`, 10, COLORS.primary, true);
      drawKeyValue("Model", exp.model);
      drawKeyValue("Overall avg score", `${(avgScore * 100).toFixed(1)}%`);
      drawKeyValue("Metrics passing", `${passing} / ${totalMetrics}`);
      drawKeyValue("Verdict", verdict);
      drawKeyValue("Samples evaluated", String(exp.totalSamples));
      y += 3;
    }
  }

  // ── Evaluation Context ──
  if (enabledSections.has("evaluation-context")) {
    drawSectionHeader("2. Evaluation Context");
    drawKeyValue("Project", projectName);
    drawKeyValue("Organization", orgName);
    drawKeyValue("Report date", new Date().toISOString().split("T")[0]);
    drawKeyValue("Experiments", String(experiments.length));
    if (experiments[0]?.useCase) {
      drawKeyValue("Use case", experiments[0].useCase);
    }
    y += 3;
  }

  // ── Model Under Test ──
  if (enabledSections.has("model-under-test")) {
    drawSectionHeader("3. Model Under Test");
    for (const exp of experiments) {
      drawText(`Experiment: ${exp.name || exp.id}`, 10, COLORS.primary, true);
      drawKeyValue("Model", exp.model);
      drawKeyValue("Dataset", exp.dataset || "N/A");
      drawKeyValue("Judge / Scorer", exp.judge || exp.scorer || "N/A");
      drawKeyValue("Created", new Date(exp.createdAt).toLocaleString());
      if (exp.duration) {
        drawKeyValue("Duration", `${(exp.duration / 1000).toFixed(1)}s`);
      }
      y += 3;
    }
  }

  // ── Evaluation Setup ──
  if (enabledSections.has("evaluation-setup")) {
    drawSectionHeader("4. Evaluation Setup");
    for (const exp of experiments) {
      drawText(`Experiment: ${exp.name || exp.id}`, 10, COLORS.primary, true);
      drawKeyValue("Total samples", String(exp.totalSamples));

      const thresholdEntries = Object.entries(exp.metricThresholds).filter(([, v]) => v != null);
      if (thresholdEntries.length > 0) {
        const thresholdStr = thresholdEntries
          .map(([k, v]) => `${formatMetricName(k)}: ${(v * 100).toFixed(0)}%`)
          .join(", ");
        drawKeyValue("Thresholds", thresholdStr);
      }

      const enabledMetrics = Object.keys(exp.metricSummaries).map(formatMetricName).join(", ");
      drawKeyValue("Enabled metrics", enabledMetrics || "N/A");
      y += 3;
    }
  }

  // ── Metric Results ──
  if (enabledSections.has("metric-results")) {
    drawSectionHeader("5. Metric Results");

    for (const exp of experiments) {
      drawText(`Experiment: ${exp.name || exp.id}`, 10, COLORS.primary, true);
      y += 2;

      const qualityMetrics = Object.entries(exp.metricSummaries).filter(([name]) => !isSafetyMetric(name));
      const safetyMetrics = Object.entries(exp.metricSummaries).filter(([name]) => isSafetyMetric(name));

      const buildRows = (entries: [string, MetricSummary][]) =>
        entries.map(([name, m]) => {
          const inverted = isInvertedMetric(name);
          const threshold = exp.metricThresholds[name] ?? 0.5;
          const passed = didPass(m.averageScore, threshold, inverted);
          return [
            formatMetricName(name),
            `${(m.averageScore * 100).toFixed(1)}%`,
            `${(m.passRate * 100).toFixed(1)}%`,
            `${(threshold * 100).toFixed(0)}%`,
            passed ? "PASS" : "FAIL",
            scoreLabel(m.averageScore, inverted),
          ];
        });

      if (qualityMetrics.length > 0) {
        drawText("Quality Metrics", 9, COLORS.primary, true);
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["Metric", "Avg Score", "Pass Rate", "Threshold", "Status", "Rating"]],
          body: buildRows(qualityMetrics),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontStyle: "bold" },
          alternateRowStyles: { fillColor: COLORS.lightBg },
          didParseCell: (data) => {
            if (data.section === "body" && data.column.index === 4) {
              const val = data.cell.raw as string;
              data.cell.styles.textColor = val === "PASS" ? COLORS.success : COLORS.danger;
              data.cell.styles.fontStyle = "bold";
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      if (safetyMetrics.length > 0) {
        checkPageBreak(30);
        drawText("Safety Metrics", 9, COLORS.primary, true);
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["Metric", "Avg Score", "Pass Rate", "Threshold", "Status", "Rating"]],
          body: buildRows(safetyMetrics),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [153, 27, 27], textColor: COLORS.white, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [254, 242, 242] },
          didParseCell: (data) => {
            if (data.section === "body" && data.column.index === 4) {
              const val = data.cell.raw as string;
              data.cell.styles.textColor = val === "PASS" ? COLORS.success : COLORS.danger;
              data.cell.styles.fontStyle = "bold";
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }
    }
  }

  // ── Safety & Compliance ──
  if (enabledSections.has("safety-compliance")) {
    drawSectionHeader("6. Safety & Compliance");
    drawText(
      "This section highlights safety-relevant metrics in the context of AI governance frameworks " +
      "such as the EU AI Act (Article 55) and COMPL-AI technical requirements.",
      9,
    );
    y += 2;

    for (const exp of experiments) {
      const safety = Object.entries(exp.metricSummaries).filter(([name]) => isSafetyMetric(name));
      if (safety.length === 0) {
        drawText("No safety metrics were evaluated for this experiment.", 9, COLORS.warning);
        continue;
      }

      drawText(`Experiment: ${exp.name || exp.id}`, 10, COLORS.primary, true);
      for (const [name, m] of safety) {
        const threshold = exp.metricThresholds[name] ?? 0.5;
        const inverted = isInvertedMetric(name);
        const passed = didPass(m.averageScore, threshold, inverted);
        const pct = (m.averageScore * 100).toFixed(1);

        drawKeyValue(formatMetricName(name), `${pct}% (${passed ? "PASS" : "FAIL"})`);

        if (!passed) {
          const note = inverted
            ? `Score of ${pct}% exceeds the ${(threshold * 100).toFixed(0)}% threshold. ` +
              `Review flagged samples and consider additional safeguards.`
            : `Score of ${pct}% is below the ${(threshold * 100).toFixed(0)}% threshold. ` +
              `Further investigation recommended.`;
          drawText(`  → ${note}`, 8, COLORS.danger);
        }
      }
      y += 3;
    }
  }

  // ── Sample-Level Details ──
  if (enabledSections.has("sample-details")) {
    for (const exp of experiments) {
      if (!exp.detailedResults || exp.detailedResults.length === 0) continue;

      addPage();
      drawSectionHeader(`7. Sample Details — ${exp.name || exp.id}`);

      const metricNames = Object.keys(exp.detailedResults[0]?.metricScores || {});
      const head = ["#", "Input (truncated)", ...metricNames.map(formatMetricName)];
      const body = exp.detailedResults.slice(0, 50).map((s, i) => [
        String(i + 1),
        s.input.length > 60 ? s.input.slice(0, 60) + "…" : s.input,
        ...metricNames.map(m => {
          const sc = s.metricScores[m];
          if (!sc) return "N/A";
          return `${(sc.score * 100).toFixed(0)}% ${sc.passed ? "✓" : "✗"}`;
        }),
      ]);

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [head],
        body,
        styles: { fontSize: 7, cellPadding: 1.5, overflow: "ellipsize" },
        headStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: COLORS.lightBg },
        columnStyles: { 1: { cellWidth: 50 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      if (exp.detailedResults.length > 50) {
        drawText(`Showing 50 of ${exp.detailedResults.length} samples.`, 8, COLORS.secondary);
      }
    }
  }

  // ── Arena Comparison ──
  if (enabledSections.has("arena-comparison") && arenaData.length > 0) {
    checkPageBreak(40);
    drawSectionHeader("8. Arena Comparison");

    for (const arena of arenaData) {
      drawText(`Arena: ${arena.name || arena.id}`, 10, COLORS.primary, true);
      drawKeyValue("Winner", arena.winner || "Tie");
      drawKeyValue("Rounds", String(arena.rounds));
      drawKeyValue("Criteria", arena.criteria.join(", "));
      y += 2;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Model", "Wins", "Losses", "Ties", "Avg Score"]],
        body: arena.contestants.map(c => [
          c.model,
          String(c.wins),
          String(c.losses),
          String(c.ties),
          `${(c.avgScore * 100).toFixed(1)}%`,
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontStyle: "bold" },
        alternateRowStyles: { fillColor: COLORS.lightBg },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ── Recommendations ──
  if (enabledSections.has("recommendations")) {
    checkPageBreak(30);
    drawSectionHeader("9. Limitations & Recommendations");

    const recommendations: string[] = [];

    for (const exp of experiments) {
      const entries = Object.entries(exp.metricSummaries);
      for (const [name, m] of entries) {
        const threshold = exp.metricThresholds[name] ?? 0.5;
        const inverted = isInvertedMetric(name);
        if (!didPass(m.averageScore, threshold, inverted)) {
          const display = formatMetricName(name);
          if (inverted) {
            recommendations.push(
              `${display} score (${(m.averageScore * 100).toFixed(1)}%) exceeds threshold in "${exp.name || exp.id}". ` +
              `Consider adding guardrails or content filters.`
            );
          } else {
            recommendations.push(
              `${display} score (${(m.averageScore * 100).toFixed(1)}%) is below threshold in "${exp.name || exp.id}". ` +
              `Consider fine-tuning, prompt engineering, or switching models.`
            );
          }
        }
      }
    }

    if (recommendations.length === 0) {
      drawText("All evaluated metrics are within configured thresholds. Continue monitoring.", 9, COLORS.success);
    } else {
      for (const rec of recommendations) {
        drawText(`• ${rec}`, 9);
      }
    }

    y += 6;
    drawText(
      "Limitations: Evaluation results depend on the dataset, judge model, and configured thresholds. " +
      "Scores should be interpreted in context and validated against domain-specific requirements. " +
      "This report follows the EvalCards and Eval Factsheets frameworks for standardized documentation.",
      8,
      COLORS.secondary,
    );
  }

  // ── Footer on all pages ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondary);
    doc.text(`VerifyWise — LLM Evaluation Report`, margin, pageH - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageH - 8);
  }

  const filename = `${(config.title || projectName).replace(/[^a-z0-9]/gi, "_").toLowerCase()}_eval_report.pdf`;
  doc.save(filename);
}

// ==================== CSV Generation ====================

export function generateCSVReport(
  experiments: ReportExperimentData[],
  projectName: string,
): void {
  const rows: string[][] = [];

  rows.push(["LLM Evaluation Report"]);
  rows.push(["Project", projectName]);
  rows.push(["Generated", new Date().toISOString()]);
  rows.push([]);

  rows.push(["EXPERIMENT SUMMARY"]);
  rows.push(["Experiment", "Model", "Dataset", "Judge/Scorer", "Samples", "Status", "Created"]);
  for (const exp of experiments) {
    rows.push([
      exp.name || exp.id,
      exp.model,
      exp.dataset || "",
      exp.judge || exp.scorer || "",
      String(exp.totalSamples),
      exp.status,
      exp.createdAt,
    ]);
  }
  rows.push([]);

  rows.push(["METRIC RESULTS"]);
  rows.push(["Experiment", "Metric", "Avg Score", "Pass Rate", "Min", "Max", "Threshold", "Status", "Category"]);
  for (const exp of experiments) {
    for (const [name, m] of Object.entries(exp.metricSummaries)) {
      const inverted = isInvertedMetric(name);
      const threshold = exp.metricThresholds[name] ?? 0.5;
      const passed = didPass(m.averageScore, threshold, inverted);
      rows.push([
        exp.name || exp.id,
        formatMetricName(name),
        (m.averageScore * 100).toFixed(1) + "%",
        (m.passRate * 100).toFixed(1) + "%",
        (m.minScore * 100).toFixed(1) + "%",
        (m.maxScore * 100).toFixed(1) + "%",
        (threshold * 100).toFixed(0) + "%",
        passed ? "PASS" : "FAIL",
        isSafetyMetric(name) ? "Safety" : "Quality",
      ]);
    }
  }

  // Sample details
  for (const exp of experiments) {
    if (!exp.detailedResults || exp.detailedResults.length === 0) continue;
    rows.push([]);
    rows.push([`SAMPLE DETAILS — ${exp.name || exp.id}`]);
    const metricNames = Object.keys(exp.detailedResults[0]?.metricScores || {});
    rows.push(["#", "Input", "Output", ...metricNames.map(m => `${formatMetricName(m)} Score`), ...metricNames.map(m => `${formatMetricName(m)} Passed`)]);
    for (const [i, s] of exp.detailedResults.entries()) {
      rows.push([
        String(i + 1),
        s.input.replace(/"/g, '""'),
        s.actualOutput.replace(/"/g, '""'),
        ...metricNames.map(m => s.metricScores[m] ? (s.metricScores[m].score * 100).toFixed(1) + "%" : "N/A"),
        ...metricNames.map(m => s.metricScores[m] ? (s.metricScores[m].passed ? "YES" : "NO") : "N/A"),
      ]);
    }
  }

  const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_eval_report.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
