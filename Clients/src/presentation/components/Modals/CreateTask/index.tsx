import React, {
  FC,
  useState,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import {
  useTheme,
  Modal,
  Stack,
  Box,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import { lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
const DatePicker = lazy(() => import("../../Inputs/Datepicker"));
import SelectComponent from "../../Inputs/Select";
import { ReactComponent as SaveIcon } from "../../../assets/icons/save.svg";
import CustomizableButton from "../../Button/CustomizableButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { TaskPriority, ITask } from "../../../../domain/interfaces/i.task";
import dayjs, { Dayjs } from "dayjs";
import { datePickerStyle, teamMembersSxStyle, teamMembersSlotProps, teamMembersRenderInputStyle } from "../../Forms/ProjectForm/style";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import useUsers from "../../../../application/hooks/useUsers";

interface CreateTaskProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: CreateTaskFormValues) => void;
  initialData?: ITask;
  mode?: 'create' | 'edit';
}

interface CreateTaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string;
  assignees: Array<{ _id: number; name: string; surname: string; email: string }>;
  categories: string[];
}

interface CreateTaskFormErrors {
  title?: string;
  description?: string;
  priority?: string;
  due_date?: string;
  assignees?: string;
  categories?: string;
}

const initialState: CreateTaskFormValues = {
  title: "",
  description: "",
  priority: TaskPriority.MEDIUM,
  due_date: "",
  assignees: [],
  categories: [],
};

const priorityOptions = [
  { _id: TaskPriority.LOW, name: "Low" },
  { _id: TaskPriority.MEDIUM, name: "Medium" },
  { _id: TaskPriority.HIGH, name: "High" },
];

