import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyStateMessage from "../../EmptyStateMessage";
import Chip from "../../Chip";
import VWTooltip from "../../VWTooltip";
import { DASHBOARD_COLORS } from "../../../styles/colors";

interface UpcomingTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string;
}

interface UpcomingDeadlinesCardProps {
  tasks: UpcomingTask[];
}

// Helper to calculate days until due
const getDaysUntilDue = (dueDate: string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get countdown label and variant based on days until due
const getCountdownInfo = (daysUntilDue: number): { label: string; variant: "error" | "warning" | "info" | "default" } => {
  if (daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue);
    return {
      label: overdueDays === 1 ? "1 day overdue" : `${overdueDays}d overdue`,
      variant: "error",
    };
  }
  if (daysUntilDue === 0) {
    return { label: "Due today", variant: "warning" };
  }
  if (daysUntilDue === 1) {
    return { label: "Tomorrow", variant: "warning" };
  }
  if (daysUntilDue <= 7) {
    return { label: `${daysUntilDue}d left`, variant: "info" };
  }
  return { label: `${daysUntilDue}d left`, variant: "default" };
};

const UpcomingDeadlinesCard: React.FC<UpcomingDeadlinesCardProps> = ({ tasks }) => {
  const navigate = useNavigate();

  if (!tasks || tasks.length === 0) {
    return <EmptyStateMessage message="No upcoming deadlines" />;
  }

  // Count overdue tasks
  const overdueCount = tasks.filter((task) => getDaysUntilDue(task.due_date) < 0).length;

  return (
    <Stack spacing={0}>
      {/* Overdue alert if any */}
      {overdueCount > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            padding: "8px 12px",
            backgroundColor: DASHBOARD_COLORS.overdueBackground,
            borderRadius: "4px",
            marginBottom: "12px",
          }}
        >
          <AlertTriangle size={14} color={DASHBOARD_COLORS.overdue} />
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: DASHBOARD_COLORS.overdue }}>
            {overdueCount} {overdueCount === 1 ? "task" : "tasks"} overdue
          </Typography>
        </Box>
      )}

      {/* Task list */}
      {tasks.map((task, index) => {
        const daysUntilDue = getDaysUntilDue(task.due_date);
        const countdown = getCountdownInfo(daysUntilDue);
        const isLast = index === tasks.length - 1;

        return (
          <Box
            key={task.id}
            onClick={() => navigate(`/tasks?taskId=${task.id}`)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: isLast ? "none" : `1px solid ${DASHBOARD_COLORS.borderLight}`,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: DASHBOARD_COLORS.backgroundSubtle,
                marginX: "-12px",
                paddingX: "12px",
              },
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              {/* Icon based on urgency */}
              {daysUntilDue < 0 ? (
                <AlertTriangle size={14} color={DASHBOARD_COLORS.overdue} />
              ) : daysUntilDue === 0 ? (
                <Clock size={14} color={DASHBOARD_COLORS.dueToday} />
              ) : (
                <Calendar size={14} color={DASHBOARD_COLORS.dueLater} />
              )}

              {/* Task title - truncated */}
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: DASHBOARD_COLORS.textMuted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {task.title}
              </Typography>
            </Stack>

            {/* Right side: Priority + Countdown */}
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Priority chip */}
              <VWTooltip content={`${task.priority} priority`} placement="top">
                <span>
                  <Chip label={task.priority} uppercase={false} />
                </span>
              </VWTooltip>

              {/* Countdown chip */}
              <Chip label={countdown.label} variant={countdown.variant} uppercase={false} />
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
};

export default UpcomingDeadlinesCard;
