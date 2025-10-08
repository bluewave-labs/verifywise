import React, {
  FC,
  useState,
  useMemo,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import {
  Modal,
  Stack,
  Box,
  Typography,
  TextField,
} from "@mui/material";
import { lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
const DatePicker = lazy(() => import("../../Inputs/Datepicker"));
import SelectComponent from "../../Inputs/Select";
import { Save as SaveIcon } from "lucide-react";
import CustomizableButton from "../../Button/CustomizableButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import {
  ModelRiskCategory,
  ModelRiskLevel,
  ModelRiskStatus,
  IModelRiskFormData
} from "../../../../domain/interfaces/i.modelRisk";
import { getAllEntities } from "../../../../application/repository/entity.repository";
import { getAllUsers } from "../../../../application/repository/user.repository";
import { User } from "../../../../domain/types/User";
import dayjs, { Dayjs } from "dayjs";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";

interface NewModelRiskProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: IModelRiskFormData) => void;
  initialData?: IModelRiskFormData;
  isEdit?: boolean;
}

interface NewModelRiskFormErrors {
  risk_name?: string;
  risk_category?: string;
  risk_level?: string;
  status?: string;
  owner?: string;
  target_date?: string;
  description?: string;
  mitigation_plan?: string;
  impact?: string;
}

const initialState: IModelRiskFormData = {
  risk_name: "",
  risk_category: ModelRiskCategory.PERFORMANCE,
  risk_level: ModelRiskLevel.MEDIUM,
  status: ModelRiskStatus.OPEN,
  owner: "",
  target_date: new Date().toISOString().split("T")[0],
  description: "",
  mitigation_plan: "",
  impact: "",
};

const riskCategoryOptions = [
  { _id: ModelRiskCategory.PERFORMANCE, name: "Performance" },
  { _id: ModelRiskCategory.BIAS, name: "Bias & fairness" },
  { _id: ModelRiskCategory.SECURITY, name: "Security" },
  { _id: ModelRiskCategory.DATA_QUALITY, name: "Data quality" },
  { _id: ModelRiskCategory.COMPLIANCE, name: "Compliance" },
];

const riskLevelOptions = [
  { _id: ModelRiskLevel.LOW, name: "Low" },
  { _id: ModelRiskLevel.MEDIUM, name: "Medium" },
  { _id: ModelRiskLevel.HIGH, name: "High" },
  { _id: ModelRiskLevel.CRITICAL, name: "Critical" },
];

const statusOptions = [
  { _id: ModelRiskStatus.OPEN, name: "Open" },
  { _id: ModelRiskStatus.IN_PROGRESS, name: "In Progress" },
  { _id: ModelRiskStatus.RESOLVED, name: "Resolved" },
  { _id: ModelRiskStatus.ACCEPTED, name: "Accepted" },
];

