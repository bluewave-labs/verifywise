/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { CirclePlus as AddCircleIcon } from "lucide-react";
import { SearchBox } from "../../components/Search";
import TasksTable from "../../components/Table/TasksTable";
import CustomizableButton from "../../components/Button/CustomizableButton";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import HelperIcon from "../../components/HelperIcon";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  ITask,
  TaskSummary,
  ITaskAssignee,
} from "../../../domain/interfaces/i.task";
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskById,
  restoreTask,
  hardDeleteTask,
} from "../../../application/repository/task.repository";
import TaskSummaryCards from "./TaskSummaryCards";
import CreateTask from "../../components/Modals/CreateTask";
import useUsers from "../../../application/hooks/useUsers";
import { vwhomeBody } from "../Home/1.0Home/style";
import Toggle from "../../components/Inputs/Toggle";
import { TaskPriority, TaskStatus } from "../../../domain/enums/task.enum";
import PageTour from "../../components/PageTour";
import TasksSteps from "./TasksSteps";
import { TaskModel } from "../../../domain/models/Common/Task/task.model";
import { GroupBy } from "../../components/Table/GroupBy";
import {
  useTableGrouping,
  useGroupByState,
} from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../../components/Table/GroupedTableView";
import { ExportMenu } from "../../components/Table/ExportMenu";
import TipBox from "../../components/TipBox";
import { FilterBy, FilterColumn } from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import Alert from "../../components/Alert";

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
  [TaskStatus.DELETED]: "Archived", // Show "Archived" instead of "Deleted" for better UX
};

// Reverse mapping for API calls

