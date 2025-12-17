import { useState, useEffect, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { experimentsService, evaluationLogsService, type Experiment, type EvaluationLog } from "../../../../infrastructure/api/evaluationLogsService";

interface PerformanceChartProps {
  projectId: string;
}

// 15 distinct colors for the chart - no repetition
const CHART_COLORS = [
  "#2563EB", // Blue
  "#DC2626", // Red
  "#16A34A", // Green
  "#7C3AED", // Purple
  "#EA580C", // Orange
  "#0891B2", // Cyan
  "#DB2777", // Pink
  "#CA8A04", // Yellow
  "#0D9488", // Teal
  "#4F46E5", // Indigo
  "#059669", // Emerald
  "#9333EA", // Violet
  "#C026D3", // Fuchsia
  "#65A30D", // Lime
  "#0284C7", // Sky
];

// Metric definitions - maps camelCase keys to labels
const metricDefinitions: Record<string, { label: string }> = {
  // Standard DeepEval metrics
  answerRelevancy: { label: "Answer Relevancy" },
  faithfulness: { label: "Faithfulness" },
  contextualRelevancy: { label: "Contextual Relevancy" },
  contextualRecall: { label: "Contextual Recall" },
  contextualPrecision: { label: "Contextual Precision" },
  bias: { label: "Bias" },
  toxicity: { label: "Toxicity" },
  hallucination: { label: "Hallucination" },
  // Chatbot-specific metrics
  knowledgeRetention: { label: "Knowledge Retention" },
  conversationCompleteness: { label: "Conversation Completeness" },
  conversationRelevancy: { label: "Conversation Relevancy" },
  roleAdherence: { label: "Role Adherence" },
  // Agent metrics
  taskCompletion: { label: "Task Completion" },
  toolCorrectness: { label: "Tool Correctness" },
  // G-Eval metrics (legacy support)
  answerCorrectness: { label: "Answer Correctness" },
  coherence: { label: "Coherence" },
  tonality: { label: "Tonality" },
  safety: { label: "Safety" },
};

// Get color for a metric by index to ensure unique colors
const getMetricColor = (index: number): string => {
  return CHART_COLORS[index % CHART_COLORS.length];
};

// Convert snake_case or camelCase to Title Case for custom scorers
const formatMetricLabel = (key: string): string => {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Map old display names to camelCase keys for backwards compatibility
const displayNameToKey: Record<string, string> = {
  "Answer Relevancy": "answerRelevancy",
  "Faithfulness": "faithfulness",
  "Contextual Relevancy": "contextualRelevancy",
  "Contextual Recall": "contextualRecall",
  "Contextual Precision": "contextualPrecision",
  "Bias": "bias",
  "Toxicity": "toxicity",
  "Hallucination": "hallucination",
  "Knowledge Retention": "knowledgeRetention",
  "Conversation Completeness": "conversationCompleteness",
  "Conversation Relevancy": "conversationRelevancy",
  "Role Adherence": "roleAdherence",
  "Task Completion": "taskCompletion",
  "Tool Correctness": "toolCorrectness",
  "Answer Correctness": "answerCorrectness",
  "Coherence": "coherence",
  "Tonality": "tonality",
  "Safety": "safety",
};

type ChartPoint = {
  name: string;
  date: string;
  uniqueId: string; // Unique identifier for each experiment (date + time)
  _calculatedMetrics: string[]; // Track which metrics were actually calculated for this point
  [key: string]: number | string | string[] | null;
};

export default function PerformanceChart({ projectId }: PerformanceChartProps) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [activeMetrics, setActiveMetrics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load experiments and compute metric averages from evaluation logs
  const loadPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      const expsResp = await experimentsService.getAllExperiments({ project_id: projectId });
      const experiments: Experiment[] = expsResp.experiments || [];

      // Filter completed experiments and sort by date
      const completedExps = experiments
        .filter((exp) => exp.status === "completed")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-10); // Limit to last 10 runs

      if (completedExps.length === 0) {
        setData([]);
        setActiveMetrics([]);
        return;
      }

      // For each experiment, fetch logs and calculate average metrics
      const chartData: ChartPoint[] = [];
      const metricsFound = new Set<string>();

      for (let i = 0; i < completedExps.length; i++) {
        const exp = completedExps[i];
        try {
          const logsResp = await evaluationLogsService.getLogs({
            experiment_id: exp.id,
            limit: 1000,
          });
          const logs: EvaluationLog[] = logsResp.logs || [];

          // Calculate average for each metric from logs
          const metricsSum: Record<string, { sum: number; count: number }> = {};
          logs.forEach((log) => {
            if (log.metadata?.metric_scores) {
              Object.entries(log.metadata.metric_scores).forEach(([rawKey, value]) => {
                // Normalize key: convert display names to camelCase, or keep if already camelCase
                const key = displayNameToKey[rawKey] || rawKey;
                
                const score = typeof value === "number" ? value : (value as { score?: number })?.score;
                if (typeof score === "number") {
                  if (!metricsSum[key]) metricsSum[key] = { sum: 0, count: 0 };
                  metricsSum[key].sum += score;
                  metricsSum[key].count += 1;
                  metricsFound.add(key);
                }
              });
            }
          });

          // Build chart point - track which metrics were actually calculated
          const calculatedMetrics: string[] = [];
          const dateStr = new Date(exp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const timeStr = new Date(exp.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
          const point: ChartPoint = {
            name: `Run ${i + 1}`,
            // Use unique identifier combining date and time to avoid confusion with same-day experiments
            date: `${dateStr}`,
            uniqueId: `${dateStr} ${timeStr}`,
            _calculatedMetrics: calculatedMetrics,
          };

          // Add all found metrics to the point
          Object.keys(metricsSum).forEach((metricKey) => {
            if (metricsSum[metricKey].count > 0) {
              point[metricKey] = metricsSum[metricKey].sum / metricsSum[metricKey].count;
              calculatedMetrics.push(metricKey); // Track that this metric was calculated
            }
          });

          chartData.push(point);
        } catch (err) {
          console.error(`Failed to load logs for experiment ${exp.id}:`, err);
        }
      }

      setData(chartData);
      // Show all metrics that have data (including custom scorers)
      setActiveMetrics(Array.from(metricsFound));
    } catch (err: unknown) {
      console.error("Failed to load performance data:", err);
      setData([]);
      setActiveMetrics([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadPerformanceData();
  }, [loadPerformanceData]);

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body2" color="text.secondary">
          Loading performance data...
        </Typography>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body2" color="text.secondary">
          No completed experiments yet. Run experiments to see performance trends.
        </Typography>
      </Box>
    );
  }

  // Get the metrics to display - only those that have data
  const metricsToDisplay = activeMetrics.length > 0 
    ? activeMetrics 
    : Object.keys(metricDefinitions);

  // Calculate dynamic height based on number of legend items
  // Estimate ~10 items per line, each line ~20px
  const itemsPerLine = 10;
  const legendLineHeight = 20;
  const legendLines = Math.ceil(metricsToDisplay.length / itemsPerLine);
  const baseChartHeight = 200; // Base height for chart area
  const legendHeight = legendLines * legendLineHeight + 12; // +12 for padding
  const dynamicHeight = baseChartHeight + legendHeight;

  // Create a color map for metrics (used by custom tooltip)
  const metricColorMap: Record<string, string> = {};
  metricsToDisplay.forEach((metricKey, index) => {
    metricColorMap[metricKey] = getMetricColor(index);
  });

  // Custom tooltip that only shows metrics that were actually calculated for this data point
  interface TooltipEntry {
    dataKey: string;
    value: number | null | undefined;
    color?: string;
    payload?: ChartPoint;
  }
  
  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;

    // Get the actual data point from recharts payload
    const dataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    // Only show metrics that actually exist as a key in this data point
    // (not name, date, uniqueId, or _calculatedMetrics)
    const excludeKeys = ["name", "date", "uniqueId", "_calculatedMetrics"];
    
    const validEntries = payload.filter((entry: TooltipEntry) => {
      const metricKey = entry.dataKey as string;
      // Check if this metric key actually exists in the data point with a real value
      const hasValue = metricKey in dataPoint && 
                       !excludeKeys.includes(metricKey) &&
                       dataPoint[metricKey] !== null && 
                       dataPoint[metricKey] !== undefined;
      return hasValue;
    });

    if (validEntries.length === 0) return null;

    return (
      <Box
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: "12px",
          minWidth: "180px",
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: "13px", mb: 1 }}>
          {dataPoint.uniqueId || label}
        </Typography>
        {validEntries.map((entry: TooltipEntry) => {
          const metricKey = entry.dataKey as string;
          const metricDef = metricDefinitions[metricKey as keyof typeof metricDefinitions];
          const metricLabel = metricDef?.label || formatMetricLabel(metricKey);
          const color = metricColorMap[metricKey] || entry.color;
          // Use the actual value from the data point, not from entry.value (which can be interpolated)
          const rawValue = dataPoint[metricKey];
          const value = typeof rawValue === "number" ? (rawValue * 100).toFixed(1) : "0";

          return (
            <Box
              key={metricKey}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 0.25,
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: color,
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: "12px", color: "#374151" }}>
                {metricLabel} : <span style={{ fontWeight: 600 }}>{value}%</span>
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{
      width: "100%",
      minHeight: 220,
      height: dynamicHeight,
      "& *": { outline: "none !important" },
      "& *:focus": { outline: "none !important" },
    }}>
      <ResponsiveContainer key={`rc-${projectId}-${data.length}-${activeMetrics.join(",")}`} width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="uniqueId" 
            tick={{ fontSize: 10, fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={40}
          />
          <YAxis 
            domain={[0, 1]} 
            tick={{ fontSize: 10, fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
            formatter={(value: string) => {
              const metricDef = metricDefinitions[value as keyof typeof metricDefinitions];
              return metricDef?.label || formatMetricLabel(value);
            }}
          />
          {metricsToDisplay.map((metricKey, index) => {
            const color = getMetricColor(index);
            return (
              <Line
                key={metricKey}
                type="monotone"
                dataKey={metricKey}
                stroke={color}
                strokeWidth={1.5}
                name={metricKey}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
                connectNulls={false}
                legendType="plainline"
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

