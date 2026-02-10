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
import Select from "../../components/Inputs/Select";
import { DashboardHeaderCard } from "../../components/Cards/DashboardHeaderCard";
import { DashboardCard } from "../../components/Cards/DashboardCard";
import VWLink from "../../components/Link/VWLink";
import PageHeader from "../../components/Layout/PageHeader";
import HelperIcon from "../../components/HelperIcon";
import { useNavigate } from "react-router-dom";
import { PERIOD_OPTIONS } from "./constants";

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
            getToolsByEvents(period, 6),
            getToolsByUsers(period, 6),
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

  return (
    <Stack gap="24px">
      <PageHeader
        title="Insights"
        description="Overview of Shadow AI activity across your organization. See summary metrics, top tools by usage, risk rankings, and department breakdown at a glance."
        rightContent={
          <HelperIcon articlePath="shadow-ai/insights" size="small" />
        }
      />

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

      {/* Summary header cards */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          "& > *": {
            flex: "1 1 0",
            minWidth: "150px",
            padding: "16px !important",
          },
        }}
      >
        <DashboardHeaderCard
          title="Unique apps"
          count={loading ? <Skeleton width={40} /> : (summary?.unique_apps ?? 0)}
          icon={<AppWindow size={16} strokeWidth={1.5} />}
          disableNavigation
        />
        <DashboardHeaderCard
          title="AI users"
          count={loading ? <Skeleton width={40} /> : (summary?.total_ai_users ?? 0)}
          icon={<Users size={16} strokeWidth={1.5} />}
          disableNavigation
        />
        <DashboardHeaderCard
          title="Highest risk tool"
          count={loading ? <Skeleton width={80} /> : (summary?.highest_risk_tool?.name ?? "—")}
          icon={<AlertTriangle size={16} strokeWidth={1.5} />}
          disableNavigation
        />
        <DashboardHeaderCard
          title="Most active department"
          count={loading ? <Skeleton width={80} /> : (summary?.most_active_department ?? "—")}
          icon={<Building2 size={16} strokeWidth={1.5} />}
          disableNavigation
        />
      </Box>

      {/* Main content: left = risk list + dept chart, right = bar charts */}
      <Stack direction={{ xs: "column", md: "row" }} gap="16px">
        {/* Left column */}
        <Stack gap="16px" sx={{ flex: 1 }}>
          {/* Accessed tools with highest risk */}
          <DashboardCard title="Accessed tools with highest risk">
            {loading ? (
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: "4px" }} />
            ) : topRiskTools.length > 0 ? (
              <Stack gap="12px">
                {topRiskTools.map((tool) => (
                  <Stack
                    key={tool.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" alignItems="center" gap="12px">
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                        {tool.risk_score ?? 0}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: "#374151" }}>
                        {tool.name}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                      {tool.total_events.toLocaleString()} events
                    </Typography>
                  </Stack>
                ))}
                <VWLink
                  onClick={() => navigate("/shadow-ai/tools")}
                  showIcon={false}
                  sx={{ fontSize: 12, mt: 0.5, alignSelf: "flex-end" }}
                >
                  Go to AI tools
                </VWLink>
              </Stack>
            ) : (
              <NoChartData />
            )}
          </DashboardCard>

          {/* AI users by department - pie chart */}
          <DashboardCard title="AI users by department">
            {loading ? (
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: "4px" }} />
            ) : departments.length > 0 ? (
              <Stack direction="row" alignItems="center" justifyContent="center" gap="24px">
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
                <Stack gap="8px">
                  {departments.map((dept, index) => (
                    <Stack key={dept.department} direction="row" alignItems="center" gap="8px">
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
          </DashboardCard>
        </Stack>

        {/* Right column - bar charts */}
        <Stack gap="16px" sx={{ flex: 1 }}>
          {/* Most accessed tools by events */}
          <DashboardCard title="Most accessed tools by events">
            {loading ? (
              <Skeleton variant="rectangular" height={260} sx={{ borderRadius: "4px" }} />
            ) : toolsByEvents.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={toolsByEvents}
                    layout="vertical"
                    margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#9CA3AF" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="tool_name"
                      tick={{ fontSize: 12, fill: "#374151" }}
                      width={90}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                      formatter={(value: number) => [value.toLocaleString(), "Events"]}
                      cursor={{ fill: "rgba(19, 113, 91, 0.04)" }}
                    />
                    <Bar
                      dataKey="event_count"
                      fill="#13715B"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <VWLink
                  onClick={() => navigate("/shadow-ai/tools")}
                  showIcon={false}
                  sx={{ fontSize: 12, mt: 1, alignSelf: "flex-end" }}
                >
                  Go to AI tools
                </VWLink>
              </>
            ) : (
              <NoChartData />
            )}
          </DashboardCard>

          {/* Most accessed tools by users */}
          <DashboardCard title="Most accessed tools by users">
            {loading ? (
              <Skeleton variant="rectangular" height={260} sx={{ borderRadius: "4px" }} />
            ) : toolsByUsers.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={toolsByUsers}
                  layout="vertical"
                  margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="tool_name"
                    tick={{ fontSize: 12, fill: "#374151" }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 6,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value: number) => [value.toLocaleString(), "Users"]}
                    cursor={{ fill: "rgba(19, 113, 91, 0.04)" }}
                  />
                  <Bar
                    dataKey="user_count"
                    fill="#13715B"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoChartData />
            )}
          </DashboardCard>
        </Stack>
      </Stack>
    </Stack>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

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
