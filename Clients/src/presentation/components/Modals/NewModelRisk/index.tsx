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
  Typography,
  TextField,
} from "@mui/material";
import { lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
const DatePicker = lazy(() => import("../../Inputs/Datepicker"));
import SelectComponent from "../../Inputs/Select";
import SaveIcon from "@mui/icons-material/Save";
import CustomizableButton from "../../Button/CustomizableButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import {
  ModelRiskCategory,
  ModelRiskLevel,
  ModelRiskStatus,
  IModelRiskFormData
} from "../../../../domain/interfaces/i.modelRisk";
import { getAllEntities } from "../../../../application/repository/entity.repository";
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
  riskName?: string;
  riskCategory?: string;
  riskLevel?: string;
  status?: string;
  owner?: string;
  targetDate?: string;
  description?: string;
  mitigationPlan?: string;
  impact?: string;
}

const initialState: IModelRiskFormData = {
  riskName: "",
  riskCategory: ModelRiskCategory.PERFORMANCE,
  riskLevel: ModelRiskLevel.MEDIUM,
  status: ModelRiskStatus.OPEN,
  owner: "",
  targetDate: new Date().toISOString().split("T")[0],
  description: "",
  mitigationPlan: "",
  impact: "",
};

const riskCategoryOptions = [
  { _id: ModelRiskCategory.PERFORMANCE, name: "Performance" },
  { _id: ModelRiskCategory.BIAS, name: "Bias & Fairness" },
  { _id: ModelRiskCategory.SECURITY, name: "Security" },
  { _id: ModelRiskCategory.DATA_QUALITY, name: "Data Quality" },
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
  const theme = useTheme();
  const [values, setValues] = useState<IModelRiskFormData>(
    initialData || initialState
  );
  const [errors, setErrors] = useState<NewModelRiskFormErrors>({});
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (initialData && users.length > 0) {
      setValues(initialData);
    } else if (initialData && !isEdit) {
      setValues(initialData);
    } else if (!isEdit) {
      setValues(initialState);
    }
  }, [initialData, isEdit, users]);

  useEffect(() => {
    if (!isOpen) {
      setValues(initialState);
      setErrors({});
    }
  }, [isOpen]);

  // Fetch users and models when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchModels();
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

  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await getAllEntities({ routeUrl: "/modelInventory" });
      if (response?.data) {
        setModels(response.data);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setIsLoadingModels(false);
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
      setValues((prev) => ({ ...prev, [prop]: value }));
      setErrors((prev) => ({ ...prev, [prop]: "" }));
    },
    []
  );

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prev) => ({
        ...prev,
        targetDate: newDate ? newDate.toISOString().split("T")[0] : "",
      }));
      setErrors((prev) => ({ ...prev, targetDate: "" }));
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: NewModelRiskFormErrors = {};

    if (!values.riskName || !String(values.riskName).trim()) {
      newErrors.riskName = "Risk name is required.";
    }

    if (!values.riskCategory) {
      newErrors.riskCategory = "Risk category is required.";
    }

    if (!values.riskLevel) {
      newErrors.riskLevel = "Risk level is required.";
    }

    if (!values.status) {
      newErrors.status = "Status is required.";
    }

    if (!values.owner || !String(values.owner).trim()) {
      newErrors.owner = "Owner is required.";
    }

    if (!values.targetDate) {
      newErrors.targetDate = "Target date is required.";
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

  const fieldStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.background.main,
      "& input": {
        padding: "0 14px",
      },
    }),
    [theme.palette.background.main]
  );

  const textAreaStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.background.main,
      "& .MuiOutlinedInput-root": {
        borderRadius: theme.shape.borderRadius,
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: theme.palette.border.dark,
          borderWidth: "1px",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: theme.palette.border.dark,
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: theme.palette.border.dark,
          borderWidth: "1px",
        },
      },
    }),
    [theme.palette.background.main, theme.shape.borderRadius, theme.palette.border.dark]
  );

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
              {/* First Row: Risk Name, Category, Risk Level */}
              <Stack
                direction={"row"}
                justifyContent={"space-between"}
                gap={theme.spacing(8)}
              >
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="riskName"
                    label="Risk Name"
                    width={220}
                    value={values.riskName}
                    onChange={handleOnTextFieldChange("riskName")}
                    error={errors.riskName}
                    isRequired
                    sx={fieldStyle}
                    placeholder="e.g., Model accuracy decline"
                  />
                </Suspense>
                <SelectComponent
                  id="riskCategory"
                  label="Risk Category"
                  value={values.riskCategory}
                  error={errors.riskCategory}
                  isRequired
                  sx={{ width: 220 }}
                  items={riskCategoryOptions}
                  onChange={handleOnSelectChange("riskCategory")}
                  placeholder="Select category"
                />
                <SelectComponent
                  id="riskLevel"
                  label="Risk Level"
                  value={values.riskLevel}
                  error={errors.riskLevel}
                  isRequired
                  sx={{ width: 220 }}
                  items={riskLevelOptions}
                  onChange={handleOnSelectChange("riskLevel")}
                  placeholder="Select risk level"
                />
              </Stack>

              {/* Second Row: Status, Owner, Target Date */}
              <Stack
                direction={"row"}
                justifyContent={"flex-start"}
                gap={theme.spacing(8)}
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
                    label="Target Date"
                    date={
                      values.targetDate
                        ? dayjs(values.targetDate)
                        : dayjs(new Date())
                    }
                    handleDateChange={handleDateChange}
                    sx={{
                      width: 220,
                      backgroundColor: theme.palette.background.main,
                    }}
                    isRequired
                    error={errors.targetDate}
                  />
                </Suspense>
              </Stack>

              {/* Third Row: Model (Optional) */}
              <Stack
                direction={"row"}
                justifyContent={"flex-start"}
                gap={theme.spacing(8)}
              >
                <SelectComponent
                  id="modelId"
                  label="Associated Model (Optional)"
                  value={values.modelId || ""}
                  sx={{ width: 220 }}
                  items={modelOptions}
                  onChange={handleOnSelectChange("modelId")}
                  placeholder="Select model"
                  disabled={isLoadingModels}
                />
              </Stack>

              {/* Description Section */}
              <Stack>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 400,
                    mb: theme.spacing(2),
                    color: theme.palette.text.secondary,
                  }}
                >
                  Description
                </Typography>
                <TextField
                  multiline
                  rows={3}
                  value={values.description}
                  onChange={handleOnTextFieldChange("description")}
                  placeholder="Describe the risk in detail..."
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
                    fontWeight: 400,
                    mb: theme.spacing(2),
                    color: theme.palette.text.secondary,
                  }}
                >
                  Impact
                </Typography>
                <TextField
                  multiline
                  rows={3}
                  value={values.impact}
                  onChange={handleOnTextFieldChange("impact")}
                  placeholder="Describe the potential impact of this risk..."
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
                    fontWeight: 400,
                    mb: theme.spacing(2),
                    color: theme.palette.text.secondary,
                  }}
                >
                  Mitigation Plan
                </Typography>
                <TextField
                  multiline
                  rows={3}
                  value={values.mitigationPlan}
                  onChange={handleOnTextFieldChange("mitigationPlan")}
                  placeholder="Describe the plan to mitigate this risk..."
                  error={!!errors.mitigationPlan}
                  helperText={errors.mitigationPlan}
                  sx={textAreaStyle}
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
              text={isEdit ? "Update Risk" : "Save"}
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

export default NewModelRisk;