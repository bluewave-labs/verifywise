import { useState, useEffect, useMemo } from "react";
import { Box, Typography, Stack, useTheme } from "@mui/material";
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

  const cards = useMemo(() => [
    { label: "Total cost", value: summary ? `$${Number(summary.total_cost).toFixed(4)}` : "$0.00" },
    { label: "Total requests", value: summary?.total_requests ?? 0 },
    { label: "Total tokens", value: summary ? Number(summary.total_tokens).toLocaleString() : "0" },
    { label: "Avg latency", value: summary ? `${Math.round(summary.avg_latency_ms)}ms` : "0ms" },
  ], [summary]);

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
        <Stack direction="row" gap="16px">
          {cards.map((card) => (
            <Box
              key={card.label}
              sx={{
                flex: 1,
                p: "12px 16px",
                border: `1px solid ${palette.border.dark}`,
                borderRadius: "4px",
              }}
            >
              <Typography sx={{ fontSize: 11, color: palette.text.tertiary, textTransform: "uppercase", fontWeight: 500 }}>
                {card.label}
              </Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 600, mt: 0.5 }}>
                {card.value}
              </Typography>
            </Box>
          ))}
        </Stack>
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
