/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  FC,
  useState,
  useMemo,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import {
  Stack,
  Typography,
  TextField,
} from "@mui/material";
import { lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
const DatePicker = lazy(() => import("../../Inputs/Datepicker"));
import SelectComponent from "../../Inputs/Select";
import StandardModal from "../StandardModal";
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
  const [values, setValues] = useState<IModelRiskFormData>(
    initialData || initialState
  );
  const [errors, setErrors] = useState<NewModelRiskFormErrors>({});
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setValues(initialData);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchModels();
    }
  }, [isOpen]);

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
      let userData: any[] = [];
      if (Array.isArray(response)) {
        userData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        userData = response.data;
      }
      setUsers(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await getAllEntities({ routeUrl: "/modelInventory" });
      let modelsData: any[] = [];
      if (Array.isArray(response)) {
        modelsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        modelsData = response.data;
      }
      setModels(modelsData);
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const userOptions = useMemo(() => {
    return users.map((user) => ({
      _id: String(user.id),
      name: `${user.firstName} ${user.lastName}`.trim() || user.email,
    }));
  }, [users]);

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
        target_date: newDate ? newDate.format("YYYY-MM-DD") : "",
      }));
      setErrors((prev) => ({ ...prev, target_date: "" }));
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

  const handleSubmit = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      if (onSuccess) {
        onSuccess(values);
      }
      setIsSubmitting(false);
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
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Model Risk" : "Add a new model risk"}
      description={
        isEdit
          ? "Update risk details, mitigation plan, and tracking information"
          : "Document and track potential risks associated with AI models"
      }
      onSubmit={handleSubmit}
      submitButtonText={isEdit ? "Update Risk" : "Save"}
      isSubmitting={isSubmitting}
      maxWidth="760px"
    >
      <Stack spacing={6}>
        {/* First Row: Risk Name, Category, Risk Level */}
        <Stack direction="row" spacing={6}>
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
        <Stack direction="row" spacing={6}>
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
        <Stack direction="row" spacing={6}>
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
    </StandardModal>
  );
};

export default NewModelRisk;
