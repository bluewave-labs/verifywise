import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  InputBase,
  Collapse,
  Paper,
  Chip,
  IconButton,
  Button,
  Divider,
} from "@mui/material";
import { ReactComponent as AddCircleIcon } from "../../assets/icons/add-circle.svg";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";
import { ReactComponent as FilterIcon } from "../../assets/icons/filter.svg";
import { ReactComponent as ClearIcon } from "../../assets/icons/clear.svg";
import { ReactComponent as ExpandMoreIcon } from "../../assets/icons/expand-down.svg";
import { ReactComponent as ExpandLessIcon } from "../../assets/icons/expand-up.svg";
import TasksTable from "../../components/Table/TasksTable";
import CustomizableButton from "../../components/Button/CustomizableButton";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import taskManagementHelpContent from "../../helpers/task-management-help.html?raw";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  ITask,
  TaskStatus,
  TaskPriority,
  TaskSummary,
} from "../../../domain/interfaces/i.task";
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from "../../../application/repository/task.repository";
import HeaderCard from "../../components/Cards/DashboardHeaderCard";
import CreateTask from "../../components/Modals/CreateTask";
import Select from "../../components/Inputs/Select";
import Field from "../../components/Inputs/Field";
import useUsers from "../../../application/hooks/useUsers";
import CustomSelect from "../../components/CustomSelect";
import DualButtonModal from "../../components/Dialogs/DualButtonModal";
import {
  vwhomeHeading,
  vwhomeHeaderCards,
  vwhomeBody,
  vwhomeBodyControls,
} from "../Home/1.0Home/style";
import { searchBoxStyle, searchInputStyle } from "./style";
import singleTheme from "../../themes/v1SingleTheme";
import DatePicker from "../../components/Inputs/Datepicker";
import dayjs from "dayjs";
import Toggle from "../../components/Toggle";

// Task status options for CustomSelect
const TASK_STATUS_OPTIONS = [
  TaskStatus.OPEN,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
];

// Status display mapping
const STATUS_DISPLAY_MAP = {
  [TaskStatus.OPEN]: "Open",
  [TaskStatus.IN_PROGRESS]: "In progress",
  [TaskStatus.COMPLETED]: "Completed",
  [TaskStatus.OVERDUE]: "Overdue",
};

