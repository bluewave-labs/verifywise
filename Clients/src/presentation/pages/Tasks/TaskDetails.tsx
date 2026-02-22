import React, { useState, useEffect, useCallback, useMemo } from "react";
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
    Fade,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { getTaskById, updateTask } from "../../../application/repository/task.repository";
import { TaskModel } from "../../../domain/models/Common/task/task.model";
import { TaskPriority } from "../../../domain/enums/task.enum";
import useUsers from "../../../application/hooks/useUsers";
import { useTaskMappings } from "../../../application/hooks/useTaskMappings";
import { Layers, Home, File, Columns } from "lucide-react";
import CreateTask from "../../components/Modals/CreateTask";
import EditTaskMappingsModal from "../../components/Modals/EditTaskMappings";
import Alert from "../../components/Alert";
import { ICreateTaskFormValues } from "../../../domain/interfaces/i.task";
import dayjs from "dayjs";

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
        case "usecase":
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
        case "usecase":
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
const MappingSection = ({ title, items, type, isLoading }: any) => {
    // Show loading state
    if (isLoading) {
        return (
            <Stack spacing={1} mb={4}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontSize={12} fontWeight={600}>
                        {title}
                    </Typography>
                    <CircularProgress size={16} />
                </Stack>
            </Stack>
        );
    }

    if (!items || items.length === 0) {
        return (
            <Stack spacing={1} mb={4}>
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
                        0
                    </Box>
                </Stack>
                <Typography fontSize={12} color="textSecondary">
                    No items selected
                </Typography>
            </Stack>
        );
    }

    return (
        <Stack spacing={1} mb={4}>
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
                            ...getChipStyle(type),
                            height: 28,
                        }}
                    />
                ))}
            </Stack>
        </Stack>
    );
};

