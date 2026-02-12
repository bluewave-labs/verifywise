import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { useDashboardSummary, useDashboardTrends } from "../../../application/hooks/useShadowAi";

const RISK_COLORS: Record<string, string> = {
  critical: "#d32f2f",
  high: "#f57c00",
  medium: "#fbc02d",
  low: "#388e3c",
  info: "#1976d2",
};

const SEVERITY_COLORS: Record<string, "error" | "warning" | "info" | "success" | "default"> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
};

const Dashboard: React.FC = () => {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const [trendDays, setTrendDays] = useState(30);
  const { data: trends, isLoading: trendsLoading } = useDashboardTrends(trendDays);

  if (summaryLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const riskPieData = (summary?.risk_distribution || []).map((item: any, idx: number) => ({
    id: idx,
    value: Number(item.count),
    label: item.risk_level?.charAt(0).toUpperCase() + item.risk_level?.slice(1),
    color: RISK_COLORS[item.risk_level] || "#9e9e9e",
  }));

  const trendDates = (trends?.trends || []).map((t: any) => t.date?.split("T")[0] || t.date);
  const trendEvents = (trends?.trends || []).map((t: any) => Number(t.event_count));
  const trendUsers = (trends?.trends || []).map((t: any) => Number(t.user_count));

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "AI Tools Discovered", value: summary?.total_tools || 0, color: "#1976d2" },
          { label: "Total Events", value: summary?.total_events || 0, color: "#7b1fa2" },
          { label: "Active Users", value: summary?.active_users || 0, color: "#0288d1" },
          { label: "Open Violations", value: summary?.open_violations || 0, color: "#d32f2f" },
        ].map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mb: 0.5 }}>
                  {card.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: card.color, fontSize: 28 }}>
                  {card.value.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Risk Distribution */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: 320 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Risk Distribution
              </Typography>
              {riskPieData.length > 0 ? (
                <PieChart
                  series={[{
                    data: riskPieData,
                    innerRadius: 40,
                    outerRadius: 90,
                    paddingAngle: 2,
                    cx: 110,
                  }]}
                  width={320}
                  height={240}
                  slotProps={{ legend: { direction: "column", position: { vertical: "middle", horizontal: "right" } } }}
                />
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "text.secondary" }}>
                  No event data yet
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Trends */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ height: 320 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Usage Trends
                </Typography>
                <ToggleButtonGroup
                  value={trendDays}
                  exclusive
                  onChange={(_, v) => v && setTrendDays(v)}
                  size="small"
                  sx={{ "& .MuiToggleButton-root": { fontSize: 11, px: 1.5, py: 0.25 } }}
                >
                  <ToggleButton value={7}>7d</ToggleButton>
                  <ToggleButton value={30}>30d</ToggleButton>
                  <ToggleButton value={90}>90d</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {trendDates.length > 0 ? (
                <LineChart
                  xAxis={[{ scaleType: "point", data: trendDates }]}
                  series={[
                    { data: trendEvents, label: "Events", color: "#1976d2" },
                    { data: trendUsers, label: "Users", color: "#7b1fa2" },
                  ]}
                  height={230}
                  margin={{ top: 20, bottom: 30, left: 40, right: 20 }}
                  slotProps={{ legend: { direction: "row", position: { vertical: "top", horizontal: "right" } } }}
                />
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "text.secondary" }}>
                  {trendsLoading ? <CircularProgress size={24} /> : "No trend data yet"}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Top AI Tools */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Top AI Tools
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Tool</TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600 }}>Events</TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600 }}>Users</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(summary?.top_tools || []).map((tool: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: 13 }}>{tool.ai_tool_name}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>{Number(tool.event_count).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>{Number(tool.user_count).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {(!summary?.top_tools || summary.top_tools.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ textAlign: "center", color: "text.secondary", fontSize: 13 }}>
                          No tools discovered yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Violations */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Recent Violations
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Severity</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Policy</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>User</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(summary?.recent_violations || []).map((v: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Chip
                            label={v.severity}
                            size="small"
                            color={SEVERITY_COLORS[v.severity] || "default"}
                            sx={{ fontSize: 11, height: 22 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{v.policy_name || "-"}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{v.user_identifier || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {(!summary?.recent_violations || summary.recent_violations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ textAlign: "center", color: "text.secondary", fontSize: 13 }}>
                          No violations
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
