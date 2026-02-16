import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    Stack,
    Typography,
    Chip,
    Box,
    CircularProgress,
    Divider,
    Button,
    useTheme,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { getTaskById } from "../../../application/repository/task.repository";
import { TaskModel } from "../../../domain/models/Common/task/task.model";
import { TaskPriority } from "../../../domain/enums/task.enum";
import useUsers from "../../../application/hooks/useUsers";
import { Layers } from "lucide-react";
import { Home } from "lucide-react";
import { File } from "lucide-react";
import { Columns } from "lucide-react";

/* ================= STATUS & PRIORITY COLORS ================= */
const STATUS_STYLE_MAP: Record<string, { bg: string; text: string }> = {
    Total: { bg: "#E3F2FD", text: "#1565C0" },
    Open: { bg: "#DCEEF8", text: "#0277BD" },
    Overdue: { bg: "#FFEBEE", text: "#C62828" },
    "In Progress": { bg: "#FFF3E0", text: "#EF6C00" },
    Completed: { bg: "#E8F5E9", text: "#2E7D32" },
};

const PRIORITY_STYLE_MAP: Record<string, { bg: string; text: string }> = {
    [TaskPriority.HIGH]: { bg: "#FFE5D0", text: "#E64A19" },
    [TaskPriority.MEDIUM]: { bg: "#FFF3E0", text: "#EF6C00" },
    [TaskPriority.LOW]: { bg: "#E8F5E9", text: "#2E7D32" },
};

/* ================= CHIP STYLES ================= */
const getChipStyle = (type: string, value?: string) => {
    switch (type) {
        case "useCase":
            return {
                backgroundColor: "#E1F5FE",
                color: "#0277BD",
                fontWeight: 500,
                fontSize: "11px",
                height: 28,
                borderRadius: 2,
                border: "1px solid rgb(213, 227, 237)",
            };
        case "model":
            return {
                backgroundColor: "#EDE7F6",
                color: "#5E35B1",
                fontWeight: 500,
                fontSize: "11px",
                height: 28,
                borderRadius: 2,
                border: "1px solid rgb(213, 227, 237)",
            };
        case "framework":
            return {
                backgroundColor: "#E8F5E9",
                color: "#2E7D32",
                fontWeight: 500,
                fontSize: "11px",
                height: 28,
                borderRadius: 2,
                border: "1px solid rgb(213, 227, 237)",
            };
        case "vendor":
            return {
                backgroundColor: "#FFF3E0",
                color: "#EF6C00",
                fontWeight: 500,
                fontSize: "11px",
                height: 28,
                borderRadius: 2,
                border: "1px solid rgb(213, 227, 237)",
            };
        case "status":
            const style1 = STATUS_STYLE_MAP[value || ""];
            const bg1 = style1?.bg || "#fff";
            const text1 = style1?.text || "#000";

            return {
                backgroundColor: bg1,
                color: text1,
                fontWeight: 500,
                fontSize: "11px",
                height: 28,
                borderRadius: 2,
                border: `1px solid ${bg1}`,
            };
        case "priority":
            const style = PRIORITY_STYLE_MAP[value || ""];
            const bg = style?.bg || "#fff";
            const text = style?.text || "#000";

            return {
                backgroundColor: bg,
                color: text,
                fontWeight: 500,
                fontSize: "11px",
                height: 28,
                borderRadius: 2,
                border: `1px solid ${bg}`,
            };
        default:
            return {
                fontWeight: 500,
                fontSize: "11px",
                height: 28,
                borderRadius: 2,
            };
    }
};

const getMappingIcon = (type: string) => {
    switch (type) {
        case "useCase":
            return <Columns size={16} />;
        case "model":
            return <Layers size={16} />;
        case "framework":
            return <File size={16} />;
        case "vendor":
            return <Home size={16} />;
        default:
            return undefined;
    }
};

