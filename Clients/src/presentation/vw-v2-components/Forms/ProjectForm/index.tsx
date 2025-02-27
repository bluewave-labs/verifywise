import {
  SelectChangeEvent,
  Stack,
  SxProps,
  Theme,
  Typography,
  useTheme,
} from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers/icons";
import { useCallback, useMemo, useState } from "react";
import VWButton from "../../Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Field from "../../../components/Inputs/Field";
import { textfieldStyle } from "./style";
import Select from "../../../components/Inputs/Select";
import useUsers from "../../../../application/hooks/useUsers";
import DatePicker from "../../../components/Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import selectValidation from "../../../../application/validations/selectValidation";

enum RiskClassificationEnum {
  HighRisk = "High risk",
  LimitedRisk = "Limited risk",
  MinimalRisk = "Minimal risk",
}

enum HighRiskRoleEnum {
  Deployer = "Deployer",
  Provider = "Provider",
  Distributor = "Distributor",
  Importer = "Importer",
  ProductManufacturer = "Product manufacturer",
  AuthorizedRepresentative = "Authorized representative",
}

interface FormValues {
  project_title: string;
  owner: number;
  users: number;
  start_date: string;
  ai_risk_classification: number;
  type_of_high_risk_role: number;
  goal: string;
}

interface FormErrors {
  projectTitle?: string;
  users?: string;
  owner?: string;
  startDate?: string;
  riskClassification?: string;
  typeOfHighRiskRole?: string;
  goal?: string;
}

const initialState: FormValues = {
  project_title: "",
  users: 0,
  owner: 0,
  start_date: new Date().toISOString(),
  ai_risk_classification: 0,
  type_of_high_risk_role: 0,
  goal: "",
};

interface VWProjectFormProps {
  onClose: () => void;
  sx?: SxProps<Theme> | undefined;
}