const NewModelRisk: FC<NewModelRiskProps> = ({
  isOpen,
  setIsOpen,
  onSuccess,
  initialData,
  isEdit = false,
}) => {
  // const theme = useTheme();
  const [values, setValues] = useState<IModelRiskFormData>(
    initialData || initialState
  );
  const [errors, setErrors] = useState<NewModelRiskFormErrors>({});
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (initialData) {
      setValues(initialData);
    } else if (!isEdit) {
      setValues(initialState);
    }
  }, [initialData, isEdit]);

  useEffect(() => {
    if (!isOpen) {
      setValues(initialState);
      setErrors({});
    } else if (isOpen && initialData) {
      // When modal opens with initial data, set it immediately
      setValues(initialData);
    }
  }, [isOpen, initialData]);

  // Fetch users and models when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchModels();
    }
  }, [isOpen]);

  // Transform owner ID to proper format when editing a model risk
  useEffect(() => {
    if (initialData && users && users.length > 0 && isEdit) {
      const ownerUser = users.find((user) => String(user.id) === String(initialData.owner));
      if (ownerUser) {
        setValues(prev => ({
          ...prev,
          owner: String(ownerUser.id),
        }));
      }
    }
  }, [initialData, users, isEdit]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await getAllUsers();
      // Handle both direct array and {message, data} format
      let userData: any[] = [];
      if (Array.isArray(response)) {
        userData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        userData = response.data;
      } else {
        console.warn("Unexpected user data format:", response);
        userData = [];
      }
      setUsers(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await getAllEntities({ routeUrl: "/modelInventory" });
      // Handle both direct array and {message, data} format
      let modelsData = [];
      if (Array.isArray(response)) {
        modelsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        modelsData = response.data;
      } else if (response) {
        modelsData = response;
      } else {
        console.warn("Unexpected models data format:", response);
        modelsData = [];
      }
      setModels(modelsData);
    } catch (error) {
      console.error("Error fetching models:", error);
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Transform users to the format expected by SelectComponent
  const userOptions = useMemo(() => {
    return users.map((user) => ({
      _id: String(user.id), // Convert to string to match database format
      name: `${user.name} ${user.surname}`,
      email: user.email,
    }));
  }, [users]);

  // Transform models to the format expected by SelectComponent
  const modelOptions = useMemo(() => {
    return [
      { _id: "", name: "None (General Risk)" },
      ...models.map((model) => ({
        _id: model.id,
        name: `${model.provider} ${model.model} ${model.version || ""}`.trim(),
      }))
    ];
  }, [models]);

  const handleOnTextFieldChange = useCallback(
    (prop: keyof IModelRiskFormData) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setValues((prev) => ({ ...prev, [prop]: value }));
        setErrors((prev) => ({ ...prev, [prop]: "" }));
      },
    []
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof IModelRiskFormData) => (event: any) => {
      const value = event.target.value;
      if (prop === "model_id" && value === "") {
        // Allow clearing the model selection - explicitly set to null
        setValues((prev) => ({ ...prev, [prop]: null }));
        setErrors((prev) => ({ ...prev, [prop]: "" }));
        return;
      }
      setValues((prev) => ({ ...prev, [prop]: value }));
      setErrors((prev) => ({ ...prev, [prop]: "" }));
    },
    []
  );

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prev) => ({
        ...prev,
        targetDate: newDate ? newDate.format("YYYY-MM-DD") : "",
      }));
      setErrors((prev) => ({ ...prev, targetDate: "" }));
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: NewModelRiskFormErrors = {};

    if (!values.risk_name || !String(values.risk_name).trim()) {
      newErrors.risk_name = "Risk name is required.";
    }

    if (!values.risk_category) {
      newErrors.risk_category = "Risk category is required.";
    }

    if (!values.risk_level) {
      newErrors.risk_level = "Risk level is required.";
    }

    if (!values.status) {
      newErrors.status = "Status is required.";
    }

    if (!values.owner || !String(values.owner).trim()) {
      newErrors.owner = "Owner is required.";
    }

    if (!values.target_date) {
      newErrors.target_date = "Target date is required.";
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
        onSuccess(values);
      }
      handleClose();
    }
  };

  const fieldStyle = {
    backgroundColor: "#FFFFFF",
    "& input": {
      padding: "0 14px",
    },
  };

  const textAreaStyle = {
    backgroundColor: "#FFFFFF",
    "& .MuiOutlinedInput-root": {
      borderRadius: "4px",
      fontSize: "13px",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#D0D5DD",
        borderWidth: "1px",
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#D0D5DD",
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#888",
        borderWidth: "1px",
      },
    },
    "& .MuiOutlinedInput-input::placeholder": {
      fontSize: "13px",
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
        gap={8}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "fit-content",
          maxHeight: "80vh",
          backgroundColor: "#FCFCFD",
          borderRadius: "4px",
          padding: 10,
          maxWidth: "760px",
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <form onSubmit={handleSubmit}>
          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{ fontSize: 16, color: "#344054", fontWeight: "bold" }}
            >
              {isEdit ? "Edit Model Risk" : "Add a new model risk"}
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
                color: "#98A2B3",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
            >
              <CloseIcon />
            </Box>
          </Stack>

          <Stack sx={{ gap: 8 }}>
              {/* First Row: Risk Name, Category, Risk Level */}
              <Stack
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="riskName"
                    label="Risk name"
                    width={220}
                    value={values.risk_name}
                    onChange={handleOnTextFieldChange("risk_name")}
                    error={errors.risk_name}
                    isRequired
                    sx={fieldStyle}
                    placeholder="e.g., Model accuracy decline"
                  />
                </Suspense>
                <SelectComponent
                  id="riskCategory"
                  label="Risk category"
                  value={values.risk_category}
                  error={errors.risk_category}
                  isRequired
                  sx={{ width: 220 }}
                  items={riskCategoryOptions}
                  onChange={handleOnSelectChange("risk_category")}
                  placeholder="Select category"
                />
                <SelectComponent
                  id="riskLevel"
                  label="Risk level"
                  value={values.risk_level}
                  error={errors.risk_level}
                  isRequired
                  sx={{ width: 220 }}
                  items={riskLevelOptions}
                  onChange={handleOnSelectChange("risk_level")}
                  placeholder="Select risk level"
                />
              </Stack>

              {/* Second Row: Status, Owner, Target Date */}
              <Stack
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <SelectComponent
                  id="status"
                  label="Status"
                  value={values.status}
                  error={errors.status}
                  isRequired
                  sx={{ width: 220 }}
                  items={statusOptions}
                  onChange={handleOnSelectChange("status")}
                  placeholder="Select status"
                />
                <SelectComponent
                  id="owner"
                  label="Owner"
                  value={values.owner}
                  error={errors.owner}
                  isRequired
                  sx={{ width: 220 }}
                  items={userOptions}
                  onChange={handleOnSelectChange("owner")}
                  placeholder="Select owner"
                  disabled={isLoadingUsers}
                />
                <Suspense fallback={<div>Loading...</div>}>
                  <DatePicker
                    label="Target date"
                    date={
                      values.target_date
                        ? dayjs(values.target_date)
                        : dayjs(new Date())
                    }
                    handleDateChange={handleDateChange}
                    sx={{
                      width: 220,
                      backgroundColor: "#FFFFFF",
                    }}
                    isRequired
                    error={errors.target_date}
                  />
                </Suspense>
              </Stack>

              {/* Third Row: Model (Optional) */}
              <Stack
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <SelectComponent
                  id="modelId"
                  label="Associated model (optional)"
                  value={values.model_id ?? ""}
                  sx={{ width: 220 }}
                  items={modelOptions}
                  onChange={handleOnSelectChange("model_id")}
                  placeholder="Select model"
                  disabled={isLoadingModels}
                />
              </Stack>

              {/* Description Section */}
              <Stack>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    mb: 2,
                  }}
                >
                  Description
                </Typography>
                <TextField
                  multiline
                  rows={2}
                  value={values.description}
                  onChange={handleOnTextFieldChange("description")}
                  placeholder="Describe the risk in detail"
                  error={!!errors.description}
                  helperText={errors.description}
                  sx={textAreaStyle}
                />
              </Stack>

              {/* Impact Section */}
              <Stack>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    mb: 2,
                  }}
                >
                  Impact
                </Typography>
                <TextField
                  multiline
                  rows={2}
                  value={values.impact}
                  onChange={handleOnTextFieldChange("impact")}
                  placeholder="Describe the potential impact of this risk"
                  error={!!errors.impact}
                  helperText={errors.impact}
                  sx={textAreaStyle}
                />
              </Stack>

              {/* Mitigation Plan Section */}
              <Stack>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    mb: 2,
                  }}
                >
                  Mitigation plan
                </Typography>
                <TextField
                  multiline
                  rows={2}
                  value={values.mitigation_plan}
                  onChange={handleOnTextFieldChange("mitigation_plan")}
                  placeholder="Describe the plan to mitigate this risk"
                  error={!!errors.mitigation_plan}
                  helperText={errors.mitigation_plan}
                  sx={textAreaStyle}
                />
              </Stack>
            </Stack>

          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              mt: 6,
            }}
          >
            <CustomizableButton
              variant="contained"
              text={isEdit ? "Update Risk" : "Save"}
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
              }}
              onClick={handleSubmit}
              icon={<SaveIcon size={16} />}
            />
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
};

export default NewModelRisk;