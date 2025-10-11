import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { CirclePlus as AddCircleIcon } from "lucide-react";
import { SearchBox } from "../../components/Search";
import TasksTable from "../../components/Table/TasksTable";
import CustomizableButton from "../../components/Button/CustomizableButton";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { ITask, TaskSummary } from "../../../domain/interfaces/i.task";
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
import useUsers from "../../../application/hooks/useUsers";
import DualButtonModal from "../../components/Dialogs/DualButtonModal";
import {
  vwhomeHeaderCards,
  vwhomeBody,
  vwhomeBodyControls,
} from "../Home/1.0Home/style";
import Toggle from "../../components/Inputs/Toggle";
import { TaskPriority, TaskStatus } from "../../../domain/enums/task.enum";

// Task status options for CustomSelect
const TASK_STATUS_OPTIONS = [
  TaskStatus.OPEN,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
];

// Status display mapping
const STATUS_DISPLAY_MAP: Record<string, string> = {
  [TaskStatus.OPEN]: "Open",
  [TaskStatus.IN_PROGRESS]: "In progress", // Show lowercase in UI
  [TaskStatus.COMPLETED]: "Completed",
  [TaskStatus.OVERDUE]: "Overdue",
  [TaskStatus.DELETED]: "Deleted",
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
  const [sortBy] = useState("Newest");
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<TaskPriority[]>([]);
  const [assigneeFilters, setAssigneeFilters] = useState<number[]>([]);
  const [categoryFilters] = useState<string[]>([]);
  const [dueDateFrom] = useState("");
  const [dueDateTo] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);



  const { userRoleName } = useContext(VerifyWiseContext);
  const { users } = useUsers();
  const isCreatingDisabled =
    !userRoleName || !["Admin", "Editor"].includes(userRoleName);



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
          (task.status as string) === "In Progress" || // API response
          (task.status as string) === "In progress"    // UI display
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
            // Convert enum values to API values
            if (status === TaskStatus.IN_PROGRESS) return "In Progress";
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
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Task management"
        description="Coordinate AI governance activities and compliance tasks across your teams"
        whatItDoes="Centralize **task assignment** and tracking for *AI governance activities*. Manage deadlines, priorities, and progress for **compliance requirements**, *audits*, and **implementation projects**."
        whyItMatters="Effective **task management** ensures nothing falls through the cracks in your *AI governance program*. It provides **accountability** and visibility into team workload, helping meet *compliance deadlines* and **implementation milestones**."
        quickActions={[
          {
            label: "Create New Task",
            description:
              "Assign a governance or compliance task to team members",
            primary: true,
          },
          {
            label: "View My Tasks",
            description: "Filter tasks assigned to you and track your progress",
          },
        ]}
        useCases={[
          "**Compliance activities** like *framework implementation steps* and **audit preparations**",
          "**Risk remediation tasks** arising from *vendor assessments* and **model evaluations**",
        ]}
        keyFeatures={[
          "**Priority-based task queuing** with *due date tracking* and automated reminders",
          "**Assignment to individuals or teams** with *progress monitoring*",
          "**Integration** with project timelines and *compliance calendars*",
        ]}
        tips={[
          "Break down **large compliance projects** into *manageable tasks* with **clear owners**",
          "Set *realistic deadlines* considering **team capacity** and other commitments",
          "**Regular task reviews** help identify *bottlenecks* and **resource constraints** early",
        ]}
      />

      {/* Page Header */}
      <Stack sx={vwhomeBody}>
        <PageHeader
          title="Task management"
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
            icon={<AddCircleIcon size={16} />}
            onClick={handleCreateTask}
            isDisabled={isCreatingDisabled}
          />
        </Stack>
      </Stack>

      {/* Header Cards */}
      <Stack sx={vwhomeHeaderCards}>
        <HeaderCard title="Tasks" count={summary.total} />
        <HeaderCard title="Overdue" count={summary.overdue} />
        <HeaderCard title="In progress" count={summary.inProgress} />
        <HeaderCard title="Completed" count={summary.completed} />
      </Stack>


      {/* Filter Dropdowns */}
      <Stack
        direction="row"
        spacing={4}
      >
                <Select
                  id="status-filter"
                  label="Status"
                  value={statusFilters.length > 0 ? statusFilters[0] : "all"}
                  items={[
                    { _id: "all", name: "All Statuses" },
                    ...Object.values(TaskStatus).map((status) => ({
                      _id: status,
                      name: STATUS_DISPLAY_MAP[status as TaskStatus] || status,
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

                <Stack direction="column" spacing={1} sx={{ width: 300 }}>
                  <Typography
                    component="p"
                    variant="body1"
                    color="text.secondary"
                    fontWeight={500}
                    fontSize={"13px"}
                    sx={{ margin: 0, height: "22px" }}
                  >
                    Search
                  </Typography>
                  <SearchBox
                    placeholder="Search tasks by title or description..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    inputProps={{ "aria-label": "Search tasks" }}
                  />
                </Stack>

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
                      onChange={(_, checked) => setIncludeArchived(checked)}
                    />
                  </Box>
                </Stack>
              </Stack>

      {/* Content Area */}
      <Box>
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
              (status) => {
                const displayStatus = STATUS_DISPLAY_MAP[status as TaskStatus] || status;
                console.log('Task status mapping:', status, '->', displayStatus);
                return displayStatus;
              }
            )}
            isUpdateDisabled={isCreatingDisabled}
            onRowClick={handleEditTask}
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
            restore it later by using the "Include archived" toggle.
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
