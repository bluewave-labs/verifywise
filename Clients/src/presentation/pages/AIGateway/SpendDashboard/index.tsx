import { useState, useEffect } from "react";
import { Box, Typography, Stack, useTheme } from "@mui/material";
import { DollarSign, Hash, Layers, Clock } from "lucide-react";
import { StatCard } from "../../../components/Cards/StatCard";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { EmptyState } from "../../../components/EmptyState";
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
  const [byEndpoint, setByEndpoint] = useState<any[]>([]);
  const [byUser, setByUser] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [spendRes, endpointRes, userRes] = await Promise.all([
          apiServices.get(`/ai-gateway/spend?period=${period}`),
          apiServices.get(`/ai-gateway/spend/by-endpoint?period=${period}`).catch(() => null),
          apiServices.get(`/ai-gateway/spend/by-user?period=${period}`).catch(() => null),
        ]);
        setData(spendRes?.data?.data || null);
        setByEndpoint(endpointRes?.data?.data || []);
        setByUser(userRes?.data?.data || []);
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
  const byModel = data?.byModel || [];

  const totalCost = summary ? `$${Number(summary.total_cost).toFixed(4)}` : "$0.00";
  const totalRequests = String(summary?.total_requests ?? 0);
  const totalTokens = summary ? Number(summary.total_tokens).toLocaleString() : "0";
  const avgLatency = summary ? `${Math.round(summary.avg_latency_ms || 0)}ms` : "0ms";

  const hasData = byDay.length > 0 || byModel.length > 0 || byEndpoint.length > 0;

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
      {!loading && !hasData && (
        <EmptyState
          icon={DollarSign}
          message="No spend data for this period. Send requests through the gateway to see cost analytics here."
          showBorder
        />
      )}

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

      {/* Two-column: Cost by model + Cost by endpoint */}
      {!loading && (byModel.length > 0 || byEndpoint.length > 0) && (
        <Stack direction={{ xs: "column", md: "row" }} gap="16px">
          {/* Cost by model */}
          {byModel.length > 0 && (
            <Box sx={{ ...cardSx, flex: 1 }}>
              <Stack gap="12px">
                <Typography sx={sectionTitleSx}>Cost by model</Typography>
                <ResponsiveContainer width="100%" height={Math.max(160, byModel.length * 36)}>
                  <BarChart data={byModel} layout="vertical" margin={{ left: 80, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.border.light} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: palette.text.tertiary }}
                      tickLine={false}
                      axisLine={{ stroke: palette.border.light }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="group_key"
                      tick={{ fontSize: 11, fill: palette.text.tertiary }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 4, border: `1px solid ${palette.border.light}` }}
                      formatter={(value: number) => [`$${Number(value).toFixed(6)}`, "Cost"]}
                    />
                    <Bar dataKey="total_cost" radius={[0, 4, 4, 0]} barSize={20}>
                      {byModel.map((_: any, i: number) => (
                        <Cell key={i} fill={chartPalette[i % chartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Stack>
            </Box>
          )}

          {/* Cost by endpoint */}
          {byEndpoint.length > 0 && (
            <Box sx={{ ...cardSx, flex: 1 }}>
              <Stack gap="12px">
                <Typography sx={sectionTitleSx}>Cost by endpoint</Typography>
                <Stack gap="8px">
                  {byEndpoint.map((ep: any, i: number) => (
                    <Stack
                      key={ep.group_key}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: "8px 12px",
                        borderRadius: "4px",
                        border: `1px solid ${palette.border.light}`,
                      }}
                    >
                      <Stack direction="row" alignItems="center" gap="8px">
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: chartPalette[i % chartPalette.length],
                            flexShrink: 0,
                          }}
                        />
                        <Typography sx={{ fontSize: 13 }}>{ep.group_key}</Typography>
                      </Stack>
                      <Stack direction="row" gap="16px" alignItems="center">
                        <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                          {Number(ep.total_requests).toLocaleString()} req
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          ${Number(ep.total_cost).toFixed(4)}
                        </Typography>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Box>
          )}
        </Stack>
      )}

      {/* Top users */}
      {!loading && byUser.length > 0 && (
        <Box sx={cardSx}>
          <Stack gap="12px">
            <Typography sx={sectionTitleSx}>Top users</Typography>
            <Stack gap="8px">
              {byUser.slice(0, 10).map((user: any, i: number) => (
                <Stack
                  key={user.group_key}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: "8px 12px",
                    borderRadius: "4px",
                    border: `1px solid ${palette.border.light}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" gap="8px">
                    <Typography sx={{ fontSize: 12, color: palette.text.disabled, fontWeight: 600, minWidth: 20 }}>
                      {i + 1}
                    </Typography>
                    <Typography sx={{ fontSize: 13 }}>{user.group_key}</Typography>
                  </Stack>
                  <Stack direction="row" gap="16px" alignItems="center">
                    <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                      {Number(user.total_requests).toLocaleString()} req
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                      {Number(user.total_tokens).toLocaleString()} tokens
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      ${Number(user.total_cost).toFixed(4)}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Box>
      )}
    </PageHeaderExtended>
  );
}
