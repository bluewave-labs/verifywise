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
  TableFooter,
  Box,
  useTheme,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import { ArrowLeft, Mail, Building2 } from "lucide-react";
import TabBar from "../../components/TabBar";
import TablePaginationActions from "../../components/TablePagination";
import singleTheme from "../../themes/v1SingleTheme";
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
import { DashboardHeaderCard } from "../../components/Cards/DashboardHeaderCard";
import TipBox from "../../components/TipBox";
import { PERIOD_OPTIONS, SelectorVertical } from "./constants";

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

const DEPT_PER_PAGE = 10;

export default function UserActivityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [period, setPeriod] = useState("30d");

  const viewMode: ViewMode = location.pathname.includes("/user-activity/departments")
    ? "departments"
    : "users";
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ShadowAiUserActivity[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState<ShadowAiDepartmentActivity[]>([]);
  const [deptPage, setDeptPage] = useState(0);
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
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                "& > *": { flex: "1 1 0", minWidth: "150px" },
              }}
            >
              <DashboardHeaderCard
                title="Email"
                count={userDetail.email}
                icon={<Mail size={16} strokeWidth={1.5} />}
                disableNavigation
              />
              <DashboardHeaderCard
                title="Department"
                count={userDetail.department || "Unknown"}
                icon={<Building2 size={16} strokeWidth={1.5} />}
                disableNavigation
              />
              <DashboardHeaderCard
                title="Total prompts"
                count={userDetail.total_prompts}
                disableNavigation
              />
            </Box>

            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
              Tools used
            </Typography>
            {userDetail.tools?.length > 0 ? (
              <TableContainer sx={singleTheme.tableStyles.primary.frame}>
                <Table>
                  <TableHead>
                    <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                      {["Tool", "Events", "Last used"].map((h) => (
                        <TableCell key={h} sx={singleTheme.tableStyles.primary.header.cell}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userDetail.tools.map(
                      (t) => (
                        <TableRow key={t.tool_name} sx={singleTheme.tableStyles.primary.body.row}>
                          <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{t.tool_name}</TableCell>
                          <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{t.event_count}</TableCell>
                          <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{new Date(t.last_used).toLocaleDateString()}</TableCell>
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
      <TipBox entityName="shadow-ai-user-activity" />

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
        <TableContainer sx={singleTheme.tableStyles.primary.frame}>
          <Table>
            <TableHead>
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {["User", "Department", "Total prompts", "Risk score"].map((h) => (
                  <TableCell key={h} sx={singleTheme.tableStyles.primary.header.cell}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user_email} sx={{ ...singleTheme.tableStyles.primary.body.row, cursor: "pointer" }} onClick={() => handleUserClick(u.user_email)}>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: "#13715B",
                      }}
                    >
                      {u.user_email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{u.department || "Unknown"}</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{u.total_prompts}</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{u.risk_score ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow
                sx={{
                  "& .MuiTableCell-root.MuiTableCell-footer": {
                    paddingX: theme.spacing(8),
                    paddingY: theme.spacing(4),
                  },
                }}
              >
                <TableCell
                  sx={{
                    paddingX: theme.spacing(2),
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                >
                  Showing {(page - 1) * 20 + 1} -{" "}
                  {Math.min(page * 20, totalUsers)} of {totalUsers} users
                </TableCell>
                <TablePagination
                  count={totalUsers}
                  page={page - 1}
                  onPageChange={(_e, newPage) => setPage(newPage + 1)}
                  rowsPerPage={20}
                  rowsPerPageOptions={[20]}
                  ActionsComponent={(props) => (
                    <TablePaginationActions {...props} />
                  )}
                  labelRowsPerPage=""
                  labelDisplayedRows={({ page: p, count }) =>
                    `Page ${p + 1} of ${Math.max(0, Math.ceil(count / 20))}`
                  }
                  slotProps={{
                    select: {
                      MenuProps: {
                        keepMounted: true,
                        PaperProps: {
                          className: "pagination-dropdown",
                          sx: { mt: 0, mb: theme.spacing(2) },
                        },
                        transformOrigin: { vertical: "bottom", horizontal: "left" },
                        anchorOrigin: { vertical: "top", horizontal: "left" },
                        sx: { mt: theme.spacing(-2) },
                      },
                      inputProps: { id: "pagination-dropdown" },
                      IconComponent: SelectorVertical,
                      sx: {
                        ml: theme.spacing(4),
                        mr: theme.spacing(12),
                        minWidth: theme.spacing(20),
                        textAlign: "left",
                        "&.Mui-focused > div": {
                          backgroundColor: theme.palette.background.main,
                        },
                      },
                    },
                  }}
                  sx={{
                    mt: theme.spacing(6),
                    color: theme.palette.text.secondary,
                    "& .MuiSelect-icon": { width: "24px", height: "fit-content" },
                    "& .MuiSelect-select": {
                      width: theme.spacing(10),
                      borderRadius: theme.shape.borderRadius,
                      border: `1px solid ${theme.palette.border.light}`,
                      padding: theme.spacing(4),
                    },
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer sx={singleTheme.tableStyles.primary.frame}>
          <Table>
            <TableHead>
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {["Department", "Users", "Total prompts", "Top tool", "Risk score"].map((h) => (
                  <TableCell key={h} sx={singleTheme.tableStyles.primary.header.cell}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {departments
                .slice(deptPage * DEPT_PER_PAGE, (deptPage + 1) * DEPT_PER_PAGE)
                .map((d) => (
                <TableRow key={d.department} sx={{ ...singleTheme.tableStyles.primary.body.row, "&:hover": { cursor: "default" } }}>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{d.department}</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{d.users}</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{d.total_prompts}</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{d.top_tool || "—"}</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{d.risk_score ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow
                sx={{
                  "& .MuiTableCell-root.MuiTableCell-footer": {
                    paddingX: theme.spacing(8),
                    paddingY: theme.spacing(4),
                  },
                }}
              >
                <TableCell
                  sx={{
                    paddingX: theme.spacing(2),
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                >
                  Showing {deptPage * DEPT_PER_PAGE + 1} -{" "}
                  {Math.min((deptPage + 1) * DEPT_PER_PAGE, departments.length)} of{" "}
                  {departments.length} departments
                </TableCell>
                <TablePagination
                  count={departments.length}
                  page={deptPage}
                  onPageChange={(_e, newPage) => setDeptPage(newPage)}
                  rowsPerPage={DEPT_PER_PAGE}
                  rowsPerPageOptions={[DEPT_PER_PAGE]}
                  ActionsComponent={(props) => (
                    <TablePaginationActions {...props} />
                  )}
                  labelRowsPerPage=""
                  labelDisplayedRows={({ page: p, count }) =>
                    `Page ${p + 1} of ${Math.max(0, Math.ceil(count / DEPT_PER_PAGE))}`
                  }
                  slotProps={{
                    select: {
                      MenuProps: {
                        keepMounted: true,
                        PaperProps: {
                          className: "pagination-dropdown",
                          sx: { mt: 0, mb: theme.spacing(2) },
                        },
                        transformOrigin: { vertical: "bottom", horizontal: "left" },
                        anchorOrigin: { vertical: "top", horizontal: "left" },
                        sx: { mt: theme.spacing(-2) },
                      },
                      inputProps: { id: "pagination-dropdown" },
                      IconComponent: SelectorVertical,
                      sx: {
                        ml: theme.spacing(4),
                        mr: theme.spacing(12),
                        minWidth: theme.spacing(20),
                        textAlign: "left",
                        "&.Mui-focused > div": {
                          backgroundColor: theme.palette.background.main,
                        },
                      },
                    },
                  }}
                  sx={{
                    mt: theme.spacing(6),
                    color: theme.palette.text.secondary,
                    "& .MuiSelect-icon": { width: "24px", height: "fit-content" },
                    "& .MuiSelect-select": {
                      width: theme.spacing(10),
                      borderRadius: theme.shape.borderRadius,
                      border: `1px solid ${theme.palette.border.light}`,
                      padding: theme.spacing(4),
                    },
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </Stack>
    </TabContext>
  );
}

