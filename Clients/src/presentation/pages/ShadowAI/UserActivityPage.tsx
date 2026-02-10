/**
 * Shadow AI User Activity Page
 *
 * Shows user-level activity, department breakdown, and user detail view.
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Stack,
  Typography,
  Paper,
  Skeleton,
  SelectChangeEvent,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Box,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import { ArrowLeft, Mail, Building2 } from "lucide-react";
import TabBar from "../../components/TabBar";
import Select from "../../components/Inputs/Select";
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
import PageHeader from "../../components/Layout/PageHeader";
import HelperIcon from "../../components/HelperIcon";

const PERIOD_OPTIONS = [
  { _id: "7d", name: "Last 7 days" },
  { _id: "30d", name: "Last 30 days" },
  { _id: "90d", name: "Last 90 days" },
];

interface UserDetailData {
  email: string;
  department: string;
  tools: { tool_name: string; event_count: number; last_used: string }[];
  total_prompts: number;
}

type ViewMode = "users" | "departments";

const TABS = [
  { label: "Users", value: "users", icon: "Users" as const },
  { label: "Departments", value: "departments", icon: "Building2" as const },
];

export default function UserActivityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30d");

  const viewMode: ViewMode = location.pathname.includes("/user-activity/departments")
    ? "departments"
    : "users";
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ShadowAiUserActivity[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState<ShadowAiDepartmentActivity[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null);
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
    setSelectedEmail(null);
    setUserDetail(null);
    navigate("/shadow-ai/user-activity/users");
  };

  const handlePeriodChange = (e: SelectChangeEvent<string | number>) => {
    setPeriod(e.target.value as string);
    setPage(1);
  };

  // ─── Detail view ───
  if (selectedEmail) {
    return (
      <Stack gap="16px">
        <Stack direction="row" alignItems="center" gap="8px">
          <IconButton onClick={handleBack} size="small">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </IconButton>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
            User activity
          </Typography>
        </Stack>

        {detailLoading ? (
          <Stack gap="16px">
            <Skeleton height={80} />
            <Skeleton height={200} />
          </Stack>
        ) : userDetail ? (
          <Stack gap="16px">
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid #d0d5dd", borderRadius: "4px" }}
            >
              <Stack direction="row" gap="24px" flexWrap="wrap">
                <Stack direction="row" alignItems="center" gap="8px">
                  <Mail size={14} strokeWidth={1.5} color="#6B7280" />
                  <Typography sx={{ fontSize: 13 }}>{userDetail.email}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap="8px">
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
                      <TableRow>
                        {["Tool", "Events", "Last used"].map((h) => (
                          <TableCell key={h} sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userDetail.tools.map(
                        (t) => (
                          <TableRow key={t.tool_name}>
                            <TableCell sx={{ fontSize: 13 }}>{t.tool_name}</TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{t.event_count}</TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{new Date(t.last_used).toLocaleDateString()}</TableCell>
                          </TableRow>
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

  const handleTabChange = (_e: React.SyntheticEvent, newValue: string) => {
    if (newValue === "departments") {
      navigate("/shadow-ai/user-activity/departments");
    } else {
      navigate("/shadow-ai/user-activity/users");
    }
  };

  return (
    <TabContext value={viewMode}>
    <Stack gap="16px">
      <PageHeader
        title="User activity"
        description="Monitor individual user and department-level AI tool usage across your organization. Track prompts, identify high-risk users, and review activity by department."
        rightContent={
          <HelperIcon articlePath="shadow-ai/user-activity" size="small" />
        }
      />

      {/* Controls */}
      <Stack sx={{ position: "relative" }}>
        <TabBar
          tabs={TABS}
          activeTab={viewMode}
          onChange={handleTabChange}
        />
        <Box sx={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}>
          <Select
            id="period-select"
            value={period}
            onChange={handlePeriodChange}
            items={PERIOD_OPTIONS}
            sx={{ width: 160 }}
          />
        </Box>
      </Stack>

      {/* Content */}
      {loading ? (
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: "4px" }} />
      ) : !hasData ? (
        <EmptyState
          message="No user activity detected yet."
          showBorder
        />
      ) : viewMode === "users" ? (
        <Paper
          elevation={0}
          sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", overflow: "hidden" }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["User", "Department", "Total prompts", "Risk score"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_email} hover sx={{ cursor: "pointer" }}>
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
                    <TableCell><Typography sx={{ fontSize: 13 }}>{u.risk_score ?? 0}</Typography></TableCell>
                  </TableRow>
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
                <TableRow>
                  {["Department", "Users", "Total prompts", "Top tool", "Risk score"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.department}>
                    <TableCell sx={{ fontSize: 13 }}>{d.department}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{d.users}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{d.total_prompts}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{d.top_tool || "—"}</TableCell>
                    <TableCell><Typography sx={{ fontSize: 13 }}>{d.risk_score ?? 0}</Typography></TableCell>
                  </TableRow>
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

