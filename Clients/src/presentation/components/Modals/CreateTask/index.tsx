import React, {
  FC,
  useState,
  useMemo,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import {
  useTheme,
  Modal,
  Stack,
  Box,
  Chip,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
const DatePicker = lazy(() => import("../../Inputs/Datepicker"));
import SelectComponent from "../../Inputs/Select";
import ReviewerMultiSelect from "../../../vw-v2-components/Selects/ReviewerSelect";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { TaskPriority } from "../../../../domain/interfaces/i.task";
import dayjs, { Dayjs } from "dayjs";

interface CreateTaskProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: CreateTaskFormValues) => void;
}

interface CreateTaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string;
  assignees: string[];
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
}) => {
  const theme = useTheme();
  const [values, setValues] = useState<CreateTaskFormValues>(initialState);
  const [errors, setErrors] = useState<CreateTaskFormErrors>({});
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setValues(initialState);
      setErrors({});
      setNewCategory("");
    }
  }, [isOpen]);

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

  const handleAssigneesChange = useCallback((assignees: string[]) => {
    setValues((prev) => ({ ...prev, assignees }));
    setErrors((prev) => ({ ...prev, assignees: "" }));
  }, []);

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prev) => ({
        ...prev,
        due_date: newDate ? newDate.toISOString().split("T")[0] : "",
      }));
      setErrors((prev) => ({ ...prev, due_date: "" }));
    }
  }, []);

  const handleAddCategory = useCallback(() => {
    const category = newCategory.trim();
    if (category && !values.categories.includes(category)) {
      setValues((prev) => ({
        ...prev,
        categories: [...prev.categories, category],
      }));
      setNewCategory("");
    }
  }, [newCategory, values.categories]);

  const handleRemoveCategory = useCallback((categoryToRemove: string) => {
    setValues((prev) => ({
      ...prev,
      categories: prev.categories.filter(cat => cat !== categoryToRemove),
    }));
  }, []);

  const handleCategoryKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddCategory();
    }
  }, [handleAddCategory]);

  const validateForm = (): boolean => {
    const newErrors: CreateTaskFormErrors = {};

    if (!values.title || !values.title.trim()) {
      newErrors.title = "Task title is required.";
    }

    if (!values.description || !values.description.trim()) {
      newErrors.description = "Task description is required.";
    }

    if (!values.priority) {
      newErrors.priority = "Priority is required.";
    }

    if (!values.due_date) {
      newErrors.due_date = "Due date is required.";
    }

    if (values.assignees.length === 0) {
      newErrors.assignees = "At least one assignee is required.";
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
        onSuccess(values);
      }
      handleClose();
    }
  };

  const fieldStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.background.main,
      "& input": {
        padding: "0 14px",
      },
    }),
    [theme.palette.background.main]
  );

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          maxHeight: "90vh",
          bgcolor: theme.palette.background.main,
          border: 1,
          borderColor: theme.palette.border,
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          p: 4,
          overflowY: "auto",
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontSize={16} fontWeight={600}>
              Create New Task
            </Typography>
            <Box
              component="span"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: "8px",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
            >
              <CloseIcon />
            </Box>
          </Stack>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Title */}
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="title"
                  label="Task Title"
                  width="100%"
                  value={values.title}
                  onChange={handleOnTextFieldChange("title")}
                  error={errors.title}
                  isRequired
                  sx={fieldStyle}
                  placeholder="Enter task title"
                />
              </Suspense>

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
                  Description *
                </Typography>
                <TextField
                  id="description"
                  value={values.description}
                  onChange={handleOnTextFieldChange("description")}
                  error={!!errors.description}
                  helperText={errors.description}
                  placeholder="Enter task description"
                  multiline
                  rows={3}
                  sx={fieldStyle}
                  fullWidth
                />
              </Stack>

              {/* Priority and Due Date */}
              <Stack direction="row" spacing={2}>
                <SelectComponent
                  items={priorityOptions}
                  value={values.priority}
                  error={errors.priority}
                  sx={{ width: 220 }}
                  id="priority"
                  label="Priority"
                  isRequired
                  onChange={handleOnSelectChange("priority")}
                  placeholder="Select priority"
                />
                <Suspense fallback={<div>Loading...</div>}>
                  <DatePicker
                    label="Due Date"
                    date={values.due_date ? dayjs(values.due_date) : null}
                    handleDateChange={handleDateChange}
                    sx={{
                      width: 220,
                      backgroundColor: theme.palette.background.main,
                    }}
                    isRequired
                    error={errors.due_date}
                  />
                </Suspense>
              </Stack>

              {/* Assignees */}
              <ReviewerMultiSelect
                selected={values.assignees}
                setSelected={handleAssigneesChange}
                label="Assignees"
                required
                error={errors.assignees}
              />

              {/* Categories */}
              <Stack>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    mb: theme.spacing(2),
                    color: theme.palette.text.secondary,
                  }}
                >
                  Categories (optional)
                </Typography>
                <Stack direction="row" gap={theme.spacing(2)} alignItems="flex-start">
                  <TextField
                    size="small"
                    placeholder="Add category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={handleCategoryKeyPress}
                    sx={{ 
                      flex: 1,
                      backgroundColor: theme.palette.background.main,
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <CustomizableButton
                            variant="outlined"
                            size="small"
                            icon={<AddIcon />}
                            text="Add"
                            onClick={handleAddCategory}
                            isDisabled={!newCategory.trim()}
                            sx={{ minWidth: 'auto', px: 1 }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
                
                {values.categories.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" spacing={1} mt={2}>
                    {values.categories.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        size="small"
                        onDelete={() => handleRemoveCategory(category)}
                        sx={{ 
                          fontSize: 12, 
                          height: 28,
                          backgroundColor: theme.palette.status?.success?.light || '#f0fdf4',
                          color: theme.palette.status?.success?.text || '#16a34a',
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>

              {/* Form Actions */}
              <Stack
                direction="row"
                justifyContent="flex-end"
                spacing={2}
                sx={{ pt: 2 }}
              >
                <CustomizableButton
                  variant="outlined"
                  text="Cancel"
                  onClick={handleClose}
                />
                <CustomizableButton
                  variant="contained"
                  text="Create Task"
                  sx={{
                    backgroundColor: "#13715B",
                    border: "1px solid #13715B",
                    gap: 2,
                  }}
                  onClick={handleSubmit}
                  icon={<SaveIcon />}
                />
              </Stack>
            </Stack>
          </form>
        </Stack>
      </Box>
    </Modal>
  );
};

export default CreateTask;