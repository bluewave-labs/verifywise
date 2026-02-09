/**
 * Shadow AI User Activity Page
 *
 * Shows user-level activity, department breakdown, and user detail view.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Stack,
  Box,
  Typography,
  Paper,
  Skeleton,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow as MuiTableRow,
  TableCell,
  TableContainer,
  TablePagination,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import { ArrowLeft, Mail, Building2 } from "lucide-react";
import TabBar from "../../components/TabBar";
import {
  getUsers,
  getUserDetail,
  getDepartmentActivity,
  GetUsersParams,
} from "../../../application/repository/shadowAi.repository";
import {
  ShadowAiUserActivity,
  ShadowAiDepartmentActivity,
} from "../../../domain/interfaces/i.shadowAi";
import EmptyState from "../../components/EmptyState";

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

type ViewMode = "users" | "departments" | "detail";

export default function UserActivityPage() {
  const [period, setPeriod] = useState("30d");
  const [viewMode, setViewMode] = useState<ViewMode>("users");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ShadowAiUserActivity[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState<ShadowAiDepartmentActivity[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: GetUsersParams = {
        page,
        limit: 20,
        period,
        sort_by: "total_prompts",
        order: "desc",
      };
      const result = await getUsers(params);
      setUsers(result.users);
      setTotalUsers(result.total);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, period]);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDepartmentActivity(period);
      setDepartments(result);
    } catch (error) {
      console.error("Failed to load departments:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (viewMode === "users") {
      fetchUsers();
    } else if (viewMode === "departments") {
      fetchDepartments();
    }
  }, [viewMode, fetchUsers, fetchDepartments]);

  const handleUserClick = async (email: string) => {
    setSelectedEmail(email);
    setViewMode("detail");
    setDetailLoading(true);
    try {
      const detail = await getUserDetail(email, period);
      setUserDetail(detail);
    } catch (error) {
      console.error("Failed to load user detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBack = () => {
    setViewMode("users");
    setSelectedEmail(null);
    setUserDetail(null);
  };

  const handlePeriodChange = (e: SelectChangeEvent) => {
    setPeriod(e.target.value);
    setPage(1);
  };

  // ─── Detail view ───
  if (viewMode === "detail") {
    return (
      <Stack gap={2}>
        <Stack direction="row" alignItems="center" gap={1}>
          <IconButton onClick={handleBack} size="small">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </IconButton>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
            User activity
          </Typography>
        </Stack>

        {detailLoading ? (
          <Stack gap={2}>
            <Skeleton height={80} />
            <Skeleton height={200} />
          </Stack>
        ) : userDetail ? (
          <Stack gap={2}>
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid #d0d5dd", borderRadius: "4px" }}
            >
              <Stack direction="row" gap={3} flexWrap="wrap">
                <Stack direction="row" alignItems="center" gap={1}>
                  <Mail size={14} strokeWidth={1.5} color="#6B7280" />
                  <Typography sx={{ fontSize: 13 }}>{userDetail.email}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Building2 size={14} strokeWidth={1.5} color="#6B7280" />
                  <Typography sx={{ fontSize: 13 }}>
                    {userDetail.department || "Unknown"}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
                  Total prompts: {userDetail.total_prompts}
                </Typography>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid #d0d5dd", borderRadius: "4px" }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 2 }}>
                Tools used
              </Typography>
              {userDetail.tools?.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <MuiTableRow>
                        {["Tool", "Events", "Last used"].map((h) => (
                          <TableCell key={h} sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{h}</TableCell>
                        ))}
                      </MuiTableRow>
                    </TableHead>
                    <TableBody>
                      {userDetail.tools.map(
                        (t: { tool_name: string; event_count: number; last_used: string }) => (
                          <MuiTableRow key={t.tool_name}>
                            <TableCell sx={{ fontSize: 13 }}>{t.tool_name}</TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{t.event_count}</TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{new Date(t.last_used).toLocaleDateString()}</TableCell>
                          </MuiTableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
                  No tool usage recorded
                </Typography>
              )}
            </Paper>
          </Stack>
        ) : (
          <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
            User not found
          </Typography>
        )}
      </Stack>
    );
  }

  // ─── List views ───
  const hasData = viewMode === "users" ? users.length > 0 : departments.length > 0;

  const TABS = [
    { label: "Users", value: "users", icon: "Users" as const },
    { label: "Departments", value: "departments", icon: "Building2" as const },
  ];

  return (
    <TabContext value={viewMode === "detail" ? "users" : viewMode}>
    <Stack gap={2}>
      {/* Controls */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <TabBar
          tabs={TABS}
          activeTab={viewMode === "detail" ? "users" : viewMode}
          onChange={(_e, newValue) => setViewMode(newValue as ViewMode)}
        />
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

      {/* Content */}
      {loading ? (
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: "4px" }} />
      ) : !hasData ? (
        <EmptyState
          message="No user activity detected yet."
          showBorder
          showHalo
        />
      ) : viewMode === "users" ? (
        <Paper
          elevation={0}
          sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", overflow: "hidden" }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <MuiTableRow>
                  {["User", "Department", "Total prompts", "Risk score"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{h}</TableCell>
                  ))}
                </MuiTableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <MuiTableRow key={u.user_email} hover sx={{ cursor: "pointer" }}>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "#13715B",
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline" },
                        }}
                        onClick={() => handleUserClick(u.user_email)}
                      >
                        {u.user_email}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{u.department || "Unknown"}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{u.total_prompts}</TableCell>
                    <TableCell><RiskBadge score={u.risk_score} /></TableCell>
                  </MuiTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalUsers}
            page={page - 1}
            onPageChange={(_e, newPage) => setPage(newPage + 1)}
            rowsPerPage={20}
            rowsPerPageOptions={[20]}
            sx={{ fontSize: 12 }}
          />
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", overflow: "hidden" }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <MuiTableRow>
                  {["Department", "Users", "Total prompts", "Top tool", "Risk score"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{h}</TableCell>
                  ))}
                </MuiTableRow>
              </TableHead>
              <TableBody>
                {departments.map((d) => (
                  <MuiTableRow key={d.department}>
                    <TableCell sx={{ fontSize: 13 }}>{d.department}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{d.users}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{d.total_prompts}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{d.top_tool || "—"}</TableCell>
                    <TableCell><RiskBadge score={d.risk_score} /></TableCell>
                  </MuiTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Stack>
    </TabContext>
  );
}

function RiskBadge({ score }: { score: number }) {
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
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: "4px",
        backgroundColor: `${color}14`,
        border: `1px solid ${color}33`,
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <Typography sx={{ fontSize: 12, fontWeight: 500, color }}>
        {score}
      </Typography>
    </Box>
  );
}
