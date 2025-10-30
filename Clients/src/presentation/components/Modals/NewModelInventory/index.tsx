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
  Stack,
  Box,
  Switch,
  FormControlLabel,
  Autocomplete,
  TextField,
  Typography,
} from "@mui/material";
import { lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
const DatePicker = lazy(() => import("../../Inputs/Datepicker"));
import SelectComponent from "../../Inputs/Select";
import { ChevronDown } from "lucide-react";
import StandardModal from "../StandardModal";
import { ModelInventoryStatus } from "../../../../domain/enums/modelInventory.enum";
import { getAllEntities } from "../../../../application/repository/entity.repository";
import { User } from "../../../../domain/types/User";
import dayjs, { Dayjs } from "dayjs";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";
import modelInventoryOptions from "../../../utils/model-inventory.json";
import { getAllProjects } from "../../../../application/repository/project.repository";
import { Project } from "../../../../domain/types/Project";

interface NewModelInventoryProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: NewModelInventoryFormValues) => void;
  onError?: (error: any) => void;
  initialData?: NewModelInventoryFormValues;
  isEdit?: boolean;
}

interface NewModelInventoryFormValues {
  provider_model?: string; // Keep for backward compatibility
  provider: string;
  model: string;
  version: string;
  approver: number;
  capabilities: string[];
  security_assessment: boolean;
  status: ModelInventoryStatus;
  status_date: string;
  reference_link: string;
  biases: string;
  limitations: string;
  hosting_provider: string;
  used_in_projects: string[];
}

interface NewModelInventoryFormErrors {
  provider_model?: string; // Keep for backward compatibility
  provider?: string;
  model?: string;
  version?: string;
  approver?: string;
  capabilities?: string;
  status?: string;
  status_date?: string;
  used_in_projects?: string;
}

const initialState: NewModelInventoryFormValues = {
  provider_model: "", // Keep for backward compatibility
  provider: "",
  model: "",
  version: "",
  approver: 0,
  capabilities: [],
  security_assessment: false,
  status: ModelInventoryStatus.PENDING,
  status_date: new Date().toISOString().split("T")[0],
  reference_link: "",
  biases: "",
  limitations: "",
  hosting_provider: "",
  used_in_projects: [],
};

const statusOptions = [
  { _id: ModelInventoryStatus.APPROVED, name: "Approved" },
  { _id: ModelInventoryStatus.RESTRICTED, name: "Restricted" },
  { _id: ModelInventoryStatus.PENDING, name: "Pending" },
  { _id: ModelInventoryStatus.BLOCKED, name: "Blocked" },
];

const capabilityOptions = [
  "Vision",
  "Caching",
  "Tools",
  "Code",
  "Multimodal",
  "Audio",
  "Video",
  "Text Generation",
  "Translation",
  "Summarization",
  "Question Answering",
  "Sentiment Analysis",
  "Named Entity Recognition",
  "Image Classification",
  "Object Detection",
  "Speech Recognition",
  "Text-to-Speech",
  "Recommendation",
  "Anomaly Detection",
  "Forecasting",
];

