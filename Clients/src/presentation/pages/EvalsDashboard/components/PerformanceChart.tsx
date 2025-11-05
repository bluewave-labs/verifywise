import { useState, useEffect, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PerformanceChartProps {
  projectId: string;
}

export default function PerformanceChart({ projectId }: PerformanceChartProps) {
  type ChartPoint = {
    name: string;
    answerRelevancy: number | null;
    bias: number | null;
    toxicity: number | null;
    faithfulness: number | null;
    hallucination: number | null;
    contextualRelevancy: number | null;
  };
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

// Static imports for Vite
  const loadPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      const { experimentsService, metricsService } = await import("../../../../infrastructure/api/evaluationLogsService");
      const expsResp = await experimentsService.getAllExperiments({ project_id: projectId });
      const metsResp = await metricsService.getMetrics({ project_id: projectId });
      const experiments = expsResp.experiments || [];
      const metrics = metsResp.metrics || [];

      // Group metrics by experiment
      const byExp: Record<string, Record<string, number>> = {};
      metrics.forEach((m: { experiment_id?: string; metric_name: string; value: number }) => {
        const expId = m.experiment_id;
        if (!expId) return;
        if (!byExp[expId]) byExp[expId] = {};
        byExp[expId][m.metric_name] = m.value;
      });

      const sorted = [...experiments].sort((a: { created_at: string }, b: { created_at: string }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const chart: ChartPoint[] = sorted.map((exp: { id: string }, idx: number) => {
        const m = byExp[exp.id] || {};
        return {
          name: `Run ${idx + 1}`,
          answerRelevancy: m["answer_relevancy"] ?? null,
          bias: m["bias"] ?? null,
          toxicity: m["toxicity"] ?? null,
          faithfulness: m["faithfulness"] ?? null,
          hallucination: m["hallucination"] ?? null,
          contextualRelevancy: m["contextual_relevancy"] ?? null,
        };
      });

      setData(chart);
    } catch (err: unknown) {
      console.error("Failed to load performance data:", err);
      setData([] as ChartPoint[]);
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
          No experiment data yet. Run experiments to see performance trends.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 1]} />
          <Tooltip
            formatter={(value: number) => value.toFixed(3)}
            contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="answerRelevancy"
            stroke="#2563eb"
            strokeWidth={2}
            name="Answer Relevancy"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="bias"
            stroke="#dc2626"
            strokeWidth={2}
            name="Bias"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="toxicity"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Toxicity"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="faithfulness"
            stroke="#16a34a"
            strokeWidth={2}
            name="Faithfulness"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="hallucination"
            stroke="#7c3aed"
            strokeWidth={2}
            name="Hallucination"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="contextualRelevancy"
            stroke="#0ea5e9"
            strokeWidth={2}
            name="Contextual Relevancy"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