const VWProjectForm = ({ sx, onClose }: VWProjectFormProps) => {
  const theme = useTheme();
  const [values, setValues] = useState<FormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const { users } = useUsers();

  const riskClassificationItems = useMemo(
    () => [
      { _id: 1, name: RiskClassificationEnum.HighRisk },
      { _id: 2, name: RiskClassificationEnum.LimitedRisk },
      { _id: 3, name: RiskClassificationEnum.MinimalRisk },
    ],
    []
  );

  const highRiskRoleItems = useMemo(
    () => [
      { _id: 1, name: HighRiskRoleEnum.Deployer },
      { _id: 2, name: HighRiskRoleEnum.Provider },
      { _id: 3, name: HighRiskRoleEnum.Distributor },
      { _id: 4, name: HighRiskRoleEnum.Importer },
      { _id: 5, name: HighRiskRoleEnum.ProductManufacturer },
      { _id: 6, name: HighRiskRoleEnum.AuthorizedRepresentative },
    ],
    []
  );

  const handleOnTextFieldChange = useCallback(
    (prop: keyof FormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors]
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof FormValues) => (event: SelectChangeEvent<string | number>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
    },
    [values, errors]
  );

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prevValues: any) => ({
        ...prevValues,
        start_date: newDate ? newDate.toISOString() : "",
      }));
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const projectTitle = checkStringValidation(
      "Project title",
      values.project_title,
      1,
      64
    );
    if (!projectTitle.accepted) {
      newErrors.projectTitle = projectTitle.message;
    }
    const goal = checkStringValidation("Goal", values.goal, 1, 256);
    if (!goal.accepted) {
      newErrors.goal = goal.message;
    }
    const startDate = checkStringValidation("Start date", values.start_date, 1);
    if (!startDate.accepted) {
      newErrors.startDate = startDate.message;
    }
    const users = selectValidation("Users", values.users);
    if (!users.accepted) {
      newErrors.users = users.message;
    }
    const owner = selectValidation("Owner", values.owner);
    if (!owner.accepted) {
      newErrors.owner = owner.message;
    }
    const riskClassification = selectValidation(
      "AI risk classification",
      values.ai_risk_classification
    );
    if (!riskClassification.accepted) {
      newErrors.riskClassification = riskClassification.message;
    }
    const typeOfHighRiskRole = selectValidation(
      "Type of high risk role",
      values.type_of_high_risk_role
    );
    if (!typeOfHighRiskRole.accepted) {
      newErrors.typeOfHighRiskRole = typeOfHighRiskRole.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function handleSubmit() {
    if (validateForm()) {
      // Handle form submission
    }
  }

  return (
    <Stack
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: "fit-content",
        backgroundColor: "#FCFCFD",
        padding: 10,
        borderRadius: "4px",
        gap: 10,
        ...sx,
      }}
    >
      <Stack
        className="vwproject-form-header"
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Stack className="vwproject-form-header-text">
          <Typography
            sx={{ fontSize: 16, color: "#344054", fontWeight: "bold" }}
          >
            Create new project
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#344054" }}>
            Create a new project from scratch by filling in the following.
          </Typography>
        </Stack>
        <ClearIcon
          sx={{ color: "#98A2B3", cursor: "pointer" }}
          onClick={onClose}
        />
      </Stack>
      <Stack
        className="vwproject-form-body"
        sx={{ display: "flex", flexDirection: "row", gap: 8 }}
      >
        <Stack className="vwproject-form-body-start" sx={{ gap: 8 }}>
          <Field
            id="project-title-input"
            label="Project title"
            width="350px"
            value={values.project_title}
            onChange={handleOnTextFieldChange("project_title")}
            error={errors.projectTitle}
            sx={textfieldStyle}
            isRequired
          />
          <Select
            id="owner-input"
            label="Owner"
            placeholder="Select owner"
            value={values.owner || ""}
            onChange={handleOnSelectChange("owner")}
            items={
              users?.map((user: any) => ({
                _id: user.id,
                name: `${user.name} ${user.surname}`,
                email: user.email,
              })) || []
            }
            sx={{
              width: "350px",
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.owner}
            isRequired
          />
          <Select
            id="risk-classification-input"
            label="AI risk classification"
            placeholder="Select an option"
            value={values.ai_risk_classification || ""}
            onChange={handleOnSelectChange("ai_risk_classification")}
            items={riskClassificationItems}
            sx={{
              width: "350px",
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.riskClassification}
            isRequired
          />
          <Select
            id="type-of-high-risk-role-input"
            label="Type of high risk role"
            placeholder="Select an option"
            value={values.type_of_high_risk_role || ""}
            onChange={handleOnSelectChange("type_of_high_risk_role")}
            items={highRiskRoleItems}
            sx={{
              width: "350px",
              backgroundColor: theme.palette.background.main,
            }}
            isRequired
            error={errors.typeOfHighRiskRole}
          />
        </Stack>
        <Stack className="vwproject-form-body-end" sx={{ gap: 8 }}>
          <Select
            id="users-input"
            label="Users"
            placeholder="Select users"
            value={values.users || ""}
            onChange={handleOnSelectChange("users")}
            items={
              users?.map((user) => ({
                _id: user.id,
                name: `${user.name} ${user.surname}`,
                email: user.email,
              })) || []
            }
            sx={{
              width: "350px",
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.users}
            isRequired
          />
          <DatePicker
            label="Start date"
            date={
              values.start_date ? dayjs(values.start_date) : dayjs(new Date())
            }
            handleDateChange={handleDateChange}
            sx={{
              width: "130px",
              "& input": { width: "85px" },
            }}
            isRequired
            error={errors.startDate}
          />
          <Field
            id="goal-input"
            label="Goal"
            type="description"
            value={values.goal}
            onChange={handleOnTextFieldChange("goal")}
            sx={{
              backgroundColor: theme.palette.background.main,
            }}
            isRequired
            error={errors.goal}
          />
        </Stack>
      </Stack>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <VWButton
          text="Create project"
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
          icon={<AddCircleOutlineIcon />}
          onClick={() => handleSubmit()}
        />
      </Stack>
    </Stack>
  );
};

export default VWProjectForm;
