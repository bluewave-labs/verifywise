import { useState, useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { DollarSign, Hash, Layers, Clock, BarChart3, Router, Users, ShieldCheck, ShieldOff, Info } from "lucide-react";
import { Tooltip as MuiTooltip } from "@mui/material";
import Select from "../../../components/Inputs/Select";
import { StatCard } from "../../../components/Cards/StatCard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette, { chart as chartPalette } from "../../../themes/palette";
import { sectionTitleSx, useCardSx } from "../shared";

const PERIOD_OPTIONS = [
  { _id: "1d", name: "Today" },
  { _id: "7d", name: "7 days" },
  { _id: "30d", name: "30 days" },
  { _id: "90d", name: "90 days" },
];

export default function SpendDashboardPage() {
  const cardSx = useCardSx();
  const [period, setPeriod] = useState(() => {
    return localStorage.getItem("vw_ai_gateway_analytics_period") || "1d";
  });
  const [data, setData] = useState<any>(null);
  const [byEndpoint, setByEndpoint] = useState<any[]>([]);
  const [byUser, setByUser] = useState<any[]>([]);
  const [guardrailStats, setGuardrailStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [spendRes, endpointRes, userRes, gsRes] = await Promise.all([
          apiServices.get(`/ai-gateway/spend?period=${period}`),
          apiServices.get(`/ai-gateway/spend/by-endpoint?period=${period}`).catch(() => null),
          apiServices.get(`/ai-gateway/spend/by-user?period=${period}`).catch(() => null),
          apiServices.get(`/ai-gateway/guardrails/stats?period=${period}`).catch(() => null),
        ]);
        setData(spendRes?.data?.data || null);
        setByEndpoint(endpointRes?.data?.data || []);
        setByUser(userRes?.data?.data || []);
        setGuardrailStats(gsRes?.data?.data || null);
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
      title="Analytics"
      description="Monitor LLM usage and costs across your organization."
      tipBoxEntity="ai-gateway-analytics"
      helpArticlePath="ai-gateway/analytics"
      actionButton={
        <Select
          id="analytics-period"
          value={period}
          items={PERIOD_OPTIONS}
          onChange={(e) => {
            const val = e.target.value as string;
            setPeriod(val);
            localStorage.setItem("vw_ai_gateway_analytics_period", val);
          }}
          sx={{ width: 140 }}
        />
      }
      summaryCards={
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <StatCard title="Total cost" value={totalCost} Icon={DollarSign} tooltip="Total spend across all endpoints for this period" />
          <StatCard title="Total requests" value={totalRequests} Icon={Hash} tooltip="Number of completion and embedding requests processed" />
          <StatCard title="Total tokens" value={totalTokens} Icon={Layers} tooltip="Combined prompt and completion tokens across all requests" />
          <StatCard title="Avg latency" value={avgLatency} Icon={Clock} tooltip="Average round-trip time from request to complete response" />
        </Box>
      }
    >
      {!loading && !hasData && (
        <EmptyState
          icon={BarChart3}
          message="No analytics data for this period. Send requests through the gateway to see usage and cost breakdowns here."
          showBorder
        >
          <EmptyStateTip
            icon={Router}
            title="Configure endpoints to start tracking"
            description="Create an endpoint in the Endpoints tab and send your first request. Every request is automatically logged with cost, tokens, and latency."
          />
          <EmptyStateTip
            icon={DollarSign}
            title="Cost breakdowns by model and endpoint"
            description="Once requests flow through, you'll see cost-over-time charts, per-model spend comparisons, and endpoint-level breakdowns to help optimize your provider strategy."
          />
          <EmptyStateTip
            icon={Users}
            title="Track usage by team members"
            description="See which users are sending the most requests and consuming the most tokens. Use this to identify training opportunities and allocate budgets effectively."
          />
        </EmptyState>
      )}

      {/* Cost over time chart */}
      {!loading && byDay.length > 0 && (
        <Box sx={cardSx}>
          <Stack gap="12px">
            <Stack direction="row" alignItems="center" gap="6px">
              <Typography sx={sectionTitleSx}>{period === "1d" ? "Cost by hour" : "Cost over time"}</Typography>
              <MuiTooltip title={period === "1d" ? "Hourly spend breakdown for today" : "Daily spend trend across all endpoints for the selected period"} arrow placement="top">
                <Box sx={{ display: "flex", cursor: "help" }}><Info size={14} color={palette.text.disabled} /></Box>
              </MuiTooltip>
            </Stack>
            <ResponsiveContainer width="100%" height={260} style={{ outline: "none" }}>
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.border.light} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: palette.text.tertiary }}
                  tickLine={false}
                  axisLine={{ stroke: palette.border.light }}
                  tickFormatter={(v) => {
                    if (period === "1d") return v;
                    const d = new Date(v + "T00:00:00");
                    return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: palette.text.tertiary }}
                  tickLine={false}
                  axisLine={{ stroke: palette.border.light }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 4, border: `1px solid ${palette.border.light}` }}
                  formatter={(value: number) => [`$${value.toFixed(6)}`, "Cost"]}
                />
                <Bar dataKey="total_cost" fill={chartPalette[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
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
                <Stack direction="row" alignItems="center" gap="6px">
                  <Typography sx={sectionTitleSx}>Cost by model</Typography>
                  <MuiTooltip title="Spend breakdown by LLM model — helps identify which models consume the most budget" arrow placement="top">
                    <Box sx={{ display: "flex", cursor: "help" }}><Info size={14} color={palette.text.disabled} /></Box>
                  </MuiTooltip>
                </Stack>
                <Stack gap="6px" sx={{ maxHeight: 270, overflowY: "auto" }}>
                  {(() => {
                    const maxCost = Math.max(...byModel.map((m: any) => Number(m.total_cost)), 0.000001);
                    return byModel.map((m: any, i: number) => {
                      const pct = (Number(m.total_cost) / maxCost) * 100;
                      return (
                    <Stack
                      key={m.group_key}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: "10px 14px",
                        borderRadius: "4px",
                        border: `1px solid ${palette.border.light}`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: `${pct}%`,
                        backgroundColor: palette.border.light,
                        opacity: 0.4,
                        transition: "width 0.3s",
                      }} />
                      <Stack direction="row" alignItems="center" gap="8px" sx={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
                        <Box
                          sx={{
                            width: 8, height: 8,
                            borderRadius: "50%",
                            backgroundColor: chartPalette[i % chartPalette.length],
                            flexShrink: 0,
                          }}
                        />
                        <Typography sx={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.group_key}
                        </Typography>
                      </Stack>
                      <Stack direction="row" gap="12px" alignItems="center" sx={{ flexShrink: 0, position: "relative", zIndex: 1 }}>
                        <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
                          {Number(m.total_requests).toLocaleString()} req
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
                          {Number(m.total_tokens).toLocaleString()} tok
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, minWidth: 70, textAlign: "right" }}>
                          ${Number(m.total_cost).toFixed(4)}
                        </Typography>
                      </Stack>
                    </Stack>
                      );
                    });
                  })()}
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Cost by endpoint */}
          {byEndpoint.length > 0 && (
            <Box sx={{ ...cardSx, flex: 1 }}>
              <Stack gap="12px">
                <Stack direction="row" alignItems="center" gap="6px">
                  <Typography sx={sectionTitleSx}>Cost by endpoint</Typography>
                  <MuiTooltip title="Spend and request volume per configured endpoint" arrow placement="top">
                    <Box sx={{ display: "flex", cursor: "help" }}><Info size={14} color={palette.text.disabled} /></Box>
                  </MuiTooltip>
                </Stack>
                <Stack gap="6px" sx={{ maxHeight: 270, overflowY: "auto" }}>
                  {(() => {
                    const maxCost = Math.max(...byEndpoint.map((ep: any) => Number(ep.total_cost)), 0.000001);
                    return byEndpoint.map((ep: any, i: number) => {
                      const pct = (Number(ep.total_cost) / maxCost) * 100;
                      return (
                    <Stack
                      key={ep.group_key}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: "10px 14px",
                        borderRadius: "4px",
                        border: `1px solid ${palette.border.light}`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: `${pct}%`,
                        backgroundColor: palette.border.light,
                        opacity: 0.4,
                        transition: "width 0.3s",
                      }} />
                      <Stack direction="row" alignItems="center" gap="8px" sx={{ position: "relative", zIndex: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: chartPalette[i % chartPalette.length], flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 12 }}>{ep.group_key}</Typography>
                      </Stack>
                      <Stack direction="row" gap="12px" alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
                        <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
                          {Number(ep.total_requests).toLocaleString()} req
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, minWidth: 70, textAlign: "right" }}>
                          ${Number(ep.total_cost).toFixed(4)}
                        </Typography>
                      </Stack>
                    </Stack>
                      );
                    });
                  })()}
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
            <Stack direction="row" alignItems="center" gap="6px">
              <Typography sx={sectionTitleSx}>Top users</Typography>
              <MuiTooltip title="Users ranked by total spend — shows request count, token usage, and cost" arrow placement="top">
                <Box sx={{ display: "flex", cursor: "help" }}><Info size={14} color={palette.text.disabled} /></Box>
              </MuiTooltip>
            </Stack>
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
      {/* Guardrails activity */}
      {guardrailStats && (Number(guardrailStats.summary?.total_checks) > 0 || guardrailStats.byDay?.length > 0) && (
        <Box sx={cardSx}>
          <Stack gap="12px">
            <Stack direction="row" alignItems="center" gap="6px">
              <Typography sx={sectionTitleSx}>Guardrails activity</Typography>
              <MuiTooltip title="Guardrail detections for this period — blocked requests were rejected, masked requests had content redacted" arrow placement="top">
                <Box sx={{ display: "flex", cursor: "help" }}><Info size={14} color={palette.text.disabled} /></Box>
              </MuiTooltip>
            </Stack>
            <Stack direction="row" gap="16px">
              <StatCard
                title="Blocked"
                value={String(guardrailStats.summary?.blocked_count ?? 0)}
                Icon={ShieldOff}
                highlight={Number(guardrailStats.summary?.blocked_count) > 0}
                tooltip="Requests blocked by guardrail rules in this period"
              />
              <StatCard
                title="Masked"
                value={String(guardrailStats.summary?.masked_count ?? 0)}
                Icon={ShieldCheck}
                tooltip="Requests with content masked before reaching the LLM"
              />
            </Stack>
            {guardrailStats.byType?.length > 0 && (
              <Stack gap="8px">
                {guardrailStats.byType.map((t: any, i: number) => (
                  <Stack
                    key={`${t.guardrail_type}-${t.action_taken}`}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      p: "8px 12px",
                      borderRadius: "4px",
                      border: `1px solid ${palette.border.light}`,
                    }}
                  >
                    <Typography sx={{ fontSize: 13 }}>
                      {t.guardrail_type === "pii" ? "PII detection" : "Content filter"} — {t.action_taken}
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      {Number(t.count).toLocaleString()}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </Box>
      )}
    </PageHeaderExtended>
  );
}
