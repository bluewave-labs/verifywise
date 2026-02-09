/**
 * Shadow AI Insights Page
 *
 * Dashboard showing summary metrics, tool risk rankings,
 * department breakdown pie chart, and top tool charts.
 */

import { useState, useEffect } from "react";
import {
  Stack,
  Box,
  Typography,
  Paper,
  Skeleton,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  AppWindow,
  Users,
  AlertTriangle,
  Building2,
} from "lucide-react";
import {
  getInsightsSummary,
  getToolsByEvents,
  getToolsByUsers,
  getUsersByDepartment,
  getTools,
} from "../../../application/repository/shadowAi.repository";
import {
  ShadowAiInsightsSummary,
  ShadowAiToolByEvents,
  ShadowAiToolByUsers,
  ShadowAiUsersByDepartment,
  IShadowAiTool,
} from "../../../domain/interfaces/i.shadowAi";
import EmptyState from "../../components/EmptyState";
import Select from "../../components/Inputs/Select";
import { CustomizableButton } from "../../components/button/customizable-button";
import { useNavigate } from "react-router-dom";

const PERIOD_OPTIONS = [
  { _id: "7d", name: "Last 7 days" },
  { _id: "30d", name: "Last 30 days" },
  { _id: "90d", name: "Last 90 days" },
];

const DEPT_COLORS = [
  "#6366F1", // indigo
  "#F59E0B", // amber
  "#10B981", // emerald
  "#EF4444", // red
  "#8B5CF6", // purple
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#84CC16", // lime
];

