import React, { FC, useState, useMemo, useCallback, useEffect } from "react";
import {
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Box,
  Chip,
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Suspense, lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
import SelectComponent from "../../Inputs/Select";
import SaveIcon from "@mui/icons-material/Save";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { ModelInventoryStatus } from "../../../../domain/interfaces/i.modelInventory";
import { getAllEntities } from "../../../../application/repository/entity.repository";
import { User } from "../../../../domain/types/User";

interface NewModelInventoryProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: NewModelInventoryFormValues) => void;
  initialData?: NewModelInventoryFormValues;
  isEdit?: boolean;
}

interface NewModelInventoryFormValues {
  provider_model: string;
  version: string;
  approver: string;
  capabilities: string[];
  security_assessment: boolean;
  status: ModelInventoryStatus;
  status_date: string;
}

interface NewModelInventoryFormErrors {
  provider_model?: string;
  version?: string;
  approver?: string;
  capabilities?: string;
  status?: string;
  status_date?: string;
}

const initialState: NewModelInventoryFormValues = {
  provider_model: "",
  version: "",
  approver: "",
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
      if (initialData.approver) {
        // Check if the approver ID exists in the loaded users
        const approverExists = users.some(
          (user) => user.id.toString() === initialData.approver
        );
        if (approverExists) {
          setValues(initialData);
        }
      } else {
        // If no approver, just set the values
        setValues(initialData);
      }
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
      name: user.name,
      surname: user.surname,
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

  const handleCapabilityChange = useCallback((event: any) => {
    const {
      target: { value },
    } = event;
    const selectedCapabilities =
      typeof value === "string" ? value.split(",") : value;
    setValues((prev) => ({ ...prev, capabilities: selectedCapabilities }));
    setErrors((prev) => ({ ...prev, capabilities: "" }));
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

  const handleCapabilityDelete = useCallback((capabilityToDelete: string) => {
    setValues((prev) => ({
      ...prev,
      capabilities: prev.capabilities.filter(
        (capability) => capability !== capabilityToDelete
      ),
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: NewModelInventoryFormErrors = {};

    if (!values.provider_model || !String(values.provider_model).trim()) {
      newErrors.provider_model = "Provider/Model is required.";
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

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: theme.shape.borderRadius,
          padding: theme.spacing(4),
          boxShadow:
            "0px 8px 8px -4px rgba(16, 24, 40, 0.03), 0px 20px 24px -4px rgba(16, 24, 40, 0.08)",
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack
          spacing={2}
          sx={{
            padding: theme.spacing(4),
          }}
        >
          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <DialogTitle
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: theme.palette.text.primary,
                padding: 0,
              }}
            >
              {isEdit ? "Edit Model" : "New Model"}
            </DialogTitle>
            <Box
              component="span"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              sx={{
                gap: theme.spacing(2),
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
          <DialogContent sx={{ p: 0 }}>
            <Stack sx={{ gap: "16px" }}>
              <Stack direction="row" spacing={2} sx={{ gap: "16px" }}>
                <Box sx={{ width: "60%" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="provider-model"
                      label="Provider/Model"
                      value={values.provider_model}
                      onChange={handleOnTextFieldChange("provider_model")}
                      error={errors.provider_model}
                      isRequired
                      sx={fieldStyle}
                      placeholder="e.g., OpenAI GPT-4, Google Gemini"
                    />
                  </Suspense>
                </Box>
                <Box sx={{ width: "40%" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="version"
                      label="Version"
                      value={values.version}
                      onChange={handleOnTextFieldChange("version")}
                      error={errors.version}
                      sx={fieldStyle}
                      placeholder="e.g., 4.0, 1.5"
                    />
                  </Suspense>
                </Box>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ gap: "16px" }}>
                <Box sx={{ width: "50%" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    {isLoadingUsers ? (
                      <div
                        style={{
                          padding: "16px",
                          textAlign: "center",
                          color: theme.palette.text.secondary,
                          fontSize: "13px",
                        }}
                      >
                        Loading users...
                      </div>
                    ) : (
                      <SelectComponent
                        id="approver"
                        label="Approver"
                        value={values.approver}
                        error={errors.approver}
                        isRequired
                        sx={{ width: "100%" }}
                        items={userOptions}
                        onChange={handleOnSelectChange("approver")}
                        placeholder="Select approver"
                        disabled={isLoadingUsers}
                      />
                    )}
                  </Suspense>
                </Box>
                <Box sx={{ width: "50%" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <SelectComponent
                      items={statusOptions}
                      value={values.status}
                      error={errors.status}
                      sx={{ width: "100%" }}
                      id="status"
                      label="Status"
                      isRequired
                      onChange={handleOnSelectChange("status")}
                      placeholder="Select status"
                    />
                  </Suspense>
                </Box>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ gap: "16px" }}>
                <Box sx={{ width: "50%" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="status-date"
                      label="Status Date"
                      value={values.status_date}
                      onChange={handleOnTextFieldChange("status_date")}
                      error={errors.status_date}
                      isRequired
                      sx={fieldStyle}
                      type="date"
                    />
                  </Suspense>
                </Box>
                <Box
                  sx={{
                    width: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={values.security_assessment}
                        onChange={handleSecurityAssessmentChange}
                        color="primary"
                      />
                    }
                    label="Security Assessment"
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "13px",
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                      },
                    }}
                  />
                </Box>
              </Stack>
              <Box sx={{ width: "100%" }}>
                <FormControl fullWidth error={!!errors.capabilities}>
                  <InputLabel id="capabilities-label">Capabilities</InputLabel>
                  <Select
                    labelId="capabilities-label"
                    multiple
                    value={values.capabilities}
                    onChange={handleCapabilityChange}
                    input={<OutlinedInput label="Capabilities" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={value}
                            size="small"
                            onDelete={() => handleCapabilityDelete(value)}
                            sx={{
                              fontSize: "0.7rem",
                              height: "20px",
                              backgroundColor: "#f5f5f5",
                              color: "#666",
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    sx={{
                      backgroundColor: theme.palette.background.main,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.border.dark,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.border.dark,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.border.dark,
                      },
                    }}
                  >
                    {capabilityOptions.map((capability) => (
                      <MenuItem key={capability} value={capability}>
                        {capability}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.capabilities && (
                    <FormHelperText>{errors.capabilities}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </Stack>
          </DialogContent>
          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <CustomizableButton
              variant="contained"
              text={isEdit ? "Update Model" : "Create Model"}
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
                mt: "16px",
              }}
              onClick={handleSubmit}
              icon={<SaveIcon />}
            />
          </Stack>
        </Stack>
      </form>
    </Dialog>
  );
};

export default NewModelInventory;
