/**
 * Shadow AI Report Chart Utilities
 *
 * SVG chart generators for embedding in PDF/DOCX reports.
 * Follows the same pattern as Servers/services/reporting/chartUtils.ts.
 */

const FONT_FAMILY = "Inter, system-ui, sans-serif";

/**
 * Horizontal bar chart — tools sorted by risk score
 */
export function generateToolRiskChart(
  data: Array<{ name: string; riskScore: number }>,
  options: { width?: number; title?: string } = {}
): string {
  const { width = 450, title = "Tools by risk score" } = options;

  if (!data || data.length === 0) return "";

  const sorted = [...data]
    .filter((d) => d.riskScore > 0)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 12);

  if (sorted.length === 0) return "";

  const maxScore = Math.max(...sorted.map((d) => d.riskScore), 100);
  const barHeight = 24;
  const barGap = 6;
  const labelWidth = 120;
  const chartWidth = width - labelWidth - 50;
  const titleHeight = title ? 30 : 0;
  const chartHeight = sorted.length * (barHeight + barGap) + titleHeight + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${chartHeight}" viewBox="0 0 ${width} ${chartHeight}">`;

  if (title) {
    svg += `<text x="${width / 2}" y="20" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="14" font-weight="600" fill="#1C2130">${title}</text>`;
  }

  sorted.forEach((item, index) => {
    const y = titleHeight + index * (barHeight + barGap) + 8;
    const barW = (item.riskScore / maxScore) * chartWidth;
    const color = getRiskColor(item.riskScore);
    const truncName =
      item.name.length > 16 ? item.name.slice(0, 15) + "…" : item.name;

    svg += `<text x="${labelWidth - 8}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-family="${FONT_FAMILY}" font-size="11" fill="#667085">${truncName}</text>`;
    svg += `<rect x="${labelWidth}" y="${y}" width="${chartWidth}" height="${barHeight}" rx="3" fill="#F2F4F7"/>`;
    if (barW > 0) {
      svg += `<rect x="${labelWidth}" y="${y}" width="${barW}" height="${barHeight}" rx="3" fill="${color}"/>`;
    }
    svg += `<text x="${labelWidth + chartWidth + 8}" y="${y + barHeight / 2 + 4}" font-family="${FONT_FAMILY}" font-size="11" font-weight="500" fill="#1C2130">${item.riskScore}</text>`;
  });

  svg += "</svg>";
  return svg;
}

/**
 * SVG line chart — events over time
 */
