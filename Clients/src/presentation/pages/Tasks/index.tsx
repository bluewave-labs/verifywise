import React, { useState, useEffect, useContext, useMemo } from "react";
import { 
  Box, Stack, Typography, TextField, InputAdornment, 
  Collapse, Paper, Checkbox, FormControlLabel, Chip, Divider,
  Select as MuiSelect, MenuItem, ListItemText
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import CustomizableButton from "../../vw-v2-components/Buttons";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { ITask, TaskStatus, TaskPriority, TaskSummary } from "../../../domain/interfaces/i.task";
import { getAllTasks, createTask } from "../../../application/repository/task.repository";
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
  
  const { userRoleName } = useContext(VerifyWiseContext);
  const { users } = useUsers();
  const isCreatingDisabled = !userRoleName || !["Admin", "Editor"].includes(userRoleName);

  // Calculate summary from tasks data
  const summary: TaskSummary = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter(task => task.status === TaskStatus.OPEN).length,
    inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(task => task.status === TaskStatus.COMPLETED).length,
    overdue: tasks.filter(task => task.status === TaskStatus.OVERDUE).length,
  }), [tasks]);

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const response = await getAllTasks({});
        setTasks(response.data?.tasks || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleCreateTask = () => {
    if (isCreatingDisabled) {
      console.log('User does not have permission to create tasks');
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
        console.log('Task created successfully:', response.data);
      }
    } catch (error) {
      console.error('Error creating task:', error);
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
            <Stack direction="row" alignItems="center" spacing={1} sx={{ cursor: 'pointer' }}>
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
                      control={<Checkbox size="small" />}
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
                      control={<Checkbox size="small" />}
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
                  value={[]}
                  renderValue={() => 'Select assignees...'}
                  size="small"
                  displayEmpty
                  sx={{ minWidth: 160, fontSize: 14 }}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      <Checkbox size="small" />
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
                  sx={{ minWidth: 160, fontSize: 14 }}
                />
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
                  size="small"
                  sx={{ width: 300 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  placeholder="mm/dd/yyyy"
                  type="date"
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
              Showing {tasks.length} tasks
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
                          sx={{
                            fontSize: 11,
                            height: 24,
                            fontWeight: 500,
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
                            }`
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
    </Box>
  );
};

export default Tasks;