/* ================= MAIN COMPONENT ================= */
const TaskDetails: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();

    const [task, setTask] = useState<TaskModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditMappingsModalOpen, setIsEditMappingsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Alert state for notifications
    const [alert, setAlert] = useState<{
        variant: "success" | "error" | "warning" | "info";
        title: string;
        body?: string;
    } | null>(null);
    const [showAlert, setShowAlert] = useState(false);

    const { users } = useUsers();
    
    // NEW: Fetch mapping master data
    const { 
        isLoading: mappingLoading,
        mapIdsToNames,
    } = useTaskMappings();

    // Fetch task on mount or when id changes
    useEffect(() => {
        const fetchTask = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const response = await getTaskById({ id });
                setTask(response?.data || null);
            } catch (err) {
                console.error("Error fetching task:", err);
                setAlert({
                    variant: "error",
                    title: "Error loading task",
                    body: "Failed to load task details. Please try again.",
                });
                setShowAlert(true);
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [id]);

    // NEW: Memoize mapped display names
    const mappedNames = useMemo(() => {
        if (!task) return {};
        return {
            useCases: mapIdsToNames(task.use_cases, "useCaseMap"),
            models: mapIdsToNames(task.models, "modelMap"),
            frameworks: mapIdsToNames(task.frameworks, "frameworkMap"),
            vendors: mapIdsToNames(task.vendors, "vendorMap"),
        };
    }, [task, mapIdsToNames]);

    // Handle Edit Task button click
    const handleEditTaskClick = useCallback(() => {
        setIsEditModalOpen(true);
    }, []); 

    // Handle Edit Mappings button click
    const handleEditMappingsClick = useCallback(() => {
        setIsEditMappingsModalOpen(true);
    }, []);

    // Handle task update from modal
    const handleTaskUpdate = useCallback(
        async (formData: ICreateTaskFormValues) => {
            if (!task?.id) return;

            try {
                setIsUpdating(true);

                const updatePayload = {
                    ...formData,
                    due_date: formData.due_date 
                    ? new Date(dayjs(formData.due_date).toISOString())
                    : undefined,
                    assignees: formData.assignees.map((assignee: any) =>
                        typeof assignee === "object" && "id" in assignee
                            ? assignee.id
                            : assignee
                    ),
                };

                const response = await updateTask({
                    id: task.id,
                    body: updatePayload,
                });

                if (response?.data) {
                    setTask(response.data);
                    setIsEditModalOpen(false);

                    setAlert({
                        variant: "success",
                        title: "Task updated successfully",
                        body: "Your changes have been saved.",
                    });
                    setShowAlert(true);

                    setTimeout(() => {
                        setShowAlert(false);
                        setTimeout(() => setAlert(null), 300);
                    }, 4000);

                    window.dispatchEvent(
                        new CustomEvent("taskUpdated", {
                            detail: { taskId: task.id, updatedTask: response.data },
                        })
                    );
                }
            } catch (err) {
                console.error("Error updating task:", err);
                setAlert({
                    variant: "error",
                    title: "Error updating task",
                    body: "Failed to save changes. Please try again.",
                });
                setShowAlert(true);
                setTimeout(() => {
                    setShowAlert(false);
                    setTimeout(() => setAlert(null), 300);
                }, 4000);
            } finally {
                setIsUpdating(false);
            }
        },
        [task?.id]
    );

    // Handle mappings update from modal
    // const handleMappingsUpdate = useCallback((updatedTask: TaskModel) => {
    //     setTask(updatedTask);

    //     console.log("Updated task after mappings change:", updatedTask);

    //     setAlert({
    //         variant: "success",
    //         title: "Mappings updated successfully",
    //         body: "Task mappings have been saved.",
    //     });
    //     setShowAlert(true);

    //     setTimeout(() => {
    //         setShowAlert(false);
    //         setTimeout(() => setAlert(null), 300);
    //     }, 4000);

    //     // Emit event to notify parent Tasks page
    //     window.dispatchEvent(
    //         new CustomEvent("taskUpdated", {
    //             detail: { taskId: updatedTask.id, updatedTask },
    //         })
    //     );
    // }, []);

    // ✅ FIX: Ensure task state is properly updated with new mappings
const handleMappingsUpdate = useCallback((updatedTask: TaskModel) => {
    // ✅ Update local state with the new task (including mapping fields)
    setTask(updatedTask);

    setAlert({
        variant: "success",
        title: "Mappings updated successfully",
        body: "Task mappings have been saved.",
    });
    setShowAlert(true);

    setTimeout(() => {
        setShowAlert(false);
        setTimeout(() => setAlert(null), 300);
    }, 4000);

    // Emit event to notify parent Tasks page
    window.dispatchEvent(
        new CustomEvent("taskUpdated", {
            detail: { taskId: updatedTask.id, updatedTask },
        })
    );
}, []);

    // Handle back navigation
    const handleBackClick = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    if (loading) return <CircularProgress />;
    if (!task) return <Typography>No task found</Typography>;

    return (
        <Box
            sx={{
                p: "32px",
                gap: "32px",
                backgroundColor: theme.palette.background.main,
            }}
        >
            <Stack
                direction="row"
                spacing={4}
                alignItems="stretch"
                sx={{ gap: "32px" }}
            >
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
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                spacing="16px"
                            >
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleBackClick}
                                >
                                    Back to tasks
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleEditTaskClick}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? "Updating..." : "Edit task"}
                                </Button>
                            </Stack>
                        </Box>

                        {/* FULL WIDTH DIVIDER */}
                        <Divider />

                        {/* DETAILS SECTION */}
                        <Box sx={{ px: "24px", py: "24px" }}>
                            <Stack spacing="24px">
                                {/* ASSIGNEES */}
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    sx={{ py: "16px", gap: "16px" }}
                                >
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

                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        alignItems="center"
                                    >
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
                                <Stack
                                    direction="row"
                                    sx={{ py: "12px", gap: "16px" }}
                                >
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
                                <Stack
                                    direction="row"
                                    sx={{ py: "12px", gap: "16px" }}
                                >
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
                                        sx={getChipStyle(
                                            "priority",
                                            task.priority
                                        )}
                                    />
                                </Stack>

                                <Divider />

                                {/* DUE DATE */}
                                <Stack
                                    direction="row"
                                    sx={{ py: "16px", gap: "16px" }}
                                >
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
                                            ? dayjs(task.due_date).format(
                                                  "DD MMMM YYYY"
                                              )
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
                                            : "No description provided."}
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
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleEditMappingsClick}
                                >
                                    Edit mappings
                                </Button>
                            </Stack>
                        </Box>

                        <Divider />

                        <Box sx={{ px: "24px", py: "24px" }}>
                            <Stack spacing="24px">
                                <MappingSection
                                    title="USE CASES"
                                    items={mappedNames.useCases}
                                    type="usecase"
                                    isLoading={mappingLoading}
                                />
                                <Divider />
                                <MappingSection
                                    title="MODELS"
                                    items={mappedNames.models}
                                    type="model"
                                    isLoading={mappingLoading}
                                />
                                <Divider />
                                <MappingSection
                                    title="FRAMEWORKS"
                                    items={mappedNames.frameworks}
                                    type="framework"
                                    isLoading={mappingLoading}
                                />
                                <Divider />
                                <MappingSection
                                    title="VENDORS"
                                    items={mappedNames.vendors}
                                    type="vendor"
                                    isLoading={mappingLoading}
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
                    Click "Edit task" - Opens edit modal with pre-filled values
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

            {/* Edit Task Modal */}
            {task && (
                <CreateTask
                    isOpen={isEditModalOpen}
                    setIsOpen={setIsEditModalOpen}
                    onSuccess={handleTaskUpdate}
                    initialData={task}
                    mode="edit"
                />
            )}

            {/* Edit Mappings Modal */}
            {task && (
                <EditTaskMappingsModal
                    isOpen={isEditMappingsModalOpen}
                    setIsOpen={setIsEditMappingsModalOpen}
                    task={task}
                    onSuccess={handleMappingsUpdate}
                />
            )}

            {/* Notification Toast */}
            {alert && (
                <Fade in={showAlert} timeout={300}>
                    <Box sx={{ position: "fixed" }}>
                        <Alert
                            variant={alert.variant}
                            title={alert.title}
                            body={alert.body || ""}
                            isToast={true}
                            onClick={() => {
                                setShowAlert(false);
                                setTimeout(() => setAlert(null), 300);
                            }}
                        />
                    </Box>
                </Fade>
            )}
        </Box>
    );
};

export default TaskDetails;