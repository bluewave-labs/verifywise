/**
 * Shadow AI Insights Page
 *
 * Dashboard showing summary metrics, tool usage charts,
 * department breakdown, and trend over time.
 */

import { useState, useEffect } from "react";
import {
  Stack,
  Box,
  Typography,
  Paper,
  Skeleton,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  AppWindow,
  Users,
  AlertTriangle,
  Building2,
  TrendingUp,
} from "lucide-react";
import {
  getInsightsSummary,
  getToolsByEvents,
  getToolsByUsers,
  getUsersByDepartment,
  getTrend,
} from "../../../application/repository/shadowAi.repository";
import {
  ShadowAiInsightsSummary,
  ShadowAiToolByEvents,
  ShadowAiToolByUsers,
  ShadowAiUsersByDepartment,
  ShadowAiTrendPoint,
} from "../../../domain/interfaces/i.shadowAi";
import EmptyState from "../../components/EmptyState";

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export default function InsightsPage() {
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ShadowAiInsightsSummary | null>(null);
  const [toolsByEvents, setToolsByEvents] = useState<ShadowAiToolByEvents[]>([]);
  const [toolsByUsers, setToolsByUsers] = useState<ShadowAiToolByUsers[]>([]);
  const [departments, setDepartments] = useState<ShadowAiUsersByDepartment[]>([]);
  const [trend, setTrend] = useState<ShadowAiTrendPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryData, eventsData, usersData, deptData, trendData] =
          await Promise.all([
            getInsightsSummary(period),
            getToolsByEvents(period, 10),
            getToolsByUsers(period, 10),
            getUsersByDepartment(period),
            getTrend(period, "daily"),
          ]);
        if (cancelled) return;
        setSummary(summaryData);
        setToolsByEvents(eventsData);
        setToolsByUsers(usersData);
        setDepartments(deptData);
        setTrend(trendData);
      } catch (error) {
        console.error("Failed to load insights:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [period]);

  const handlePeriodChange = (e: SelectChangeEvent) => {
    setPeriod(e.target.value);
  };

  const hasData = summary && (
    summary.unique_apps > 0 ||
    summary.total_ai_users > 0
  );

  if (!loading && !hasData) {
    return (
      <EmptyState
        message="No Shadow AI activity detected yet. Connect a data source to start monitoring AI tool usage."
        showBorder
        showHalo
      />
    );
  }

  return (
    <Stack gap={3}>
      {/* Period selector */}
      <Stack direction="row" justifyContent="flex-end">
        <Select
          value={period}
          onChange={handlePeriodChange}
          size="small"
          sx={{ minWidth: 150, fontSize: 13, height: 34 }}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {/* Summary cards */}
      <Stack direction="row" gap={2} flexWrap="wrap">
        <MetricCard
          icon={<AppWindow size={16} strokeWidth={1.5} />}
          label="AI tools detected"
          value={summary?.unique_apps}
          loading={loading}
        />
        <MetricCard
          icon={<Users size={16} strokeWidth={1.5} />}
          label="Active users"
          value={summary?.total_ai_users}
          loading={loading}
        />
        <MetricCard
          icon={<AlertTriangle size={16} strokeWidth={1.5} />}
          label="Highest risk tool"
          value={summary?.highest_risk_tool?.name ?? "—"}
          subtitle={
            summary?.highest_risk_tool
              ? `Risk score: ${summary.highest_risk_tool.risk_score}`
              : undefined
          }
          loading={loading}
        />
        <MetricCard
          icon={<Building2 size={16} strokeWidth={1.5} />}
          label="Departments using AI"
          value={summary?.departments_using_ai}
          loading={loading}
        />
      </Stack>

      {/* Charts row */}
      <Stack direction={{ xs: "column", md: "row" }} gap={2}>
        {/* Tools by events */}
        <ChartCard title="Top tools by activity" flex={1} loading={loading}>
          {toolsByEvents.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={toolsByEvents}
                layout="vertical"
                margin={{ left: 80, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="tool_name"
                  tick={{ fontSize: 12 }}
                  width={75}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 4 }}
                  formatter={(value: number) => [value, "Events"]}
                />
                <Bar dataKey="event_count" fill="#13715B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoChartData />
          )}
        </ChartCard>

        {/* Tools by users */}
        <ChartCard title="Top tools by users" flex={1} loading={loading}>
          {toolsByUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={toolsByUsers}
                layout="vertical"
                margin={{ left: 80, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="tool_name"
                  tick={{ fontSize: 12 }}
                  width={75}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 4 }}
                  formatter={(value: number) => [value, "Users"]}
                />
                <Bar dataKey="user_count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoChartData />
          )}
        </ChartCard>
      </Stack>

      {/* Trend + Departments row */}
      <Stack direction={{ xs: "column", md: "row" }} gap={2}>
        {/* Trend chart */}
        <ChartCard title="Activity trend" flex={2} loading={loading}>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trend} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d: string) => {
                    const date = new Date(d);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 4 }}
                  labelFormatter={(d: string) => new Date(d).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="total_events"
                  stroke="#13715B"
                  strokeWidth={2}
                  dot={false}
                  name="Events"
                />
                <Line
                  type="monotone"
                  dataKey="unique_users"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <NoChartData />
          )}
        </ChartCard>

        {/* Department breakdown */}
        <ChartCard title="Users by department" flex={1} loading={loading}>
          {departments.length > 0 ? (
            <Stack gap={1.5} sx={{ pt: 1 }}>
              {departments.map((dept) => (
                <Stack key={dept.department} gap={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12, color: "#374151" }}>
                      {dept.department}
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                      {dept.user_count}
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#F3F4F6",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${Math.min(
                          100,
                          (dept.user_count /
                            Math.max(
                              ...departments.map((d) => d.user_count),
                              1
                            )) *
                            100
                        )}%`,
                        backgroundColor: "#13715B",
                        borderRadius: 3,
                      }}
                    />
                  </Box>
                </Stack>
              ))}
            </Stack>
          ) : (
            <NoChartData />
          )}
        </ChartCard>
      </Stack>
    </Stack>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
  subtitle?: string;
  loading: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 180,
        p: 2,
        border: "1px solid #d0d5dd",
        borderRadius: "4px",
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <Box sx={{ color: "#6B7280" }}>{icon}</Box>
        <Typography sx={{ fontSize: 12, color: "#6B7280" }}>{label}</Typography>
      </Stack>
      {loading ? (
        <Skeleton width={60} height={32} />
      ) : (
        <>
          <Typography sx={{ fontSize: 24, fontWeight: 600, color: "#111827" }}>
            {value ?? 0}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: 11, color: "#9CA3AF", mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
}

function ChartCard({
  title,
  children,
  flex,
  loading,
}: {
  title: string;
  children: React.ReactNode;
  flex?: number;
  loading: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex,
        p: 2,
        border: "1px solid #d0d5dd",
        borderRadius: "4px",
        minWidth: 0,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
        <TrendingUp size={14} strokeWidth={1.5} color="#6B7280" />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
          {title}
        </Typography>
      </Stack>
      {loading ? (
        <Skeleton variant="rectangular" height={250} sx={{ borderRadius: "4px" }} />
      ) : (
        children
      )}
    </Paper>
  );
}

function NoChartData() {
  return (
    <Box
      sx={{
        height: 250,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
        No data available for this period
      </Typography>
    </Box>
  );
}
