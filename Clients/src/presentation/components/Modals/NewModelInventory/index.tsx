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
import SaveIcon from "@mui/icons-material/Save";
import CustomizableButton from "../../Button/CustomizableButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { ModelInventoryStatus } from "../../../../domain/interfaces/i.modelInventory";
import { getAllEntities } from "../../../../application/repository/entity.repository";
import { User } from "../../../../domain/types/User";
import dayjs, { Dayjs } from "dayjs";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";


interface NewModelInventoryProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: NewModelInventoryFormValues) => void;
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
}

const initialState: NewModelInventoryFormValues = {
  provider_model: "", // Keep for backward compatibility
  provider: "",
  model: "",
  version: "",
  approver: -1,
  capabilities: [],
  security_assessment: false,
  status: ModelInventoryStatus.PENDING,
  status_date: new Date().toISOString().split("T")[0],
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

  // Transform users to the format expected by SelectComponent
  const userOptions = useMemo(() => {
    return users.map((user) => ({
      _id: user.id,
      name: `${user.name} ${user.surname}`,
      email: user.email,
    }));
  }, [users]);

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

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prev) => ({
        ...prev,
        status_date: newDate ? newDate.toISOString().split("T")[0] : "",
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

  const handleSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (validateForm()) {
      if (onSuccess) {
        onSuccess({
          ...values,
          capabilities: values.capabilities,
          security_assessment: values.security_assessment,
        });
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
    <Modal 
      open={isOpen} 
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }} 
      sx={{ overflowY: "scroll" }}
    >
      <Stack
        gap={theme.spacing(2)}
        color={theme.palette.text.secondary}
        sx={{
          backgroundColor: "#D9D9D9",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "fit-content",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: theme.palette.background.modal,
          border: 1,
          borderColor: theme.palette.border,
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          p: theme.spacing(15),
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <form onSubmit={handleSubmit}>
          <Stack
            display={"flex"}
            flexDirection={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            marginBottom={theme.spacing(5)}
          >
            <Typography fontSize={16} fontWeight={600}>
              {isEdit ? "Edit Model" : "Add a new model"}
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

          <Box
            sx={{ flex: 1, overflow: "auto", marginBottom: theme.spacing(8) }}
          >
            <Stack gap={theme.spacing(8)}>
              {/* First Row: Provider, Model, Version */}
              <Stack
                direction={"row"}
                justifyContent={"space-between"}
                gap={theme.spacing(8)}
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
                  <Field
                    id="model"
                    label="Model"
                    width={220}
                    value={values.model}
                    onChange={handleOnTextFieldChange("model")}
                    error={errors.model}
                    isRequired
                    sx={fieldStyle}
                    placeholder="eg. GPT-4"
                  />
                </Suspense>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="version"
                    label="Version (if applicable)"
                    width={220}
                    value={values.version}
                    onChange={handleOnTextFieldChange("version")}
                    error={errors.version}
                    sx={fieldStyle}
                    placeholder="e.g., 4.0, 1.5"
                  />
                </Suspense>
              </Stack>

              {/* Second Row: Approver, Status, Status Date */}
              <Stack
                direction={"row"}
                justifyContent={"flex-start"}
                gap={theme.spacing(8)}
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
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Typography sx={{ fontSize: 13, fontWeight: 400 }}>
                        {option}
                      </Typography>
                    </Box>
                  )}
                  filterSelectedOptions
                  popupIcon={<KeyboardArrowDown />}
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
          </Box>

          <Stack
            sx={{
              alignItems: "flex-end",
              marginTop: "auto",
            }}
          >
            <CustomizableButton
              variant="contained"
              text={isEdit ? "Update Model" : "Save"}
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
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

export default NewModelInventory;