const CreateTask: FC<CreateTaskProps> = ({
  isOpen,
  setIsOpen,
  onSuccess,
  initialData,
  mode = 'create',
}) => {
  const theme = useTheme();
  const { users } = useUsers();
  const [values, setValues] = useState<CreateTaskFormValues>(initialState);
  const [errors, setErrors] = useState<CreateTaskFormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      setValues(initialState);
      setErrors({});
    } else if (isOpen && mode === 'edit' && initialData) {
      setValues({
        title: initialData.title,
        description: initialData.description || "",
        priority: initialData.priority,
        due_date: initialData.due_date ? dayjs(initialData.due_date).format('YYYY-MM-DD') : "",
        assignees: initialData.assignees?.map(assigneeId => {
          const user = users?.find(u => u.id === Number(assigneeId));
          return user ? {
            _id: user.id,
            name: user.name,
            surname: user.surname || '',
            email: user.email
          } : null;
        }).filter((user): user is { _id: number; name: string; surname: string; email: string } => user !== null) || [],
        categories: initialData.categories || [],
      });
    } else {
      setValues(initialState);
    }
  }, [isOpen, mode, initialData]);

  const handleOnTextFieldChange = useCallback(
    (prop: keyof CreateTaskFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setValues((prev) => ({ ...prev, [prop]: value }));
        setErrors((prev) => ({ ...prev, [prop]: "" }));
      },
    []
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof CreateTaskFormValues) => (event: any) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [prop]: value }));
      setErrors((prev) => ({ ...prev, [prop]: "" }));
    },
    []
  );

  const handleAssigneesChange = useCallback(
    (_event: React.SyntheticEvent, newValue: any[]) => {
      setValues((prevValues) => ({
        ...prevValues,
        assignees: newValue,
      }));
      setErrors((prev) => ({ ...prev, assignees: "" }));
    },
    []
  );

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prev) => ({
        ...prev,
        due_date: newDate ? newDate.toISOString().split("T")[0] : "",
      }));
      setErrors((prev) => ({ ...prev, due_date: "" }));
    }
  }, []);


  const validateForm = (): boolean => {
    const newErrors: CreateTaskFormErrors = {};

    if (!values.title || !values.title.trim()) {
      newErrors.title = "Task title is required.";
    }


    if (!values.priority) {
      newErrors.priority = "Priority is required.";
    }

    if (!values.due_date) {
      newErrors.due_date = "Due date is required.";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (validateForm()) {
      if (onSuccess) {
        // Convert assignees back to string array for API
        const formattedValues = {
          ...values,
          assignees: values.assignees.map(user => String(user._id)),
        };
        onSuccess(formattedValues as any);
      }
      handleClose();
    }
  };


  return (
    <Modal open={isOpen} onClose={handleClose}>
      <Stack
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "fit-content",
          maxWidth: "760px",
          maxHeight: "90vh",
          backgroundColor: "#FCFCFD",
          borderRadius: "4px",
          boxShadow: 24,
          padding: 10,
          gap: 10,
          overflowY: "auto",
          "&:focus": {
            outline: "none",
          },
        }}
      >
        {/* Header */}
        <Stack
          className="vwtask-form-header"
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Stack className="vwtask-form-header-text">
            <Typography
              sx={{ fontSize: 16, color: "#344054", fontWeight: "bold" }}
            >
              {mode === 'edit' ? 'Edit Task' : 'Create New Task'}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#344054" }}>
              {mode === 'edit' 
                ? 'Update task details and assign team members.' 
                : 'Create a new task by filling in the following details.'}
            </Typography>
          </Stack>
          <CloseIcon
            style={{ color: "#98A2B3", cursor: "pointer" }}
            onClick={handleClose}
          />
        </Stack>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
            <Stack
              className="vwtask-form-body"
              sx={{ display: "flex", flexDirection: "row", gap: 8 }}
            >
              <Stack className="vwtask-form-body-start" sx={{ gap: 8 }}>
              {/* Title */}
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="title"
                  label="Task Title"
                  width="350px"
                  value={values.title}
                  onChange={handleOnTextFieldChange("title")}
                  error={errors.title}
                  isRequired
                  sx={{
                    backgroundColor: theme.palette.background.main,
                    "& input": {
                      padding: "0 14px",
                    },
                  }}
                  placeholder="Enter task title"
                />
              </Suspense>
                        {/* Due Date */}
              <Suspense fallback={<div>Loading...</div>}>
                <DatePicker
                  label="Due Date"
                  date={values.due_date ? dayjs(values.due_date) : null}
                  handleDateChange={handleDateChange}
                  sx={{
                    ...datePickerStyle,
                    width: "350px",
                    backgroundColor: theme.palette.background.main,
                  }}
                  isRequired
                  error={errors.due_date}
                />
              </Suspense>

            
              {/* Priority */}
              <SelectComponent
                items={priorityOptions}
                value={values.priority}
                error={errors.priority}
                sx={{ 
                  width: "350px",
                  backgroundColor: theme.palette.background.main,
                }}
                id="priority"
                label="Priority"
                isRequired
                onChange={handleOnSelectChange("priority")}
                placeholder="Select priority"
              />
              
    
              </Stack>

              <Stack className="vwtask-form-body-end" sx={{ gap: 8 }}>

              {/* Assignees */}
              <Suspense fallback={<div>Loading...</div>}>
                <Stack>
                  <Typography
                    sx={{
                      fontSize: theme.typography.fontSize,
                      fontWeight: 500,
                      mb: 2,
                    }}
                  >
                    Assignees
                  </Typography>
                  <Autocomplete
                    multiple
                    id="assignees-input"
                    size="small"
                    value={values.assignees.map((user) => ({
                      _id: Number(user._id),
                      name: user.name,
                      surname: user.surname,
                      email: user.email,
                    }))}
                    options={
                      users
                        ?.filter(
                          (user) =>
                            !values.assignees.some(
                              (selectedUser) =>
                                String(selectedUser._id) === String(user.id)
                            )
                        )
                        .map((user) => ({
                          _id: user.id,
                          name: user.name,
                          surname: user.surname || '',
                          email: user.email,
                        })) || []
                    }
                    noOptionsText={
                      values.assignees.length === users?.length
                        ? "All users selected"
                        : "No options"
                    }
                    onChange={handleAssigneesChange}
                    getOptionLabel={(user) => `${user.name} ${user.surname}`.trim()}
                    renderOption={(props, option) => {
                      const { key, ...optionProps } = props;
                      const userEmail =
                        option.email.length > 30
                          ? `${option.email.slice(0, 30)}...`
                          : option.email;
                      return (
                        <Box key={key} component="li" {...optionProps}>
                          <Typography sx={{ fontSize: "13px" }}>
                            {option.name} {option.surname}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: "rgb(157, 157, 157)",
                              position: "absolute",
                              right: "9px",
                            }}
                          >
                            {userEmail}
                          </Typography>
                        </Box>
                      );
                    }}
                    filterSelectedOptions
                    popupIcon={<KeyboardArrowDown />}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select assignees"
                        error={!!errors.assignees}
                        sx={{ fontSize: '13px' }}
                      />
                    )}
                    sx={{
                      backgroundColor: theme.palette.background.main,
                      ...teamMembersSxStyle,
                      width: "350px",
                    }}
                    slotProps={teamMembersSlotProps}
                  />
                </Stack>
              </Suspense>

              {/* Categories */}
              <Stack>
                <Typography
                  sx={{
                    fontSize: theme.typography.fontSize,
                    fontWeight: 500,
                    mb: 2,
                  }}
                >
                  Categories
                </Typography>
                <Autocomplete
                  multiple
                  id="categories-input"
                  size="small"
                  value={values.categories.map(cat => ({ _id: cat, name: cat }))}
                  options={[]}
                  freeSolo
                  onChange={(_, newValue) => {
                    const categories = newValue.map(item => 
                      typeof item === 'string' ? item : item.name
                    );
                    setValues(prev => ({ ...prev, categories }));
                  }}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Typography sx={{ fontSize: "13px" }}>
                        {typeof option === 'string' ? option : option.name}
                      </Typography>
                    </Box>
                  )}
                  filterSelectedOptions
                  popupIcon={<KeyboardArrowDown />}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Press Enter to add categories"
                      sx={teamMembersRenderInputStyle}
                    />
                  )}
                  sx={{
                    backgroundColor: theme.palette.background.main,
                    ...teamMembersSxStyle,
                    width: "350px",
                  }}
                  slotProps={teamMembersSlotProps}
                />
              </Stack>
                {/* Description */}
              <Stack>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    mb: theme.spacing(2),
                    color: theme.palette.text.secondary,
                  }}
                >
                  Description
                </Typography>
                <TextField
                  id="description"
                  value={values.description}
                  onChange={handleOnTextFieldChange("description")}
                  error={!!errors.description}
                  helperText={errors.description}
                  multiline
                  rows={3}
                  sx={{
                    backgroundColor: theme.palette.background.main,
                    width: "350px",
                    "& input": {
                      padding: "0 14px",
                    },
                  }}
                />
              </Stack>

              </Stack>
            </Stack>

            {/* Form Actions */}
            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={2}
              sx={{ pt: 2, mt: 4 }}
            >
              <CustomizableButton
                variant="outlined"
                text="Cancel"
                onClick={handleClose}
                sx={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D0D5DD",
                  color: "#344054",
                  gap: 2,
                  "&:hover": {
                    backgroundColor: "#F9F9F9",
                    border: "1px solid #D0D5DD",
                  },
                }}
              />
              <CustomizableButton
                variant="contained"
                text={mode === 'edit' ? 'Update Task' : 'Create Task'}
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                  marginTop: 2,
                }}
                onClick={handleSubmit}
                icon={<SaveIcon />}
              />
            </Stack>
          </form>
      </Stack>
    </Modal>
  );
};

export default CreateTask;