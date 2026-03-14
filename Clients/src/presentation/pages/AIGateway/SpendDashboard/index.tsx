import { useState, useEffect, useMemo } from "react";
import { Box, Typography, Stack, useTheme } from "@mui/material";
import { DollarSign, Hash, Layers, Clock } from "lucide-react";
import { StatCard } from "../../../components/Cards/StatCard";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette, { chart as chartPalette } from "../../../themes/palette";

const PERIODS = [
  { label: "Today", value: "1d" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

const sectionTitleSx = {
  fontWeight: 600,
  fontSize: 16,
};

function useCardSx() {
  const theme = useTheme();
  return {
    background: theme.palette.background.paper,
    border: `1.5px solid ${theme.palette.border.light}`,
    borderRadius: theme.shape.borderRadius,
    p: theme.spacing(5, 6),
    boxShadow: "none",
  };
}

export default function SpendDashboardPage() {
  const cardSx = useCardSx();
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await apiServices.get(`/ai-gateway/spend?period=${period}`);
        setData(response?.data?.data || null);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const summary = data?.summary;
  const byDay = data?.byDay || [];

  const totalCost = summary ? `$${Number(summary.total_cost).toFixed(4)}` : "$0.00";
  const totalRequests = String(summary?.total_requests ?? 0);
  const totalTokens = summary ? Number(summary.total_tokens).toLocaleString() : "0";
  const avgLatency = summary ? `${Math.round(summary.avg_latency_ms)}ms` : "0ms";

  return (
    <PageHeaderExtended
      title="Spend"
      description="Monitor LLM usage and costs across your organization."
      tipBoxEntity="ai-gateway-spend"
      actionButton={
        <Stack direction="row" gap="4px">
          {PERIODS.map((p) => (
            <Box
              key={p.value}
              onClick={() => setPeriod(p.value)}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: "4px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                backgroundColor: period === p.value ? palette.brand.primary : "transparent",
                color: period === p.value ? palette.background.main : palette.text.tertiary,
                "&:hover": {
                  backgroundColor: period === p.value ? palette.brand.primary : palette.background.hover,
                },
              }}
            >
              {p.label}
            </Box>
          ))}
        </Stack>
      }
      summaryCards={
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <StatCard title="Total cost" value={totalCost} Icon={DollarSign} />
          <StatCard title="Total requests" value={totalRequests} Icon={Hash} />
          <StatCard title="Total tokens" value={totalTokens} Icon={Layers} />
          <StatCard title="Avg latency" value={avgLatency} Icon={Clock} />
        </Box>
      }
    >
      {/* Cost over time chart */}
      {!loading && byDay.length > 0 && (
        <Box sx={cardSx}>
          <Stack gap="12px">
            <Typography sx={sectionTitleSx}>Cost over time</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.border.light} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: palette.text.tertiary }}
                  tickLine={false}
                  axisLine={{ stroke: palette.border.light }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: palette.text.tertiary }}
                  tickLine={false}
                  axisLine={{ stroke: palette.border.light }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 4,
                    border: `1px solid ${palette.border.light}`,
                  }}
                  formatter={(value: number) => [`$${value.toFixed(6)}`, "Cost"]}
                />
                <Line
                  type="monotone"
                  dataKey="total_cost"
                  stroke={chartPalette[0]}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Stack>
        </Box>
      )}
    </PageHeaderExtended>
  );
}