export default function InsightsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ShadowAiInsightsSummary | null>(null);
  const [toolsByEvents, setToolsByEvents] = useState<ShadowAiToolByEvents[]>([]);
  const [toolsByUsers, setToolsByUsers] = useState<ShadowAiToolByUsers[]>([]);
  const [departments, setDepartments] = useState<ShadowAiUsersByDepartment[]>([]);
  const [topRiskTools, setTopRiskTools] = useState<IShadowAiTool[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryData, eventsData, usersData, deptData, toolsData] =
          await Promise.all([
            getInsightsSummary(period),
            getToolsByEvents(period, 5),
            getToolsByUsers(period, 5),
            getUsersByDepartment(period),
            getTools({ sort_by: "risk_score", order: "desc", limit: 5 }),
          ]);
        if (cancelled) return;
        setSummary(summaryData);
        setToolsByEvents(eventsData);
        setToolsByUsers(usersData);
        setDepartments(deptData);
        setTopRiskTools(toolsData.tools);
      } catch (error) {
        console.error("Failed to load insights:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [period]);

  const handlePeriodChange = (e: SelectChangeEvent<string | number>) => {
    setPeriod(e.target.value as string);
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
      />
    );
  }

  return (
    <Stack gap={3}>
      {/* Period selector */}
      <Stack direction="row" justifyContent="flex-end">
        <Select
          id="insights-period-select"
          value={period}
          onChange={handlePeriodChange}
          items={PERIOD_OPTIONS}
          sx={{ width: 160 }}
        />
      </Stack>

      {/* Summary cards - top row */}
      <Stack direction="row" gap={2} flexWrap="wrap">
        <MetricCard
          icon={<AppWindow size={16} strokeWidth={1.5} />}
          label="Unique apps"
          value={summary?.unique_apps}
          loading={loading}
        />
        <MetricCard
          icon={<Users size={16} strokeWidth={1.5} />}
          label="AI users"
          value={summary?.total_ai_users}
          loading={loading}
        />
      </Stack>

      {/* Summary cards - second row */}
      <Stack direction="row" gap={2} flexWrap="wrap">
        <MetricCard
          icon={<AlertTriangle size={16} strokeWidth={1.5} />}
          label="Highest risk tool"
          value={summary?.highest_risk_tool?.name ?? "—"}
          subtitle={
            summary?.highest_risk_tool
              ? `Risk: ${summary.highest_risk_tool.risk_score}`
              : undefined
          }
          loading={loading}
        />
        <MetricCard
          icon={<Building2 size={16} strokeWidth={1.5} />}
          label="Most active department"
          value={summary?.most_active_department ?? "—"}
          loading={loading}
        />
      </Stack>

      {/* Main content: left = risk list + dept chart, right = bar charts */}
      <Stack direction={{ xs: "column", md: "row" }} gap={2}>
        {/* Left column */}
        <Stack gap={2} sx={{ flex: 1 }}>
          {/* Accessed tools with highest risk */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: "1px solid #d0d5dd",
              borderRadius: "4px",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", mb: 2 }}>
              Accessed tools with highest risk
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: "4px" }} />
            ) : topRiskTools.length > 0 ? (
              <Stack gap={1.5}>
                {topRiskTools.map((tool) => (
                  <Stack
                    key={tool.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <RiskScoreBadge score={tool.risk_score ?? 0} />
                      <Typography sx={{ fontSize: 13, color: "#374151" }}>
                        {tool.name}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                      {tool.total_events.toLocaleString()} events
                    </Typography>
                  </Stack>
                ))}
                <CustomizableButton
                  text="Go to AI tools"
                  variant="text"
                  sx={{
                    fontSize: 12,
                    color: "#6B7280",
                    alignSelf: "flex-start",
                    mt: 0.5,
                    p: 0,
                    minWidth: 0,
                    "&:hover": { color: "#374151", backgroundColor: "transparent" },
                  }}
                  onClick={() => navigate("/shadow-ai/tools")}
                />
              </Stack>
            ) : (
              <NoChartData />
            )}
          </Paper>

          {/* AI users by department - pie chart */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: "1px solid #d0d5dd",
              borderRadius: "4px",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", mb: 2 }}>
              AI users by department
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: "4px" }} />
            ) : departments.length > 0 ? (
              <Stack direction="row" alignItems="center" gap={3}>
                <Box sx={{ width: 200, height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departments}
                        dataKey="user_count"
                        nameKey="department"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={0}
                      >
                        {departments.map((_dept, index) => (
                          <Cell
                            key={index}
                            fill={DEPT_COLORS[index % DEPT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 4 }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack gap={1}>
                  {departments.map((dept, index) => (
                    <Stack key={dept.department} direction="row" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: DEPT_COLORS[index % DEPT_COLORS.length],
                          flexShrink: 0,
                        }}
                      />
                      <Typography sx={{ fontSize: 12, color: "#374151" }}>
                        {dept.department}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            ) : (
              <NoChartData />
            )}
          </Paper>
        </Stack>

        {/* Right column - bar charts */}
        <Stack gap={2} sx={{ flex: 1 }}>
          {/* Most accessed tools by events */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: "1px solid #d0d5dd",
              borderRadius: "4px",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", mb: 2 }}>
              Most accessed tools by events
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: "4px" }} />
            ) : toolsByEvents.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
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
                    <Bar dataKey="event_count" fill="#6366F1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <CustomizableButton
                  text="Go to AI tools"
                  variant="text"
                  sx={{
                    fontSize: 12,
                    color: "#6B7280",
                    alignSelf: "flex-start",
                    mt: 1,
                    p: 0,
                    minWidth: 0,
                    "&:hover": { color: "#374151", backgroundColor: "transparent" },
                  }}
                  onClick={() => navigate("/shadow-ai/tools")}
                />
              </>
            ) : (
              <NoChartData />
            )}
          </Paper>

          {/* Most accessed tools by users */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: "1px solid #d0d5dd",
              borderRadius: "4px",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", mb: 2 }}>
              Most accessed tools by users
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: "4px" }} />
            ) : toolsByUsers.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
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
                  <Bar dataKey="user_count" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoChartData />
            )}
          </Paper>
        </Stack>
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

function RiskScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "#DC2626"
      : score >= 40
        ? "#F59E0B"
        : "#10B981";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: "50%",
        backgroundColor: `${color}14`,
        border: `1px solid ${color}33`,
        flexShrink: 0,
      }}
    >
      <Typography sx={{ fontSize: 11, fontWeight: 600, color }}>
        {score}
      </Typography>
    </Box>
  );
}

function NoChartData() {
  return (
    <Box
      sx={{
        height: 200,
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
