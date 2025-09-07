import React, { useState, useEffect, useContext, useMemo } from "react";
import { 
  Box, Stack, Typography, TextField, InputAdornment, 
  Collapse, Paper, Checkbox, FormControlLabel, Chip, Divider,
  Select as MuiSelect, MenuItem, ListItemText, SelectChangeEvent,
  IconButton, Menu, Dialog, DialogTitle, DialogContent, DialogActions,
  Button
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CustomizableButton from "../../vw-v2-components/Buttons";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { ITask, TaskStatus, TaskPriority, TaskSummary } from "../../../domain/interfaces/i.task";
import { getAllTasks, createTask, updateTask, deleteTask, updateTaskStatus } from "../../../application/repository/task.repository";
import HeaderCard from "../../components/Cards/DashboardHeaderCard";
import CreateTask from "../../components/Modals/CreateTask";
import Select from "../../components/Inputs/Select";
import useUsers from "../../../application/hooks/useUsers";
import { vwhomeHeading, vwhomeHeaderCards, vwhomeBody, vwhomeBodyControls } from "../Home/1.0Home/style";

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ITask | null>(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusMenuTaskId, setStatusMenuTaskId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<TaskPriority[]>([]);
  const [assigneeFilters, setAssigneeFilters] = useState<number[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  
  const { userRoleName } = useContext(VerifyWiseContext);
  const { users } = useUsers();
  const isCreatingDisabled = !userRoleName || !["Admin", "Editor"].includes(userRoleName);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return statusFilters.length > 0 || 
           priorityFilters.length > 0 || 
           assigneeFilters.length > 0 || 
           categoryFilters.length > 0 || 
           dueDateFrom !== "" || 
           dueDateTo !== "";
  }, [statusFilters, priorityFilters, assigneeFilters, categoryFilters, dueDateFrom, dueDateTo]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate summary from tasks data
  const summary: TaskSummary = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter(task => task.status === TaskStatus.OPEN).length,
    inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(task => task.status === TaskStatus.COMPLETED).length,
    overdue: tasks.filter(task => task.status === TaskStatus.OVERDUE).length,
  }), [tasks]);

  // Fetch tasks when component mounts or any filter changes
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const response = await getAllTasks({
          search: debouncedSearchQuery || undefined,
          status: statusFilters.length > 0 ? statusFilters : undefined,
          priority: priorityFilters.length > 0 ? priorityFilters : undefined,
          assignee: assigneeFilters.length > 0 ? assigneeFilters : undefined,
          category: categoryFilters.length > 0 ? categoryFilters : undefined,
          due_date_start: dueDateFrom || undefined,
          due_date_end: dueDateTo || undefined
        });
        setTasks(response.data?.tasks || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [debouncedSearchQuery, statusFilters, priorityFilters, assigneeFilters, categoryFilters, dueDateFrom, dueDateTo]);

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
        setTasks(prev => [response.data, ...prev]);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleEditTask = (task: ITask) => {
    setEditingTask(task);
  };

  const handleDeleteTask = (task: ITask) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      await deleteTask({ id: taskToDelete.id! });
      setTasks(prev => prev.filter(task => task.id !== taskToDelete.id));
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateTask = async (formData: any) => {
    if (!editingTask) return;
    
    try {
      const response = await updateTask({ id: editingTask.id!, body: formData });
      if (response && response.data) {
        setTasks(prev => prev.map(task => 
          task.id === editingTask.id ? response.data : task
        ));
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleQuickStatusUpdate = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const response = await updateTaskStatus({ id: taskId, status: newStatus });
      if (response && response.data) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
      }
      setStatusMenuAnchor(null);
      setStatusMenuTaskId(null);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Stack sx={vwhomeBody}>
        <Typography sx={vwhomeHeading}>Tasks</Typography>
        <Stack sx={vwhomeBodyControls}>
          <CustomizableButton
            variant="contained"
            icon={<AddCircleOutlineIcon />}
            text="Create task"
            isDisabled={isCreatingDisabled}
            onClick={handleCreateTask}
          />
        </Stack>
      </Stack>

      {/* Header Cards */}
      <Stack sx={vwhomeHeaderCards}>
        <HeaderCard title="Tasks" count={summary.total} />
        <HeaderCard title="Overdue" count={summary.overdue} />
        <HeaderCard title="In Progress" count={summary.inProgress} />
        <HeaderCard title="Completed" count={summary.completed} />
      </Stack>

      {/* Search, Filter, and Sort Controls  */}
      <Box sx={{ mt: 3, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <TextField
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              flex: 1,
              mr: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                borderRadius: 2,
              }
            }}
            variant="outlined"
            size="small"
          />
          
          <Stack direction="row" spacing={3} alignItems="center">
            <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <CustomizableButton
                variant="outlined"
                icon={<FilterListIcon />}
                text="Filters"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                sx={{ 
                  backgroundColor: isFiltersOpen ? '#f5f5f5' : 'transparent',
                  minHeight: '36px'
                }}
              />
              {hasActiveFilters && (
                <Box sx={{
                  backgroundColor: '#17b26a',
                  color: 'white',
                  px: 1.2,
                  py: 0.3,
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  minWidth: '40px',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  ml: 0.5
                }}>
                  Active
                </Box>
              )}
            </Box>
            
            <Select
              id="sort-select"
              value="newest"
              items={[
                { _id: "newest", name: "Newest First" },
                { _id: "oldest", name: "Oldest First" },
                { _id: "priority", name: "Priority" },
                { _id: "due_date", name: "Due Date" },
              ]}
              onChange={() => {}}
              getOptionValue={(item: any) => item._id}
              sx={{ minWidth: 150 }}
            />
          </Stack>
        </Stack>
        
        <Collapse in={isFiltersOpen}>
          <Paper sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" p={3} pb={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FilterListIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>Filters</Typography>
            </Stack>
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={1} 
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                setStatusFilters([]);
                setPriorityFilters([]);
                setAssigneeFilters([]);
                setCategoryFilters([]);
                setCategoryInput("");
                setDueDateFrom("");
                setDueDateTo("");
              }}
            >
              <Typography variant="body2" color="text.secondary">Clear All</Typography>
              <CloseIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Stack>
          </Stack>
          
          <Box sx={{ px: 4, pb: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              {/* Status Filter */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" mb={1} color="text.secondary" fontWeight={500}>Status</Typography>
                <Stack spacing={0.5}>
                  {Object.values(TaskStatus).map((status) => (
                    <FormControlLabel
                      key={status}
                      control={
                        <Checkbox
                          checked={statusFilters.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilters([...statusFilters, status]);
                            } else {
                              setStatusFilters(statusFilters.filter(s => s !== status));
                            }
                          }}
                          size="small"
                        />
                      }
                      label={status}
                      sx={{ 
                        '& .MuiFormControlLabel-label': { fontSize: 14 },
                        m: 0
                      }}
                    />
                  ))}
                </Stack>
              </Box>
              
              {/* Priority Filter */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" mb={1} color="text.secondary" fontWeight={500}>Priority</Typography>
                <Stack spacing={0.5}>
                  {Object.values(TaskPriority).map((priority) => (
                    <FormControlLabel
                      key={priority}
                      control={
                        <Checkbox
                          checked={priorityFilters.includes(priority)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPriorityFilters([...priorityFilters, priority]);
                            } else {
                              setPriorityFilters(priorityFilters.filter(p => p !== priority));
                            }
                          }}
                          size="small"
                        />
                      }
                      label={priority}
                      sx={{ 
                        '& .MuiFormControlLabel-label': { fontSize: 14 },
                        m: 0
                      }}
                    />
                  ))}
                </Stack>
              </Box>
              
              {/* Assignee Filter */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" mb={1} color="text.secondary" fontWeight={500}>Assignee</Typography>
                <MuiSelect
                  multiple
                  value={assigneeFilters.map(String)}
                  onChange={(event: SelectChangeEvent<string[]>) => {
                    const value = event.target.value;
                    const numericValues = (typeof value === 'string' ? value.split(',') : value).map(Number);
                    setAssigneeFilters(numericValues);
                  }}
                  renderValue={(selected) =>
                    selected.length === 0 
                      ? 'Select assignees...' 
                      : `${selected.length} selected`
                  }
                  size="small"
                  displayEmpty
                  sx={{ minWidth: 160, fontSize: 14 }}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      <Checkbox checked={assigneeFilters.includes(user.id)} size="small" />
                      <ListItemText 
                        primary={`${user.name} ${user.surname ?? ''}`} 
                        primaryTypographyProps={{ fontSize: 13 }}
                      />
                    </MenuItem>
                  ))}
                </MuiSelect>
              </Box>
              
              {/* Categories Filter */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" mb={1} color="text.secondary" fontWeight={500}>Categories</Typography>
                <TextField
                  placeholder="Enter category..."
                  size="small"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && categoryInput.trim()) {
                      const category = categoryInput.trim();
                      if (!categoryFilters.includes(category)) {
                        setCategoryFilters([...categoryFilters, category]);
                      }
                      setCategoryInput('');
                    }
                  }}
                  sx={{ minWidth: 160, fontSize: 14 }}
                />
                {categoryFilters.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" spacing={0.5} mt={1}>
                    {categoryFilters.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        size="small"
                        onDelete={() => {
                          setCategoryFilters(categoryFilters.filter(cat => cat !== category));
                        }}
                        sx={{ fontSize: 12, height: 24 }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Due Date Range */}
            <Box>
              <Typography variant="body2" mb={2} color="text.secondary" fontWeight={500}>Due Date Range</Typography>
              <Stack direction="row" justifyContent="space-between" sx={{ maxWidth: 700 }}>
                <TextField
                  placeholder="mm/dd/yyyy"
                  type="date"
                  value={dueDateFrom}
                  onChange={(e) => setDueDateFrom(e.target.value)}
                  size="small"
                  sx={{ width: 300 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  placeholder="mm/dd/yyyy"
                  type="date"
                  value={dueDateTo}
                  onChange={(e) => setDueDateTo(e.target.value)}
                  size="small"
                  sx={{ width: 300 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Box>
          </Box>
          </Paper>
        </Collapse>
      </Box>

      {/* Content Area */}
      <Box sx={{ mt: 3 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Loading tasks...</Typography>
          </Box>
        )}
        
        {error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography color="error">Error: {error}</Typography>
          </Box>
        )}
        
        {!isLoading && !error && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {tasks.length} tasks{debouncedSearchQuery ? ` matching "${debouncedSearchQuery}"` : ''}
            </Typography>
            
            {tasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tasks found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your first task to get started!
                </Typography>
                {isCreatingDisabled && (
                  <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    Note: Only Admin and Editor users can create tasks.
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 2, 
                backgroundColor: '#fff',
                overflow: 'hidden'
              }}>
                {/* Table Header */}
                <Box sx={{ 
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e0e0e0',
                  p: 2
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ flex: 3 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Task
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Priority
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Status
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Due Date
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Assignees
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 0.7 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Actions
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Task Rows */}
                {tasks.map((task, index) => (
                  <Box 
                    key={task.id} 
                    sx={{ 
                      borderBottom: index < tasks.length - 1 ? '1px solid #e0e0e0' : 'none',
                      p: 2,
                      '&:hover': {
                        backgroundColor: '#f9fafb'
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {/* Task Info */}
                      <Box sx={{ flex: 3 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          {task.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                          {task.description}
                        </Typography>
                        {task.categories && task.categories.length > 0 && (
                          <Stack direction="row" spacing={0.5} mt={1}>
                            {task.categories.slice(0, 2).map((category) => (
                              <Chip
                                key={category}
                                label={category}
                                size="small"
                                sx={{ 
                                  fontSize: 10, 
                                  height: 20,
                                  backgroundColor: '#f0f9ff',
                                  color: '#0369a1'
                                }}
                              />
                            ))}
                            {task.categories.length > 2 && (
                              <Chip
                                label={`+${task.categories.length - 2}`}
                                size="small"
                                sx={{ 
                                  fontSize: 10, 
                                  height: 20,
                                  backgroundColor: '#f3f4f6',
                                  color: '#6b7280'
                                }}
                              />
                            )}
                          </Stack>
                        )}
                      </Box>

                      {/* Priority */}
                      <Box sx={{ flex: 1 }}>
                        <Chip
                          label={task.priority}
                          size="small"
                          sx={{
                            fontSize: 11,
                            height: 24,
                            fontWeight: 500,
                            backgroundColor: 
                              task.priority === TaskPriority.HIGH ? '#fef2f2' :
                              task.priority === TaskPriority.MEDIUM ? '#fefbf2' : '#f0fdf4',
                            color: 
                              task.priority === TaskPriority.HIGH ? '#dc2626' :
                              task.priority === TaskPriority.MEDIUM ? '#d97706' : '#16a34a',
                            border: `1px solid ${
                              task.priority === TaskPriority.HIGH ? '#fecaca' :
                              task.priority === TaskPriority.MEDIUM ? '#fed7aa' : '#bbf7d0'
                            }`
                          }}
                        />
                      </Box>

                      {/* Status */}
                      <Box sx={{ flex: 1 }}>
                        <Chip
                          label={task.status}
                          size="small"
                          clickable
                          onClick={(event) => {
                            setStatusMenuAnchor(event.currentTarget);
                            setStatusMenuTaskId(task.id!);
                          }}
                          sx={{
                            fontSize: 11,
                            height: 24,
                            fontWeight: 500,
                            cursor: 'pointer',
                            backgroundColor: 
                              task.status === TaskStatus.COMPLETED ? '#f0fdf4' :
                              task.status === TaskStatus.IN_PROGRESS ? '#eff6ff' :
                              task.status === TaskStatus.OVERDUE ? '#fef2f2' : '#f9fafb',
                            color: 
                              task.status === TaskStatus.COMPLETED ? '#16a34a' :
                              task.status === TaskStatus.IN_PROGRESS ? '#2563eb' :
                              task.status === TaskStatus.OVERDUE ? '#dc2626' : '#6b7280',
                            border: `1px solid ${
                              task.status === TaskStatus.COMPLETED ? '#bbf7d0' :
                              task.status === TaskStatus.IN_PROGRESS ? '#bfdbfe' :
                              task.status === TaskStatus.OVERDUE ? '#fecaca' : '#e5e7eb'
                            }`,
                            '&:hover': {
                              opacity: 0.8
                            }
                          }}
                        />
                      </Box>

                      {/* Due Date */}
                      <Box sx={{ flex: 1 }}>
                        {task.due_date ? (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                            {new Date(task.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled" sx={{ fontSize: 12 }}>
                            No due date
                          </Typography>
                        )}
                      </Box>

                      {/* Assignees */}
                      <Box sx={{ flex: 1 }}>
                        {task.assignees && task.assignees.length > 0 ? (
                          <Stack direction="row" spacing={0.5}>
                            {task.assignees.slice(0, 3).map((assigneeId, idx) => {
                              // Find user details from users array (following project members pattern)
                              const user = users.find(u => u.id === Number(assigneeId));
                              const initials = user 
                                ? `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
                                : '?';
                              
                              return (
                                <Box
                                  key={idx}
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    backgroundColor: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 500,
                                    color: '#374151',
                                    border: '2px solid #fff'
                                  }}
                                >
                                  {initials}
                                </Box>
                              );
                            })}
                            {task.assignees.length > 3 && (
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  backgroundColor: '#e5e7eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  fontWeight: 500,
                                  color: '#6b7280',
                                  border: '2px solid #fff'
                                }}
                              >
                                +{task.assignees.length - 3}
                              </Box>
                            )}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.disabled" sx={{ fontSize: 12 }}>
                            Unassigned
                          </Typography>
                        )}
                      </Box>

                      {/* Actions */}
                      <Box sx={{ flex: 0.7 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <IconButton
                            size="small"
                            onClick={() => handleEditTask(task)}
                            sx={{
                              color: '#13715B',
                              backgroundColor: 'transparent',
                              '&:hover': {
                                backgroundColor: '#f0fdf4',
                                color: '#0f5d4f'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTask(task)}
                            sx={{
                              color: '#dc2626',
                              backgroundColor: 'transparent',
                              '&:hover': {
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
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
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteTask}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={() => {
          setStatusMenuAnchor(null);
          setStatusMenuTaskId(null);
        }}
        PaperProps={{
          sx: { minWidth: 160 }
        }}
      >
        {Object.values(TaskStatus).map((status) => (
          <MenuItem 
            key={status}
            onClick={() => statusMenuTaskId && handleQuickStatusUpdate(statusMenuTaskId, status)}
            sx={{ 
              fontSize: 14,
              py: 1,
              '&:hover': {
                backgroundColor: 
                  status === TaskStatus.COMPLETED ? '#f0fdf4' :
                  status === TaskStatus.IN_PROGRESS ? '#eff6ff' :
                  status === TaskStatus.OVERDUE ? '#fef2f2' : '#f9fafb',
              }
            }}
          >
            <Chip
              label={status}
              size="small"
              sx={{
                fontSize: 10,
                height: 22,
                mr: 1.5,
                fontWeight: 500,
                backgroundColor: 
                  status === TaskStatus.COMPLETED ? '#f0fdf4' :
                  status === TaskStatus.IN_PROGRESS ? '#eff6ff' :
                  status === TaskStatus.OVERDUE ? '#fef2f2' : '#f9fafb',
                color: 
                  status === TaskStatus.COMPLETED ? '#16a34a' :
                  status === TaskStatus.IN_PROGRESS ? '#2563eb' :
                  status === TaskStatus.OVERDUE ? '#dc2626' : '#6b7280',
                border: `1px solid ${
                  status === TaskStatus.COMPLETED ? '#bbf7d0' :
                  status === TaskStatus.IN_PROGRESS ? '#bfdbfe' :
                  status === TaskStatus.OVERDUE ? '#fecaca' : '#e5e7eb'
                }`
              }}
            />
            <Typography variant="body2" fontWeight={500}>
              {status}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default Tasks;