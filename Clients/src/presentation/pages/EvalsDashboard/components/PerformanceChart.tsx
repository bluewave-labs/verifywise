import { useState, useEffect, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { experimentsService, evaluationLogsService, type Experiment, type EvaluationLog } from "../../../../infrastructure/api/evaluationLogsService";

interface PerformanceChartProps {
  projectId: string;
}

// Metric definitions - maps camelCase keys to labels and colors
const metricDefinitions: Record<string, { label: string; color: string }> = {
  // Standard DeepEval metrics
  answerRelevancy: { label: "Answer Relevancy", color: "#2563eb" },
  faithfulness: { label: "Faithfulness", color: "#16a34a" },
  contextualRelevancy: { label: "Contextual Relevancy", color: "#0891b2" },
  contextualRecall: { label: "Contextual Recall", color: "#0d9488" },
  contextualPrecision: { label: "Contextual Precision", color: "#059669" },
  bias: { label: "Bias", color: "#dc2626" },
  toxicity: { label: "Toxicity", color: "#7c3aed" },
  hallucination: { label: "Hallucination", color: "#ea580c" },
  // Chatbot-specific metrics
  knowledgeRetention: { label: "Knowledge Retention", color: "#8b5cf6" },
  conversationCompleteness: { label: "Conversation Completeness", color: "#06b6d4" },
  conversationRelevancy: { label: "Conversation Relevancy", color: "#14b8a6" },
  roleAdherence: { label: "Role Adherence", color: "#f59e0b" },
  // Agent metrics
  taskCompletion: { label: "Task Completion", color: "#10b981" },
  toolCorrectness: { label: "Tool Correctness", color: "#6366f1" },
  // G-Eval metrics (legacy support)
  answerCorrectness: { label: "Answer Correctness", color: "#2563eb" },
  coherence: { label: "Coherence", color: "#16a34a" },
  tonality: { label: "Tonality", color: "#f59e0b" },
  safety: { label: "Safety", color: "#7c3aed" },
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
  [key: string]: number | string | null;
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

          // Build chart point
          const point: ChartPoint = {
            name: `Run ${i + 1}`,
            date: new Date(exp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          };

          // Add all found metrics to the point
          Object.keys(metricsSum).forEach((metricKey) => {
            if (metricsSum[metricKey].count > 0) {
              point[metricKey] = metricsSum[metricKey].sum / metricsSum[metricKey].count;
            }
          });

          chartData.push(point);
        } catch (err) {
          console.error(`Failed to load logs for experiment ${exp.id}:`, err);
        }
      }

      setData(chartData);
      // Only show metrics that have at least one data point
      setActiveMetrics(Array.from(metricsFound).filter((m) => m in metricDefinitions));
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

  return (
    <Box sx={{
      width: "100%",
      minHeight: 320,
      height: 360,
      "& *": { outline: "none !important" },
      "& *:focus": { outline: "none !important" },
    }}>
      <ResponsiveContainer key={`rc-${projectId}-${data.length}-${activeMetrics.join(",")}`} width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis 
            domain={[0, 1]} 
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const metricDef = metricDefinitions[name as keyof typeof metricDefinitions];
              return [`${(value * 100).toFixed(1)}%`, metricDef?.label || name];
            }}
            contentStyle={{ 
              backgroundColor: "#fff", 
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          <Legend 
            formatter={(value: string) => {
              const metricDef = metricDefinitions[value as keyof typeof metricDefinitions];
              return metricDef?.label || value;
            }}
          />
          {metricsToDisplay.map((metricKey) => {
            const metricDef = metricDefinitions[metricKey];
            if (!metricDef) return null;
            return (
              <Line
                key={metricKey}
                type="monotone"
                dataKey={metricKey}
                stroke={metricDef.color}
                strokeWidth={2}
                name={metricKey}
                dot={{ r: 4, fill: metricDef.color }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

