import React, {
  FC,
  useState,
  useCallback,
  useEffect,
  Suspense,
  useMemo,
} from "react";
import {
  useTheme,
  Modal,
  Stack,
  Typography,
  Autocomplete,
  TextField,
  Box,
} from "@mui/material";
import { lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
const DatePicker = lazy(() => import("../../Inputs/Datepicker"));
import SelectComponent from "../../Inputs/Select";
import { ReactComponent as GreyDownArrowIcon } from "../../../assets/icons/chevron-down-grey.svg";
import { ReactComponent as SaveIcon } from "../../../assets/icons/save.svg";
import CustomizableButton from "../../Button/CustomizableButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { TaskPriority, ITask } from "../../../../domain/interfaces/i.task";
import dayjs, { Dayjs } from "dayjs";
import { datePickerStyle } from "../../Forms/ProjectForm/style";
import useUsers from "../../../../application/hooks/useUsers";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";
import { checkStringValidation } from "../../../../application/validations/stringValidation";

interface CreateTaskProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: CreateTaskFormValues) => void;
  initialData?: ITask;
  mode?: "create" | "edit";
}

interface CreateTaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string;
  assignees: Array<{
    id: number;
    name: string;
    surname: string;
    email: string;
  }>;
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
  mode = "create",
}) => {
  const theme = useTheme();
  const { users } = useUsers();
  const [values, setValues] = useState<CreateTaskFormValues>(initialState);
  const [errors, setErrors] = useState<CreateTaskFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setValues(initialState);
      setErrors({});
      setIsSubmitting(false);
    } else if (isOpen && mode === "edit" && initialData) {
      setValues({
        title: initialData.title,
        description: initialData.description || "",
        priority: initialData.priority,
        due_date: initialData.due_date
          ? dayjs(initialData.due_date).format("YYYY-MM-DD")
          : "",
        assignees: (() => {
          if (!initialData.assignees || !users) return [];

          // Debug: Log the actual data structure
          console.log("Initial assignees data:", initialData.assignees);
          console.log("Users data:", users);

          // Handle both possible data structures
          return initialData.assignees
            .map((assignee) => {
              // If assignee is a string/number (user ID)
              if (
                typeof assignee === "string" ||
                typeof assignee === "number"
              ) {
                const user = users.find((u) => u.id === Number(assignee));
                return user
                  ? {
                      id: user.id,
                      name: user.name,
                      surname: user.surname || "",
                      email: user.email,
                    }
                  : null;
              }
              // If assignee is an ITaskAssignee object
              else if (
                assignee &&
                typeof assignee === "object" &&
                "user_id" in assignee
              ) {
                const user = users.find(
                  (u) => u.id === Number(assignee.user_id)
                );
                return user
                  ? {
                      id: user.id,
                      name: user.name,
                      surname: user.surname || "",
                      email: user.email,
                    }
                  : null;
              }
              return null;
            })
            .filter(
              (
                user
              ): user is {
                id: number;
                name: string;
                surname: string;
                email: string;
              } => user !== null
            );
        })(),
        categories: initialData.categories || [],
      });
    } else {
      setValues(initialState);
    }
  }, [isOpen, mode, initialData, users]);

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

    const title = checkStringValidation("Task title", values.title, 1, 64);
    if (!title.accepted) {
      newErrors.title = title.message;
    }

    const description = checkStringValidation(
      "Description",
      values.description,
      0,
      256
    );
    if (!description.accepted) {
      newErrors.description = description.message;
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

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        if (onSuccess) {
          // Convert assignees back to string array for API
          const formattedValues = {
            ...values,
            assignees: values.assignees.map((user) => String(user.id)),
          };
          await onSuccess(formattedValues as any);
        }
        handleClose();
      } catch (error) {
        console.error("Error submitting task:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Add modal key handling
  useModalKeyHandling({
    isOpen,
    onClose: handleClose,
  });

  // Create consistent field style
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
    <Modal
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason !== "backdropClick") {
          handleClose();
        }
      }}
    >
      <Stack
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "fit-content",
          maxWidth: "760px",
          maxHeight: "90vh",
          backgroundColor: theme.palette.background.modal,
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          padding: theme.spacing(10),
          gap: theme.spacing(10),
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
              id="task-form-title"
              sx={{ fontSize: 16, color: "#344054", fontWeight: "bold" }}
            >
              {mode === 'edit' ? 'Edit task' : 'Create new task'}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#344054" }}>
              {mode === "edit"
                ? "Update task details and assign team members."
                : "Create a new task by filling in the following details."}
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
              sx={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {/* Row 1: Task Title and Assignees */}
              <Stack direction="row" sx={{ gap: 8 }}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="title"
                    label="Task title"
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

              <Suspense fallback={<div>Loading...</div>}>
                <Stack gap={theme.spacing(2)}>
                  <Typography
                    component="p"
                    variant="body1"
                    color={theme.palette.text.secondary}
                    fontWeight={500}
                    fontSize={"13px"}
                    sx={{ margin: 0, height: "22px" }}
                  >
                    Assignees
                  </Typography>
                  <Autocomplete
                    multiple
                    id="assignees-input"
                    size="small"
                    value={values.assignees}
                    options={
                      users?.map((user) => ({
                        id: user.id,
                        name: user.name,
                        surname: user.surname || "",
                        email: user.email,
                      })) || []
                    }
                    onChange={handleAssigneesChange}
                    getOptionLabel={(user) =>
                      `${user.name} ${user.surname}`.trim()
                    }
                    renderOption={(props, option) => {
                      const { key, ...optionProps } = props;
                      const userEmail =
                        option.email.length > 30
                          ? `${option.email.slice(0, 30)}...`
                          : option.email;
                      return (
                        <Box component="li" key={key} {...optionProps}>
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
                    noOptionsText={
                      values.assignees.length === users?.length
                        ? "All members selected"
                        : "No options"
                    }
                    filterSelectedOptions
                    popupIcon={<GreyDownArrowIcon />}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select assignees"
                        error={!!errors.assignees}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            paddingTop: "3.8px !important",
                            paddingBottom: "3.8px !important",
                          },
                          "& ::placeholder": {
                            fontSize: "13px",
                          },
                        }}
                      />
                    )}
                    sx={{
                      width: "350px",
                      backgroundColor: theme.palette.background.main,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "5px",
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#777",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#888",
                          borderWidth: "1px",
                        },
                      },
                      "& .MuiChip-root": {
                        borderRadius: theme.shape.borderRadius,
                      },
                    }}
                    slotProps={{
                      paper: {
                        sx: {
                          "& .MuiAutocomplete-listbox": {
                            "& .MuiAutocomplete-option": {
                              fontSize: "13px",
                              color: "#1c2130",
                              paddingLeft: "9px",
                              paddingRight: "9px",
                            },
                            "& .MuiAutocomplete-option.Mui-focused": {
                              background: "#f9fafb",
                            },
                          },
                          "& .MuiAutocomplete-noOptions": {
                            fontSize: "13px",
                            paddingLeft: "9px",
                            paddingRight: "9px",
                          },
                        },
                      },
                    }}
                  />
                </Stack>
              </Suspense>
            </Stack>

              {/* Row 2: Due Date and Categories */}
              <Stack direction="row" sx={{ gap: 8, alignItems: "flex-start" }}>
                <Suspense fallback={<div>Loading...</div>}>
                  <DatePicker
                    label="Due date"
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

                <Suspense fallback={<div>Loading...</div>}>
                  <Stack
                    gap={theme.spacing(2)}
                  >
                    <Typography
                      component="p"
                      variant="body1"
                      color={theme.palette.text.secondary}
                      fontWeight={500}
                      fontSize={"13px"}
                      sx={{ margin: 0, height: '22px' }}
                    >
                      Categories
                    </Typography>
                    <Autocomplete
                      multiple
                      id="categories-input"
                      size="small"
                      freeSolo
                      value={values.categories}
                      options={[]}
                      onChange={(_event, newValue: string[]) => {
                        setValues((prevValues) => ({
                          ...prevValues,
                          categories: newValue,
                        }));
                        setErrors((prev) => ({ ...prev, categories: "" }));
                      }}
                      getOptionLabel={(option: string) => option}
                      filterSelectedOptions
                      popupIcon={<GreyDownArrowIcon />}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Enter categories"
                          error={!!errors.categories}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              minHeight: "34px",
                              height: "auto",
                              alignItems: "flex-start",
                              paddingY: "3px !important",
                              flexWrap: "wrap",
                              gap: "2px",
                            },
                            "& ::placeholder": {
                              fontSize: "13px",
                            },
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              const value = input.value.trim();
                              if (value && !values.categories.includes(value)) {
                                setValues((prevValues) => ({
                                  ...prevValues,
                                  categories: [...prevValues.categories, value],
                                }));
                                input.value = '';
                              }
                            }
                          }}
                        />
                      )}
                      sx={{
                        width: "350px",
                        backgroundColor: theme.palette.background.main,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "3px",
                          overflowY: "auto",
                          flexWrap: "wrap",
                          maxHeight: "115px",
                          alignItems: "flex-start",
                          "&:hover": {
                            "& .MuiOutlinedInput-notchedOutline": {
                              border: "none",
                            },
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            border: "none",
                          },
                          "&.Mui-focused": {
                            "& .MuiOutlinedInput-notchedOutline": {
                              border: "none",
                            },
                          },
                        },
                        "& .MuiAutocomplete-tag": {
                          margin: "2px",
                          maxWidth: "calc(100% - 25px)",
                          "& .MuiChip-label": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          },
                        },
                        border: errors.categories
                          ? `1px solid #f04438`
                          : `1px solid ${theme.palette.border.dark}`,
                        borderRadius: "3px",
                        opacity: errors.categories ? 0.8 : 1,
                      }}
                      slotProps={{
                        paper: {
                          sx: {
                            display: 'none'
                          }
                        }
                      }}
                    />
                    {errors.categories && (
                      <Typography
                        color="error"
                        variant="caption"
                        sx={{ mt: 0.5, ml: 1, color: "#f04438", opacity: 0.8 }}
                      >
                        {errors.categories}
                      </Typography>
                    )}
                  </Stack>
                </Suspense>
              </Stack>

            {/* Row 3: Priority and Description */}
            <Stack direction="row" sx={{ gap: 8 }}>
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

              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="description"
                  label="Description"
                  width="350px"
                  type="description"
                  value={values.description}
                  onChange={handleOnTextFieldChange("description")}
                  error={errors.description}
                  sx={fieldStyle}
                  placeholder="Enter description"
                />
              </Suspense>
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
              variant="contained"
              text={mode === "edit" ? "Update Task" : "Create Task"}
              isDisabled={isSubmitting}
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