/* ================= RIGHT PANEL SECTION ================= */
const MappingSection = ({ title, items, type }: any) => (
    <Stack spacing={1} mb={4}>
        {/* Title and count */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontSize={12} fontWeight={600}>
                {title}
            </Typography>

            <Box
                sx={{
                    backgroundColor: "#F2F4F7",
                    px: "8px",
                    borderRadius: 1,
                    minWidth: 24,
                    textAlign: "center",
                }}
            >
                {items.length}
            </Box>
        </Stack>

        {/* Chips in row with wrap */}
        <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            columnGap={2}
            rowGap={1}
        >
            {items.map((item: string, i: number) => (
                <Chip
                    key={i}
                    label={item}
                    size="small"
                    icon={getMappingIcon(type)}
                    sx={{
                        ...getChipStyle(type, item),
                        height: 28,
                    }}
                />
            ))}
        </Stack>
    </Stack>
);

/* ================= MAIN COMPONENT ================= */
const TaskDetails: React.FC = () => {
    const theme = useTheme();
    const { id } = useParams();

    const [task, setTask] = useState<TaskModel | null>(null);
    const [loading, setLoading] = useState(true);
    const { users } = useUsers();

    useEffect(() => {
        const fetchTask = async () => {
            if (!id) return;
            try {
                const response = await getTaskById({ id });
                setTask(response?.data || null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [id]);

    if (loading) return <CircularProgress />;
    if (!task) return <Typography>No task found</Typography>;

    const useCases = [
        "Customer churn prediction",
        "Risk assessment automation",
    ];
    const models = ["Churn-Predictor-v2.3"];
    const frameworks = ["EU AI Act", "ISO 42001"];
    const vendors = ["AWS SageMaker"];

    return (
        <Box sx={{ p: "32px", gap: "32px", backgroundColor: theme.palette.background.main }}>
            <Stack direction="row" spacing={4} alignItems="stretch" sx={{ gap: "32px" }}>
                {/* ================= LEFT CARD ================= */}
                <Card
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 400,
                        border: `1px solid ${theme.palette.border.light}`,
                        borderRadius: "4px",
                        backgroundColor: theme.palette.background.paper,
                    }}
                >
                    <CardContent sx={{ p: 0 }}>
                        {/* BUTTON SECTION WITH LIGHT BACKGROUND */}
                        <Box
                            sx={{
                                px: "24px",
                                py: "24px",
                                backgroundColor: theme.palette.background.alt,
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" spacing="16px">
                                <Button variant="outlined" size="small" onClick={() => window.history.back()}>
                                    Back to tasks
                                </Button>
                                <Button variant="contained" size="small">
                                    Edit task
                                </Button>
                            </Stack>
                        </Box>

                        {/* FULL WIDTH DIVIDER */}
                        <Divider />

                        {/* DETAILS SECTION */}
                        <Box sx={{ px: "24px", py: "24px" }}>
                            <Stack spacing="24px">
                                {/* ASSIGNEES */}
                                <Stack direction="row" alignItems="center" sx={{ py: "16px", gap: "16px" }}>
                                    {/* Label */}
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: theme.palette.text.secondary,
                                            minWidth: 120,
                                        }}
                                    >
                                        Assignees
                                    </Typography>

                                    <Stack direction="row" spacing={2} alignItems="center">
                                        {/* Assignee initials */}
                                        {task.assignees && task.assignees.length > 0 && (
                                            <Stack direction="row" spacing={0.5} sx={{ gap: "4px" }}>
                                                {task.assignees.slice(0, 3).map((assigneeId, idx) => {
                                                    const user = users.find((u) => u.id === Number(assigneeId));
                                                    const initials = user
                                                        ? `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
                                                        : "?";

                                                    return (
                                                        <Box
                                                            key={idx}
                                                            sx={{
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: "50%",
                                                                backgroundColor: "#064E3B",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: 11,
                                                                fontWeight: 500,
                                                                color: "#fff",
                                                                border: "2px solid #fff",
                                                            }}
                                                        >
                                                            {initials}
                                                        </Box>
                                                    );
                                                })}

                                                {/* +N for extra */}
                                                {task.assignees.length > 3 && (
                                                    <Box
                                                        sx={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: "50%",
                                                            backgroundColor: "#e5e7eb",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: 10,
                                                            fontWeight: 500,
                                                            color: "#6b7280",
                                                            border: "2px solid #fff",
                                                        }}
                                                    >
                                                        +{task.assignees.length - 3}
                                                    </Box>
                                                )}
                                            </Stack>
                                        )}

                                        {/* Assignee names */}
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: theme.palette.text.secondary,
                                            }}
                                        >
                                            {task?.assignees?.length
                                                ? task.assignees
                                                    .map((assigneeId) => {
                                                        const user = users.find((u) => u.id === Number(assigneeId));
                                                        return user ? `${user.name} ${user.surname}` : "Unknown";
                                                    })
                                                    .join(", ")
                                                : "Unassigned"}
                                        </Typography>
                                    </Stack>
                                </Stack>
                                <Divider />

                                {/* STATUS */}
                                <Stack direction="row" sx={{ py: "12px", gap: "16px" }}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: theme.palette.text.secondary,
                                            minWidth: 120,
                                        }}
                                    >
                                        Status
                                    </Typography>
                                    <Chip
                                        sx={getChipStyle("status", task.status)}
                                        label={task.status}
                                        size="small"
                                    />
                                </Stack>

                                <Divider />

                                {/* PRIORITY */}
                                <Stack direction="row" sx={{ py: "12px", gap: "16px" }}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: theme.palette.text.secondary,
                                            minWidth: 120,
                                        }}
                                    >
                                        Priority
                                    </Typography>
                                    <Chip
                                        label={task.priority}
                                        sx={getChipStyle("priority", task.priority)}
                                    />
                                </Stack>

                                <Divider />

                                {/* DUE DATE */}
                                <Stack direction="row" sx={{ py: "16px", gap: "16px" }}>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: theme.palette.text.secondary,
                                            minWidth: 120,
                                        }}
                                    >
                                        Due date
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: theme.palette.text.primary,
                                        }}
                                    >
                                        {task.due_date
                                            ? new Date(task.due_date).toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })
                                            : "-"}
                                    </Typography>
                                </Stack>

                                <Divider />

                                {/* DESCRIPTION */}
                                <Stack
                                    direction="row"
                                    alignItems="flex-start"
                                    sx={{ py: "12px", gap: "24px" }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: theme.palette.text.secondary,
                                            minWidth: 120,
                                        }}
                                    >
                                        Description
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: theme.palette.text.primary,
                                        }}
                                    >
                                        {task?.description?.trim()
                                            ? task.description
                                            : "This is a static description."}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>

                {/* ================= RIGHT CARD ================= */}
                <Card
                    sx={{
                        width: "400px",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 400,
                        border: `1px solid ${theme.palette.border.light}`,
                        borderRadius: "4px",
                        backgroundColor: theme.palette.background.paper,
                    }}
                >
                    <CardContent sx={{ p: 0 }}>
                        {/* BUTTON SECTION */}
                        <Box
                            sx={{
                                px: "24px",
                                py: "24px",
                                backgroundColor: theme.palette.background.alt,
                            }}
                        >
                            <Stack direction="row" justifyContent="flex-end" spacing="16px">
                                <Button variant="contained" size="small">
                                    Edit mappings
                                </Button>
                            </Stack>
                        </Box>

                        <Divider />

                        <Box sx={{ px: "24px", py: "24px" }}>
                            <Stack spacing="24px">
                                <MappingSection
                                    title="USE CASES"
                                    items={useCases}
                                    type="useCase"
                                />
                                <Divider />
                                <MappingSection
                                    title="MODELS"
                                    items={models}
                                    type="model"
                                />
                                <Divider />
                                <MappingSection
                                    title="FRAMEWORKS"
                                    items={frameworks}
                                    type="framework"
                                />
                                <Divider />
                                <MappingSection
                                    title="VENDORS"
                                    items={vendors}
                                    type="vendor"
                                />
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Stack>

            {/* MOCKUP NOTES */}
            <Box
                sx={{
                    mt: "24px",
                    p: "16px",
                    border: `1px solid ${theme.palette.warning.light}`,
                    backgroundColor: "#FFF8E1",
                    borderRadius: "4px",
                }}
            >
                <Typography
                    fontSize={14}
                    fontWeight={600}
                    color={theme.palette.text.secondary}
                    sx={{ py: "8px" }}
                >
                    Mockup notes
                </Typography>
                <Typography
                    fontSize={12}
                    fontWeight={600}
                    color={theme.palette.text.secondary}
                    sx={{ py: "4px" }}
                >
                    Click "Edit task" - Opens edit modal
                </Typography>
                <Typography
                    fontSize={12}
                    fontWeight={600}
                    color={theme.palette.text.secondary}
                    sx={{ py: "4px" }}
                >
                    Click "Edit mappings" - Opens mapping modal
                </Typography>
            </Box>
        </Box>
    );
};

export default TaskDetails;