const Tasks: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<TaskModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    body?: string;
  } | null>(null);

  const { userRoleName } = useContext(VerifyWiseContext);
  const { users } = useUsers();

  // Track if we've already processed the URL param to avoid duplicate fetches
  const hasProcessedUrlParam = useRef(false);

  // Group by state management
  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();
  const isCreatingDisabled =
    !userRoleName || !["Admin", "Editor"].includes(userRoleName);

  // Calculate summary from tasks data
  const summary: TaskSummary = useMemo(
    () => ({
      total: tasks.length,
      open: tasks.filter((task) => task.status === "Open").length,
      inProgress: tasks.filter(
        (task) =>
          (task.status as string) === "In Progress" || // API response
          (task.status as string) === "In progress" // UI display
      ).length,
      completed: tasks.filter((task) => task.status === "Completed").length,
      overdue: tasks.filter((task) => task.isOverdue === true).length,
    }),
    [tasks]
  );

  // Fetch all tasks (no server-side filtering - we use client-side FilterBy)
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getAllTasks({
          include_archived: includeArchived || undefined,
          sort_by: "created_at",
          sort_order: "DESC",
        });

        const fetchedTasks = response?.data?.tasks || [];
        setTasks(fetchedTasks);
      } catch (err: any) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks. Please try again later.");
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [includeArchived]);

  // Handle taskId URL param to open edit modal from Wise Search
  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId && !hasProcessedUrlParam.current && !isLoading) {
      hasProcessedUrlParam.current = true;

      // First check if task is already in the loaded list
      const existingTask = tasks.find((t) => t.id === parseInt(taskId, 10));
      if (existingTask) {
        setEditingTask(existingTask);
        // Clear the URL param after opening modal
        setSearchParams({}, { replace: true });
      } else {
        // Fetch the task if not in list (might be archived)
        getTaskById({ id: taskId })
          .then((response) => {
            if (response?.data) {
              setEditingTask(response.data);
              setSearchParams({}, { replace: true });
            }
          })
          .catch((err) => {
            console.error("Error fetching task from URL param:", err);
            setSearchParams({}, { replace: true });
          });
      }
    }
  }, [searchParams, tasks, isLoading, setSearchParams]);

  // FilterBy - Dynamic options generators
  const getUniqueAssignees = useCallback(() => {
    const assigneeIds = new Set<number>();
    tasks.forEach((task) => {
      if (task.assignees && task.assignees.length > 0) {
        task.assignees.forEach((id: number | string | ITaskAssignee) => {
          const assigneeId = typeof id === "object" ? id.user_id : id;
          assigneeIds.add(Number(assigneeId));
        });
      }
    });
    return Array.from(assigneeIds)
      .map((id) => {
        const user = users.find((u) => u.id === id);
        return {
          value: id.toString(),
          label: user ? `${user.name} ${user.surname}`.trim() : `User ${id}`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tasks, users]);

  // FilterBy - Filter columns configuration
  const taskFilterColumns: FilterColumn[] = useMemo(
    () => [
      {
        id: "title",
        label: "Title",
        type: "text" as const,
      },
      {
        id: "status",
        label: "Status",
        type: "select" as const,
        options: Object.values(TaskStatus).map((status) => ({
          value: status,
          label: STATUS_DISPLAY_MAP[status] || status,
        })),
      },
      {
        id: "priority",
        label: "Priority",
        type: "select" as const,
        options: Object.values(TaskPriority).map((priority) => ({
          value: priority,
          label: priority,
        })),
      },
      {
        id: "assignee",
        label: "Assignee",
        type: "select" as const,
        options: getUniqueAssignees(),
      },
      {
        id: "due_date",
        label: "Due date",
        type: "date" as const,
      },
    ],
    [getUniqueAssignees]
  );

  // FilterBy - Field value getter
  const getTaskFieldValue = useCallback(
    (
      item: TaskModel,
      fieldId: string
    ): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "title":
          return item.title;
        case "status":
          return item.status;
        case "priority":
          return item.priority;
        case "assignee":
          // Return comma-separated assignee IDs for matching
          return item.assignees
            ?.map((id: number | string | ITaskAssignee) => {
              const assigneeId = typeof id === "object" ? id.user_id : id;
              return assigneeId.toString();
            })
            .join(",");
        case "due_date":
          return item.due_date;
        default:
          return null;
      }
    },
    []
  );

  // FilterBy - Initialize hook
  const {
    filterData: filterTaskData,
    handleFilterChange: handleTaskFilterChange,
  } = useFilterBy<TaskModel>(getTaskFieldValue);

  // Apply FilterBy and search filtering
  const filteredTasks = useMemo(() => {
    let result = filterTaskData(tasks);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((task) =>
        task.title?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [filterTaskData, tasks, searchQuery]);

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
        setAlert({
          variant: "success",
          title: "Task created successfully",
          body: "Your new task has been added.",
        });
        setTimeout(() => setAlert(null), 4000);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      setAlert({
        variant: "error",
        title: "Error creating task",
        body: "Failed to create the task. Please try again.",
      });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const handleEditTask = (task: ITask) => {
    setEditingTask(task);
  };

  // Archive handler - called from IconButton's modal confirmation
  const handleArchiveTask = async (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await deleteTask({ id: taskId });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setAlert({
        variant: "success",
        title: "Task archived successfully",
        body: `"${task.title}" has been archived.`,
      });
      setTimeout(() => setAlert(null), 4000);
    } catch (error) {
      console.error("Error archiving task:", error);
      setAlert({
        variant: "error",
        title: "Error archiving task",
        body: "Failed to archive the task. Please try again.",
      });
      setTimeout(() => setAlert(null), 4000);
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
        setAlert({
          variant: "success",
          title: "Task updated successfully",
          body: "Your changes have been saved.",
        });
        setTimeout(() => setAlert(null), 4000);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      setAlert({
        variant: "error",
        title: "Error updating task",
        body: "Failed to update the task. Please try again.",
      });
      setTimeout(() => setAlert(null), 4000);
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

  const handleRestoreTask = async (taskId: number) => {
    try {
      const response = await restoreTask({ id: taskId });
      // Repository returns response.data directly, so check for response.data (the actual task)
      if (response?.data) {
        const restoredTask = response.data;
        // Update the task in the list with restored status
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: TaskStatus.OPEN } : task
          )
        );
        setAlert({
          variant: "success",
          title: "Task restored successfully",
          body: `"${restoredTask.title}" has been restored.`,
        });
        setTimeout(() => setAlert(null), 4000);
      }
    } catch (error) {
      console.error("Error restoring task:", error);
      setAlert({
        variant: "error",
        title: "Error restoring task",
        body: "Failed to restore the task. Please try again.",
      });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const handleHardDeleteTask = async (taskId: number) => {
    const taskToHardDelete = tasks.find((t) => t.id === taskId);
    try {
      await hardDeleteTask({ id: taskId });
      // Remove the task from the list completely
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setAlert({
        variant: "success",
        title: "Task deleted permanently",
        body: `"${taskToHardDelete?.title}" has been permanently deleted.`,
      });
      setTimeout(() => setAlert(null), 4000);
    } catch (error) {
      console.error("Error permanently deleting task:", error);
      setAlert({
        variant: "error",
        title: "Error deleting task",
        body: "Failed to delete the task. Please try again.",
      });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  // Define how to get the group key for each task
  const getTaskGroupKey = (
    task: TaskModel,
    field: string
  ): string | string[] => {
    switch (field) {
      case "status":
        return (
          STATUS_DISPLAY_MAP[task.status as TaskStatus] ||
          task.status ||
          "Unknown"
        );
      case "priority":
        return task.priority || "No Priority";
      case "assignees":
        if (task.assignees && task.assignees.length > 0) {
          // Return array of assignee names - task will appear in multiple groups
          return task.assignees.map(
            (assigneeId: number | string | ITaskAssignee) => {
              const assigneeIdValue =
                typeof assigneeId === "object"
                  ? assigneeId.user_id
                  : assigneeId;
              const user = users.find((u) => u.id === Number(assigneeIdValue));
              return user ? `${user.name} ${user.surname}`.trim() : "Unknown";
            }
          );
        }
        return "Unassigned";
      case "due_date":
        return task.due_date
          ? new Date(task.due_date).toLocaleDateString()
          : "No Due Date";
      default:
        return "Other";
    }
  };

  // Use the reusable grouping hook
  const groupedTasks = useTableGrouping({
    data: filteredTasks,
    groupByField: groupBy,
    sortOrder: groupSortOrder,
    getGroupKey: getTaskGroupKey,
  });

  // Export columns and data
  const exportColumns = useMemo(() => {
    return [
      { id: "title", label: "Title" },
      { id: "status", label: "Status" },
      { id: "priority", label: "Priority" },
      { id: "assignees", label: "Assignees" },
      { id: "due_date", label: "Due Date" },
      { id: "creator", label: "Creator" },
      { id: "categories", label: "Categories" },
    ];
  }, []);

  const exportData = useMemo(() => {
    return filteredTasks.map((task: TaskModel) => {
      // Look up assignee names from user IDs
      const assigneeNames =
        task.assignees && task.assignees.length > 0
          ? task.assignees
              .map((assigneeId: number | string | ITaskAssignee) => {
                const assigneeIdValue =
                  typeof assigneeId === "object"
                    ? assigneeId.user_id
                    : assigneeId;
                const user = users.find(
                  (u) => u.id === Number(assigneeIdValue)
                );
                return user ? `${user.name} ${user.surname}`.trim() : null;
              })
              .filter(Boolean)
              .join(", ") || "Unassigned"
          : "Unassigned";

      // Look up creator name from creator_id
      const creatorUser = users.find((u) => u.id === task.creator_id);
      const creatorName = creatorUser
        ? `${creatorUser.name} ${creatorUser.surname}`.trim()
        : "-";

      return {
        title: task.title || "-",
        status:
          STATUS_DISPLAY_MAP[task.status as TaskStatus] || task.status || "-",
        priority: task.priority || "-",
        assignees: assigneeNames,
        due_date: task.due_date
          ? new Date(task.due_date).toLocaleDateString()
          : "-",
        creator: creatorName,
        categories: task.categories?.join(", ") || "-",
      };
    });
  }, [filteredTasks, users]);

  return (
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />

      {/* Page Header */}
      <Stack sx={vwhomeBody}>
        <PageHeader
          title="Task management"
          description="This table includes a list of tasks assigned to team members. You can create and manage all tasks here."
          rightContent={
            <HelperIcon
              articlePath="ai-governance/task-management"
              size="small"
            />
          }
        />
      </Stack>

      {/* Tips */}
      <TipBox entityName="tasks" />

      {/* Summary Cards */}
      <TaskSummaryCards summary={summary} />

      {/* Filter Controls */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        data-joyride-id="task-filters"
      >
        <Stack direction="row" gap={2} alignItems="center">
          {/* FilterBy */}
          <FilterBy
            columns={taskFilterColumns}
            onFilterChange={handleTaskFilterChange}
          />

          {/* GroupBy */}
          <GroupBy
            options={[
              { id: "status", label: "Status" },
              { id: "priority", label: "Priority" },
              { id: "assignees", label: "Assignees" },
              { id: "due_date", label: "Due date" },
            ]}
            onGroupChange={handleGroupChange}
          />

          {/* SearchBox */}
          <Box data-joyride-id="task-search">
            <SearchBox
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={setSearchQuery}
              inputProps={{ "aria-label": "Search tasks" }}
              fullWidth={false}
            />
          </Box>

          {/* Include archived toggle */}
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            data-joyride-id="include-archived-toggle"
          >
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              fontWeight={500}
              fontSize={"13px"}
            >
              Include archived
            </Typography>
            <Toggle
              checked={includeArchived}
              onChange={(_, checked) => setIncludeArchived(checked)}
            />
          </Stack>
        </Stack>

        {/* Right side: Export and Add button */}
        <Stack
          direction="row"
          gap="8px"
          alignItems="center"
          data-joyride-id="add-task-button"
        >
          <ExportMenu
            data={exportData}
            columns={exportColumns}
            filename="tasks"
            title="Task Management"
          />
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
          <GroupedTableView
            groupedData={groupedTasks}
            ungroupedData={filteredTasks}
            renderTable={(data, options) => (
              <TasksTable
                tasks={data}
                users={users}
                onArchive={handleArchiveTask}
                onEdit={handleEditTask}
                onStatusChange={handleTaskStatusChange}
                statusOptions={TASK_STATUS_OPTIONS.map((status) => {
                  const displayStatus =
                    STATUS_DISPLAY_MAP[status as TaskStatus] || status;
                  return displayStatus;
                })}
                isUpdateDisabled={isCreatingDisabled}
                onRowClick={handleEditTask}
                hidePagination={options?.hidePagination}
                onRestore={handleRestoreTask}
                onHardDelete={handleHardDeleteTask}
              />
            )}
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

      {/* Hard Delete Confirmation Dialog */}
      {/* Archive is handled by IconButton component to avoid double modals */}
      {/* Hard delete needs a second confirmation in Tasks page */}

      {/* Notification Toast */}
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body || ""}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}

      {/* Page Tour */}
      <PageTour steps={TasksSteps} run={true} tourKey="tasks-tour" />
    </Stack>
  );
};

export default Tasks;
