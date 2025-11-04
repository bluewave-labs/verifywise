import { useState, useEffect } from "react";
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
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, [projectId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      // TODO: Load actual performance history from API
      // For now, using mock data
      const mockData = [
        {
          name: "Run 1",
          answerRelevancy: 0.72,
          bias: 0.05,
          toxicity: 0.02,
        },
        {
          name: "Run 2",
          answerRelevancy: 0.78,
          bias: 0.03,
          toxicity: 0.01,
        },
        {
          name: "Run 3",
          answerRelevancy: 0.85,
          bias: 0.02,
          toxicity: 0.01,
        },
        {
          name: "Run 4",
          answerRelevancy: 0.82,
          bias: 0.03,
          toxicity: 0.02,
        },
        {
          name: "Run 5",
          answerRelevancy: 0.88,
          bias: 0.01,
          toxicity: 0.00,
        },
      ];

      setData(mockData);
    } catch (err: any) {
      console.error("Failed to load performance data:", err);
    } finally {
      setLoading(false);
    }
  };

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
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