export function generateTrendLineChart(
  data: Array<{
    date: string;
    totalEvents: number;
    uniqueUsers: number;
  }>,
  options: { width?: number; height?: number; title?: string } = {}
): string {
  const {
    width = 500,
    height = 200,
    title = "Usage trend",
  } = options;

  if (!data || data.length < 2) return "";

  const padding = { top: title ? 40 : 10, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxEvents = Math.max(...data.map((d) => d.totalEvents), 1);

  const xStep = chartW / (data.length - 1);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  if (title) {
    svg += `<text x="${width / 2}" y="22" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="14" font-weight="600" fill="#1C2130">${title}</text>`;
  }

  // Grid lines
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartH / gridLines) * i;
    const val = Math.round(maxEvents * (1 - i / gridLines));
    svg += `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartW}" y2="${y}" stroke="#F2F4F7" stroke-width="1"/>`;
    svg += `<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" font-family="${FONT_FAMILY}" font-size="10" fill="#98A2B3">${val}</text>`;
  }

  // Events polyline
  const eventsPoints = data
    .map((d, i) => {
      const x = padding.left + i * xStep;
      const y =
        padding.top + chartH - (d.totalEvents / maxEvents) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  svg += `<polyline points="${eventsPoints}" fill="none" stroke="#13715B" stroke-width="2" stroke-linejoin="round"/>`;

  // Dots
  data.forEach((d, i) => {
    const x = padding.left + i * xStep;
    const y =
      padding.top + chartH - (d.totalEvents / maxEvents) * chartH;
    svg += `<circle cx="${x}" cy="${y}" r="3" fill="#13715B"/>`;
  });

  // X-axis labels (show ~6 evenly spaced)
  const labelInterval = Math.max(1, Math.floor(data.length / 6));
  data.forEach((d, i) => {
    if (i % labelInterval === 0 || i === data.length - 1) {
      const x = padding.left + i * xStep;
      const shortDate = d.date.length > 5 ? d.date.slice(5) : d.date;
      svg += `<text x="${x}" y="${height - 8}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="9" fill="#98A2B3">${shortDate}</text>`;
    }
  });

  // Legend
  svg += `<rect x="${padding.left}" y="${height - 22}" width="10" height="10" rx="2" fill="#13715B"/>`;
  svg += `<text x="${padding.left + 14}" y="${height - 13}" font-family="${FONT_FAMILY}" font-size="10" fill="#667085">Events</text>`;

  svg += "</svg>";
  return svg;
}

/**
 * Horizontal bar chart — departments by prompt volume
 */
export function generateDepartmentBarChart(
  data: Array<{ name: string; prompts: number }>,
  options: { width?: number; title?: string } = {}
): string {
  const { width = 450, title = "Departments by activity" } = options;

  if (!data || data.length === 0) return "";

  const sorted = [...data].sort((a, b) => b.prompts - a.prompts).slice(0, 10);
  const maxVal = Math.max(...sorted.map((d) => d.prompts), 1);
  const barHeight = 24;
  const barGap = 6;
  const labelWidth = 120;
  const chartWidth = width - labelWidth - 60;
  const titleHeight = title ? 30 : 0;
  const chartHeight = sorted.length * (barHeight + barGap) + titleHeight + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${chartHeight}" viewBox="0 0 ${width} ${chartHeight}">`;

  if (title) {
    svg += `<text x="${width / 2}" y="20" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="14" font-weight="600" fill="#1C2130">${title}</text>`;
  }

  sorted.forEach((item, index) => {
    const y = titleHeight + index * (barHeight + barGap) + 8;
    const barW = (item.prompts / maxVal) * chartWidth;
    const truncName =
      item.name.length > 16 ? item.name.slice(0, 15) + "…" : item.name;

    svg += `<text x="${labelWidth - 8}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-family="${FONT_FAMILY}" font-size="11" fill="#667085">${truncName}</text>`;
    svg += `<rect x="${labelWidth}" y="${y}" width="${chartWidth}" height="${barHeight}" rx="3" fill="#F2F4F7"/>`;
    if (barW > 0) {
      svg += `<rect x="${labelWidth}" y="${y}" width="${barW}" height="${barHeight}" rx="3" fill="#13715B"/>`;
    }
    svg += `<text x="${labelWidth + chartWidth + 8}" y="${y + barHeight / 2 + 4}" font-family="${FONT_FAMILY}" font-size="11" font-weight="500" fill="#1C2130">${item.prompts.toLocaleString()}</text>`;
  });

  svg += "</svg>";
  return svg;
}

/**
 * Donut chart — compliance posture (approved vs blocked/restricted vs other)
 */
export function generateComplianceDonutChart(
  data: Array<{ status: string; count: number; color: string }>,
  options: { size?: number; title?: string } = {}
): string {
  const { size = 200, title = "" } = options;

  if (!data || data.length === 0) return "";

  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return "";

  const centerX = size / 2;
  const centerY = size / 2 + (title ? 15 : 0);
  const outerRadius = (size - 40) / 2;
  const innerRadius = outerRadius * 0.6;
  const svgHeight = size + (title ? 30 : 0);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${svgHeight}" viewBox="0 0 ${size} ${svgHeight}">`;

  if (title) {
    svg += `<text x="${size / 2}" y="20" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="14" font-weight="600" fill="#1C2130">${title}</text>`;
  }

  let currentAngle = -90;

  data.forEach((item) => {
    if (item.count === 0) return;
    const sliceAngle = (item.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1O = centerX + outerRadius * Math.cos(startRad);
    const y1O = centerY + outerRadius * Math.sin(startRad);
    const x2O = centerX + outerRadius * Math.cos(endRad);
    const y2O = centerY + outerRadius * Math.sin(endRad);
    const x1I = centerX + innerRadius * Math.cos(endRad);
    const y1I = centerY + innerRadius * Math.sin(endRad);
    const x2I = centerX + innerRadius * Math.cos(startRad);
    const y2I = centerY + innerRadius * Math.sin(startRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1O} ${y1O}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2O} ${y2O}`,
      `L ${x1I} ${y1I}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2I} ${y2I}`,
      "Z",
    ].join(" ");

    svg += `<path d="${pathData}" fill="${item.color}"/>`;
    currentAngle = endAngle;
  });

  svg += `<text x="${centerX}" y="${centerY - 5}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="22" font-weight="700" fill="#1C2130">${total}</text>`;
  svg += `<text x="${centerX}" y="${centerY + 13}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="10" fill="#667085">Total tools</text>`;

  svg += "</svg>";
  return svg;
}

/**
 * Donut chart — tool status breakdown
 */
export function generateStatusDonutChart(
  data: Array<{ status: string; count: number; color: string }>,
  options: { size?: number; title?: string } = {}
): string {
  return generateComplianceDonutChart(data, options);
}

/**
 * Legend generator
 */
export function generateLegend(
  data: Array<{ label: string; count: number; color: string }>,
  options: { width?: number } = {}
): string {
  const { width = 400 } = options;

  if (!data || data.length === 0) return "";

  const itemWidth = Math.floor(width / Math.min(data.length, 4));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="24" viewBox="0 0 ${width} 24">`;

  data.forEach((item, index) => {
    const x = (index % 4) * itemWidth;
    svg += `<rect x="${x}" y="6" width="10" height="10" rx="2" fill="${item.color}"/>`;
    svg += `<text x="${x + 14}" y="15" font-family="${FONT_FAMILY}" font-size="10" fill="#667085">${item.label} (${item.count})</text>`;
  });

  svg += "</svg>";
  return svg;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function getRiskColor(score: number): string {
  if (score >= 80) return "#B42318";
  if (score >= 60) return "#C4320A";
  if (score >= 40) return "#B54708";
  if (score >= 1) return "#027A48";
  return "#667085";
}