const NewModelInventory: FC<NewModelInventoryProps> = ({
  isOpen,
  setIsOpen,
  onSuccess,
  onError,
  initialData,
  isEdit = false,
}) => {
  const theme = useTheme();
  const [values, setValues] = useState<NewModelInventoryFormValues>(
    initialData || initialState
  );
  const [errors, setErrors] = useState<NewModelInventoryFormErrors>({});
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && users.length > 0) {
      // If we have initialData and users are loaded, set the values
      setValues(initialData);
    } else if (initialData && !isEdit) {
      // If we have initialData but no users yet, set values temporarily
      setValues(initialData);
    } else if (!isEdit) {
      // If not editing, set initial state
      setValues(initialState);
    }
  }, [initialData, isEdit, users]);

  useEffect(() => {
    if (!isOpen) {
      setValues(initialState);
      setErrors({});
    }
  }, [isOpen]);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await getAllEntities({ routeUrl: "/users" });
      if (response?.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const [projectList, setProjects] = useState<Project[]>([]);
  const [, setProjectsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
        const response = await getAllProjects();
        if (response?.data) {
          setProjects(response.data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const combinedList = useMemo(() => {
    const targetFrameworks = ["ISO 42001", "ISO 27001"];

    return projectList.flatMap((project) => {
      // Get enabled framework names for this project
      const enabledFrameworks = project.framework?.map((f) => f.name) || [];

      // Only include target frameworks that are enabled
      return targetFrameworks
        .filter((fw) => enabledFrameworks.includes(fw))
        .map((fw) => `${project.project_title.trim()} - ${fw}`);
    });
  }, [projectList]);

  // Transform users to the format expected by SelectComponent
  const userOptions = useMemo(() => {
    return users.map((user) => ({
      _id: user.id,
      name: `${user.name} ${user.surname}`,
      email: user.email,
    }));
  }, [users]);

  const modelInventoryList = useMemo(() => {
    return modelInventoryOptions.map(
      (u: { model: string; provider: string }) => ({
        _id: u.model,
        name: `${u.provider} - ${u.model}`,
        surname: u.model,
        email: u.model,
      })
    );
  }, []);

  const handleOnTextFieldChange = useCallback(
    (prop: keyof NewModelInventoryFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setValues((prev) => ({ ...prev, [prop]: value }));
        setErrors((prev) => ({ ...prev, [prop]: "" }));
      },
    []
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof NewModelInventoryFormValues) => (event: any) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [prop]: value }));
      setErrors((prev) => ({ ...prev, [prop]: "" }));
    },
    []
  );

  const handleCapabilityChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string[]) => {
      setValues((prev) => ({ ...prev, capabilities: newValue }));
      setErrors((prev) => ({ ...prev, capabilities: "" }));
    },
    []
  );

  const handleSelectUsedInProjectChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string[]) => {
      setValues((prev) => ({ ...prev, used_in_projects: newValue }));
      setErrors((prev) => ({ ...prev, used_in_projects: "" }));
    },
    []
  );

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prev) => ({
        ...prev,
        status_date: newDate ? newDate.format("YYYY-MM-DD") : "",
      }));
      setErrors((prev) => ({ ...prev, status_date: "" }));
    }
  }, []);

  const handleSecurityAssessmentChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({
        ...prev,
        security_assessment: event.target.checked,
      }));
    },
    []
  );

  const validateForm = (): boolean => {
    const newErrors: NewModelInventoryFormErrors = {};

    if (!values.provider || !String(values.provider).trim()) {
      newErrors.provider = "Provider is required.";
    }

    if (!values.model || !String(values.model).trim()) {
      newErrors.model = "Model is required.";
    }

    if (!values.version || !String(values.version).trim()) {
      newErrors.version = "Version is required.";
    }

    if (!values.approver || !String(values.approver).trim()) {
      newErrors.approver = "Approver is required.";
    }

    if (!values.status) {
      newErrors.status = "Status is required.";
    }

    if (!values.status_date) {
      newErrors.status_date = "Status date is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useModalKeyHandling({
    isOpen,
    onClose: handleClose,
  });

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        if (onSuccess) {
          await onSuccess({
            ...values,
            capabilities: values.capabilities,
            security_assessment: values.security_assessment,
          });
        }
        handleClose();
      } catch (error: any) {
        setIsSubmitting(false);
        // Handle server-side validation errors
        let errorData = null;
        
        // Check if it's an axios error with response.data first
        if (error?.response?.data) {
          errorData = error.response.data;
        }
        // Check if it's a CustomException with response property
        else if (error?.response) {
          errorData = error.response;
        }
        // Check if the error itself has the data structure
        else if (error?.status && error?.errors) {
          errorData = error;
        }

        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const serverErrors: NewModelInventoryFormErrors = {};
          
          errorData.errors.forEach((err: any) => {
            if (err.field && err.message) {
              // Map server field names to form field names
              const fieldName = err.field as keyof NewModelInventoryFormErrors;
              serverErrors[fieldName] = err.message;
            }
          });
          
          setErrors(serverErrors);
        }
        
        // Propagate error to parent for toast notification
        if (onError) {
          onError(error);
        }
      }
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

  // Styles for Autocomplete (following ProjectForm approach)
  const capabilitiesRenderInputStyle = {
    "& .MuiOutlinedInput-root": {
      paddingTop: "3.8px !important",
      paddingBottom: "3.8px !important",
    },
    "& ::placeholder": {
      fontSize: 13,
    },
  };

  const capabilitiesSxStyle = {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      borderRadius: "2px",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#d0d5dd",
        borderWidth: "1px",
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#d0d5dd",
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#d0d5dd",
        borderWidth: "1px",
      },
    },
    "& .MuiChip-root": {
      borderRadius: "4px",
    },
  };

  const capabilitiesSlotProps = {
    paper: {
      sx: {
        "& .MuiAutocomplete-listbox": {
          "& .MuiAutocomplete-option": {
            fontSize: 13,
            fontWeight: 400,
            color: "#1c2130",
            paddingLeft: "9px",
            paddingRight: "9px",
          },
          "& .MuiAutocomplete-option.Mui-focused": {
            background: "#f9fafb",
          },
        },
        "& .MuiAutocomplete-noOptions": {
          fontSize: 13,
          fontWeight: 400,
          paddingLeft: "9px",
          paddingRight: "9px",
        },
      },
    },
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Model" : "Add a new model"}
      description={
        isEdit
          ? "Update model details, approval status, and metadata"
          : "Register a new AI model with comprehensive metadata and approval tracking"
      }
      onSubmit={handleSubmit}
      submitButtonText={isEdit ? "Update Model" : "Save"}
      isSubmitting={isSubmitting}
      maxWidth="760px"
    >
      <Stack spacing={6}>
        {/* First Row: Provider, Model, Version */}
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          spacing={6}
        >
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="provider"
                    label="Provider"
                    width={220}
                    value={values.provider}
                    onChange={handleOnTextFieldChange("provider")}
                    error={errors.provider}
                    isRequired
                    sx={fieldStyle}
                    placeholder="eg. OpenAI"
                  />
                </Suspense>
                <Suspense fallback={<div>Loading...</div>}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      width: 220,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 2,
                        fontWeight: 450,
                        color: theme.palette.text.primary,
                      }}
                    >
                      Model{" "}
                      <Typography component="span" color="black">
                        *
                      </Typography>
                    </Typography>
                    <Autocomplete
                      id="model-input"
                      size="small"
                      freeSolo
                      value={values.model}
                      options={modelInventoryList || []}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.name
                      }
                      onChange={(_event, newValue) => {
                        // Handle both option object and free text
                        if (typeof newValue === "string") {
                          setValues({ ...values, model: newValue });
                        } else if (newValue && typeof newValue === "object") {
                          setValues({ ...values, model: newValue.name });
                        } else {
                          setValues({ ...values, model: "" });
                        }
                      }}
                      onInputChange={(_event, newInputValue, reason) => {
                        if (reason === "input") {
                          setValues({ ...values, model: newInputValue });
                        }
                      }}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: theme.palette.text.primary,
                              }}
                            >
                              {option.name}
                            </Typography>
                          </Box>
                        );
                      }}
                      popupIcon={<i data-lucide="chevron-downa"></i>}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select or enter model"
                          error={Boolean(errors.model)}
                          helperText={errors.model}
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: 34,
                              minHeight: 34,
                              borderRadius: 2,
                            },
                            "& .MuiInputBase-input": {
                              padding: "0 8px",
                              fontSize: 13,
                            },
                          }}
                        />
                      )}
                      // noOptionsText="No matching models"
                      filterOptions={(options, state) => {
                        const filtered = options.filter((option) =>
                          option.name
                            .toLowerCase()
                            .includes(state.inputValue.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return [];
                        }

                        return filtered;
                      }}
                      slotProps={{
                        paper: {
                          sx: {
                            "& .MuiAutocomplete-listbox": {
                              "& .MuiAutocomplete-option": {
                                fontSize: 13,
                                color: theme.palette.text.primary,
                                padding: "8px 12px",
                              },
                              "& .MuiAutocomplete-option.Mui-focused": {
                                backgroundColor:
                                  theme.palette.background.accent,
                              },
                            },
                          },
                        },
                      }}
                      disabled={isLoadingUsers}
                    />
                  </Box>
                </Suspense>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="version"
                    label="Version"
                    width={220}
                    value={values.version}
                    onChange={handleOnTextFieldChange("version")}
                    error={errors.version}
                    isRequired
                    sx={fieldStyle}
                    placeholder="e.g., 4.0, 1.5"
                  />
          </Suspense>
        </Stack>

        {/* Second Row: Approver, Status, Status Date */}
        <Stack
          direction={"row"}
          justifyContent={"flex-start"}
          spacing={6}
        >
                <SelectComponent
                  id="approver"
                  label="Approver"
                  value={values.approver}
                  error={errors.approver}
                  isRequired
                  sx={{ width: 220 }}
                  items={userOptions}
                  onChange={handleOnSelectChange("approver")}
                  placeholder="Select approver"
                  disabled={isLoadingUsers}
                />
                <SelectComponent
                  items={statusOptions}
                  value={values.status}
                  error={errors.status}
                  sx={{ width: 220 }}
                  id="status"
                  label="Status"
                  isRequired
                  onChange={handleOnSelectChange("status")}
                  placeholder="Select status"
                />
                <Suspense fallback={<div>Loading...</div>}>
                  <DatePicker
                    label="Status date"
                    date={
                      values.status_date
                        ? dayjs(values.status_date)
                        : dayjs(new Date())
                    }
                    handleDateChange={handleDateChange}
                    sx={{
                      width: 220,
                      backgroundColor: theme.palette.background.main,
                    }}
                    isRequired
                    error={errors.status_date}
                  />
          </Suspense>
        </Stack>

        {/* Capabilities Section */}
        <Stack>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 400,
                    mb: theme.spacing(2),
                    color: theme.palette.text.secondary,
                  }}
                >
                  Capabilities
                </Typography>
                <Autocomplete
                  multiple
                  id="capabilities-input"
                  size="small"
                  value={values.capabilities}
                  options={capabilityOptions}
                  onChange={handleCapabilityChange}
                  getOptionLabel={(option) => option}
                  noOptionsText={
                    values.capabilities.length === capabilityOptions.length
                      ? "All capabilities selected"
                      : "No options"
                  }
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        <Typography sx={{ fontSize: 13, fontWeight: 400 }}>
                          {option}
                        </Typography>
                      </Box>
                    );
                  }}
                  filterSelectedOptions
                  popupIcon={<ChevronDown />}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!!errors.capabilities}
                      placeholder="Select capabilities"
                      sx={capabilitiesRenderInputStyle}
                    />
                  )}
                  sx={{
                    backgroundColor: theme.palette.background.main,
                    ...capabilitiesSxStyle,
                  }}
                  slotProps={capabilitiesSlotProps}
                />
                {errors.capabilities && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      color: "#f04438",
                      fontWeight: 300,
                      fontSize: 11,
                    }}
                  >
              {errors.capabilities}
            </Typography>
          )}
        </Stack>

        <Stack>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 400,
                    mb: theme.spacing(2),
                    color: theme.palette.text.secondary,
                  }}
                >
                  Used in projects
                </Typography>
                <Autocomplete
                  multiple
                  id="projects-framework"
                  size="small"
                  value={values.used_in_projects}
                  options={combinedList}
                  onChange={handleSelectUsedInProjectChange}
                  getOptionLabel={(option) => option}
                  noOptionsText={
                    values.used_in_projects.length === combinedList.length
                      ? "All projects selected"
                      : "No options"
                  }
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        <Typography sx={{ fontSize: 13, fontWeight: 400 }}>
                          {option}
                        </Typography>
                      </Box>
                    );
                  }}
                  filterSelectedOptions
                  popupIcon={<ChevronDown size={16} />}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!!errors.used_in_projects}
                      placeholder="Select projects-framework"
                      sx={capabilitiesRenderInputStyle}
                    />
                  )}
                  sx={{
                    backgroundColor: theme.palette.background.main,
                    ...capabilitiesSxStyle,
                  }}
                  slotProps={capabilitiesSlotProps}
                />
                {errors.used_in_projects && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      color: "#f04438",
                      fontWeight: 300,
                      fontSize: 11,
                    }}
                  >
              {errors.used_in_projects}
            </Typography>
          )}
        </Stack>

        <Stack direction={"row"} spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="reference_link"
                    label="Reference link"
                    width={"50%"}
                    value={values.reference_link}
                    onChange={handleOnTextFieldChange("reference_link")}
                    sx={fieldStyle}
                    placeholder="eg. www.org.ca"
                  />
                </Suspense>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="biases"
                    label="Biases"
                    width={"50%"}
                    value={values.biases}
                    onChange={handleOnTextFieldChange("biases")}
                    sx={fieldStyle}
                    placeholder="Biases"
                  />
          </Suspense>
        </Stack>

        <Stack direction={"row"} spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="hosting_provider"
                    label="Hosting provider"
                    value={values.hosting_provider}
                    width={"50%"}
                    onChange={handleOnTextFieldChange("hosting_provider")}
                    sx={fieldStyle}
                    placeholder="eg. OpenAI"
                  />
                </Suspense>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="limitations"
                    label="Limitations"
                    width={"50%"}
                    value={values.limitations}
                    onChange={handleOnTextFieldChange("limitations")}
                    sx={fieldStyle}
                    placeholder="Limitation"
                  />
          </Suspense>
        </Stack>

        {/* Security Assessment Section */}
        <Stack>
                <FormControlLabel
                  control={
                    <Switch
                      checked={values.security_assessment}
                      onChange={handleSecurityAssessmentChange}
                      color="success"
                      sx={{
                        "&.Mui-checked": {
                          color: "#13715B",
                        },
                      }}
                      disableRipple
                      disableFocusRipple
                      disableTouchRipple
                    />
                  }
                  label="Security assessment is complete for this model"
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontSize: 13,
                      fontWeight: 400,
                      color: theme.palette.text.primary,
                    },
            }}
          />
        </Stack>
      </Stack>
    </StandardModal>
  );
};

export default NewModelInventory;