// Reverse mapping for API calls

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ITask | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Newest");
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<TaskPriority[]>([]);
  const [assigneeFilters, setAssigneeFilters] = useState<number[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const handleDateFromChange = (newDate: dayjs.Dayjs | null) => {
    if (newDate?.isValid()) {
      setDueDateFrom(newDate.format("YYYY-MM-DD"));
    } else {
      setDueDateFrom("");
    }
  };

  const handleDateToChange = (newDate: dayjs.Dayjs | null) => {
    if (newDate?.isValid()) {
      setDueDateTo(newDate.format("YYYY-MM-DD"));
    } else {
      setDueDateTo("");
    }
  };

  // Filter expansion state (like RiskFilters)
  const getInitialExpandedState = (): boolean => {
    const saved = localStorage.getItem("taskFilters_expanded");
    return saved !== null ? JSON.parse(saved) : false;
  };
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(
    getInitialExpandedState()
  );

  const { userRoleName } = useContext(VerifyWiseContext);
  const { users } = useUsers();
  const isCreatingDisabled =
    !userRoleName || !["Admin", "Editor"].includes(userRoleName);

  // Handle expanded state changes and save to localStorage
  const handleExpandedChange = (newExpanded: boolean) => {
    setFiltersExpanded(newExpanded);
    localStorage.setItem("taskFilters_expanded", JSON.stringify(newExpanded));
  };

  // Get active filter count (like RiskFilters)
  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilters.length > 0) count++;
    if (priorityFilters.length > 0) count++;
    if (assigneeFilters.length > 0) count++;
    if (categoryFilters.length > 0) count++;
    if (dueDateFrom !== "" || dueDateTo !== "") count++;
    if (includeArchived) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Clear all filters function
  const clearAllFilters = () => {
    setStatusFilters([]);
    setPriorityFilters([]);
    setAssigneeFilters([]);
    setCategoryFilters([]);
    setDueDateFrom("");
    setDueDateTo("");
    setIncludeArchived(false);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate summary from tasks data
  const summary: TaskSummary = useMemo(
    () => ({
      total: tasks.length,
      open: tasks.filter((task) => task.status === "Open").length,
      inProgress: tasks.filter(
        (task) =>
          (task.status as string) === "In progress" ||
          (task.status as string) === "In Progress"
      ).length,
      completed: tasks.filter((task) => task.status === "Completed").length,
      overdue: tasks.filter((task) => task.isOverdue === true).length,
    }),
    [tasks]
  );

  // Fetch tasks when component mounts or any filter changes
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear previous errors
        // Filter out "Overdue" from status filters for API call since it's computed
        const apiStatusFilters = statusFilters
          .filter((status) => status !== TaskStatus.OVERDUE)
          .map((status) => {
            // Convert display values to API values
            if (status === "In progress") return "In Progress";
            return status;
          }) as string[];

        const response = await getAllTasks({
          search: debouncedSearchQuery || undefined,
          status:
            apiStatusFilters.length > 0 ? (apiStatusFilters as any) : undefined,
          priority: priorityFilters.length > 0 ? priorityFilters : undefined,
          assignee: assigneeFilters.length > 0 ? assigneeFilters : undefined,
          category: categoryFilters.length > 0 ? categoryFilters : undefined,
          due_date_start: dueDateFrom || undefined,
          due_date_end: dueDateTo || undefined,
          include_archived: includeArchived || undefined,
          ...(sortBy !== "Priority" && {
            sort_by:
              sortBy === "Newest"
                ? "created_at"
                : sortBy === "Oldest"
                ? "created_at"
                : sortBy === "Due date"
                ? "due_date"
                : "created_at",
            sort_order:
              sortBy === "Oldest"
                ? "ASC"
                : sortBy === "Due date"
                ? "ASC"
                : "DESC",
          }),
        });

        let filteredTasks = response?.data?.tasks || [];

        // Apply frontend filtering for "Overdue" status
        if (statusFilters.includes(TaskStatus.OVERDUE)) {
          filteredTasks = filteredTasks.filter(
            (task: ITask) => task.isOverdue === true
          );
        }

        // Handle priority sorting on frontend to avoid SQL error
        if (sortBy === "Priority") {
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          filteredTasks = filteredTasks.sort((a: ITask, b: ITask) => {
            const priorityA =
              priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const priorityB =
              priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            return priorityB - priorityA; // DESC order (High to Low)
          });
        }

        setTasks(filteredTasks);
      } catch (err: any) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks. Please try again later.");
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [
    debouncedSearchQuery,
    statusFilters,
    priorityFilters,
    assigneeFilters,
    categoryFilters,
    dueDateFrom,
    dueDateTo,
    includeArchived,
    sortBy,
  ]);

  const handleCreateTask = () => {
    if (isCreatingDisabled) {
      return;
    }
    setIsCreateTaskModalOpen(true);
  };

  const handleTaskCreated = async (formData: any) => {
    try {
      const response = await createTask({ body: formData });
      if (response && response.data) {
        // Add the new task to the list
        setTasks((prev) => [response.data, ...prev]);
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleEditTask = (task: ITask) => {
    setEditingTask(task);
  };

  const handleDeleteTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask({ id: taskToDelete.id! });
      setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id));
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleUpdateTask = async (formData: any) => {
    if (!editingTask) return;

    try {
      const response = await updateTask({
        id: editingTask.id!,
        body: formData,
      });
      if (response && response.data) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === editingTask.id ? response.data : task
          )
        );
        setEditingTask(null);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleTaskStatusChange =
    (taskId: number) =>
    async (newStatus: string): Promise<boolean> => {
      try {
        const response = await updateTaskStatus({
          id: taskId,
          status: newStatus as TaskStatus,
        });
        if (response && response.data) {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === taskId
                ? { ...task, status: newStatus as TaskStatus }
                : task
            )
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating task status:", error);
        return false;
      }
    };

  return (
    <Stack className="vwhome" gap={"20px"}>
      <PageBreadcrumbs />
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={taskManagementHelpContent}
        pageTitle="Task Management"
      />

        {/* Page Header */}
        <Stack sx={vwhomeBody}>
          <PageHeader
            title="Task Management"
            description="This table includes a list of tasks assigned to team members. You can create and manage all tasks here."
            rightContent={
              <HelperIcon
                onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
                size="small"
              />
            }
          />
          <Stack sx={vwhomeBodyControls}>
            <CustomizableButton
              variant="contained"
              text="Add new task"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
              }}
              icon={<AddCircleIcon />}
              onClick={handleCreateTask}
              isDisabled={isCreatingDisabled}
            />
          </Stack>
        </Stack>

        {/* Header Cards */}
        <Stack sx={{ ...vwhomeHeaderCards, mt: 8 }}>
          <HeaderCard title="Tasks" count={summary.total} />
          <HeaderCard title="Overdue" count={summary.overdue} />
          <HeaderCard title="In progress" count={summary.inProgress} />
          <HeaderCard title="Completed" count={summary.completed} />
        </Stack>

        {/* Search, Filter, and Sort Controls  */}
        <Box sx={{ mt: 8, mb: 8 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box sx={searchBoxStyle}>
              <SearchIcon style={{ color: "#6b7280", marginRight: "8px" }} />
              <InputBase
                placeholder="Search tasks by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={searchInputStyle}
                inputProps={{ "aria-label": "Search tasks" }}
              />
            </Box>

            <Stack direction="row" spacing={3} alignItems="center">
              <CustomSelect
                currentValue={sortBy}
                onValueChange={async (newSort: string) => {
                  setSortBy(newSort);
                  return true;
                }}
                options={["Newest", "Oldest", "Priority", "Due date"]}
                sx={{ minWidth: 150 }}
              />
            </Stack>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              mb: 2,
              mt: 8,
              border: "1px solid #E5E7EB",
              borderRadius: 2,
              backgroundColor: "transparent",
              boxShadow: "none",
            }}
          >
            {/* Filter Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: filtersExpanded ? "1px solid #E5E7EB" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => handleExpandedChange(!filtersExpanded)}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <FilterIcon
                  style={{ color: "#13715B", width: "20px", height: "20px" }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "#1A1919" }}
                >
                  Filters
                </Typography>
                {activeFilterCount > 0 && (
                  <Chip
                    label={activeFilterCount}
                    size="small"
                    sx={{
                      backgroundColor: "#13715B",
                      color: "white",
                      fontWeight: 600,
                      minWidth: 20,
                      height: 20,
                      "& .MuiChip-label": {
                        px: 1,
                        fontSize: 11,
                      },
                    }}
                  />
                )}
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                {activeFilterCount > 0 && (
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      clearAllFilters();
                    }}
                    sx={{
                      color: "#6B7280",
                      textTransform: "none",
                      fontSize: 12,
                      "&:hover": {
                        backgroundColor: "#F3F4F6",
                      },
                    }}
                  >
                    Clear All
                  </Button>
                )}
                <IconButton size="small">
                  {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Stack>
            </Box>

            {/* Filter Content */}
            <Collapse in={filtersExpanded}>
              <Box sx={{ p: 3, pt: 5, pb: 7, backgroundColor: "#FFFFFF" }}>
                {/* All Filters in One Row */}
                <Stack
                  direction="row"
                  justifyContent="flex-start"
                  spacing={8}
                  sx={{ ml: "12px", width: "100%" }}
                >
                  <Select
                    id="status-filter"
                    label="Status"
                    value={statusFilters.length > 0 ? statusFilters[0] : "all"}
                    items={[
                      { _id: "all", name: "All Statuses" },
                      ...Object.values(TaskStatus).map((status) => ({
                        _id: status,
                        name:
                          STATUS_DISPLAY_MAP[status as TaskStatus] || status,
                      })),
                    ]}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "all") {
                        setStatusFilters([]);
                      } else {
                        setStatusFilters([value as TaskStatus]);
                      }
                    }}
                    sx={{ width: 140 }}
                  />

                  <Select
                    id="priority-filter"
                    label="Priority"
                    value={
                      priorityFilters.length > 0 ? priorityFilters[0] : "all"
                    }
                    items={[
                      { _id: "all", name: "All Priorities" },
                      ...Object.values(TaskPriority).map((priority) => ({
                        _id: priority,
                        name: priority,
                      })),
                    ]}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "all") {
                        setPriorityFilters([]);
                      } else {
                        setPriorityFilters([value as TaskPriority]);
                      }
                    }}
                    sx={{ width: 140 }}
                  />

                  <Select
                    id="assignee-filter"
                    label="Assignee"
                    value={
                      assigneeFilters.length > 0
                        ? assigneeFilters[0].toString()
                        : "all"
                    }
                    items={[
                      { _id: "all", name: "All Assignees" },
                      ...users.map((user) => ({
                        _id: user.id.toString(),
                        name: `${user.name} ${user.surname ?? ""}`.trim(),
                      })),
                    ]}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "all") {
                        setAssigneeFilters([]);
                      } else {
                        setAssigneeFilters([Number(value)]);
                      }
                    }}
                    sx={{ width: 160 }}
                  />

                  <Field
                    id="category-filter"
                    label="Categories"
                    width="160px"
                    value={categoryFilters.join(", ")}
                    onChange={(e) => {
                      const categories = e.target.value
                        .split(",")
                        .map((cat) => cat.trim())
                        .filter((cat) => cat);
                      setCategoryFilters(categories);
                    }}
                    placeholder="Enter categories"
                  />

                  <DatePicker
                    label="From"
                    date={dueDateFrom ? dayjs(dueDateFrom) : null}
                    handleDateChange={handleDateFromChange}
                    sx={{
                      width: 140,
                      "& > p": {
                        marginBottom: "-3px !important",
                      },
                    }}
                  />

                  <DatePicker
                    label="To"
                    date={dueDateTo ? dayjs(dueDateTo) : null}
                    handleDateChange={handleDateToChange}
                    sx={{
                      width: 140,
                      "& > p": {
                        marginBottom: "-3px !important",
                      },
                    }}
                  />

                  <Stack direction="column" spacing={1}>
                    <Typography
                      component="p"
                      variant="body1"
                      color="text.secondary"
                      fontWeight={500}
                      fontSize={"13px"}
                      sx={{ margin: 0, height: "22px", mb: 2 }}
                    >
                      Include archived
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        minHeight: "34px",
                      }}
                    >
                      <Toggle
                        checked={includeArchived}
                        onChange={(checked) => setIncludeArchived(checked)}
                      />
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            </Collapse>
          </Paper>
        </Box>

        {/* Content Area */}
        <Box sx={{ mt: 8 }}>
          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography>Loading tasks...</Typography>
            </Box>
          )}

          {error && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {!isLoading && !error && (
            <TasksTable
              tasks={tasks}
              users={users}
              onArchive={handleDeleteTask}
              onEdit={handleEditTask}
              onStatusChange={handleTaskStatusChange}
              statusOptions={TASK_STATUS_OPTIONS.map(
                (status) => STATUS_DISPLAY_MAP[status as TaskStatus] || status
              )}
              isUpdateDisabled={isCreatingDisabled}
            />
          )}
        </Box>

        {/* Create Task Modal */}
        <CreateTask
          isOpen={isCreateTaskModalOpen}
          setIsOpen={setIsCreateTaskModalOpen}
          onSuccess={handleTaskCreated}
        />

        {/* Edit Task Modal */}
        {editingTask && (
          <CreateTask
            isOpen={!!editingTask}
            setIsOpen={(open) => !open && setEditingTask(null)}
            onSuccess={handleUpdateTask}
            initialData={editingTask}
            mode="edit"
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DualButtonModal
          title="Archive Task"
          body={
            <Typography fontSize={13}>
              Are you sure you want to archive "{taskToDelete?.title}"? You can
              restore it later by using the "Show all tasks" toggle.
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Archive"
          onCancel={() => setDeleteConfirmOpen(false)}
          onProceed={confirmDeleteTask}
          proceedButtonColor="warning"
          proceedButtonVariant="contained"
          isOpen={deleteConfirmOpen}
          TitleFontSize={0}
        />
    </Stack>
  );
};

export default Tasks;
