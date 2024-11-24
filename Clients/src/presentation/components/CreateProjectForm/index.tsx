import { FC, useState, useMemo, useCallback } from 'react';
import { Button, SelectChangeEvent, Stack, useTheme } from '@mui/material';
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { checkStringValidation } from '../../../application/validations/stringValidation';
import selectValidation from '../../../application/validations/selectValidation';
import { Suspense, lazy } from 'react';

const Select = lazy(() => import("../Inputs/Select"));
const DatePicker = lazy(() => import('../Inputs/Datepicker'));
const Field = lazy(() => import('../Inputs/Field'));
const Alert = lazy(() => import('../Alert'));

enum RiskClassificationEnum {
  HighRisk = "High risk",
  LimitedRisk = "Limited risk",
  MinimalRisk = "Minimal risk"
}

enum HighRiskRoleEnum {
  Deployer = "Deployer",
  Provider = "Provider",
  Distributor = "Distributor",
  Importer = "Importer",
  ProductManufacturer = "Product manufacturer",
  AuthorizedRepresentative = "Authorized representative"
}

interface FormValues {
  projectTitle: string;
  users: number;
  owner: number;
  startDate: string;
  riskClassification: number;
  typeOfHighRiskRole: number;
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
  projectTitle: "",
  users: 0,
  owner: 0,
  startDate: "",
  riskClassification: 0,
  typeOfHighRiskRole: 0,
  goal: ""
}

/**
 * `CreateProjectForm` is a functional component that renders a form for creating a new project.
 * It includes fields for project title, users, owner, start date, AI risk classification, type of high risk role, and goal.
 * The form validates the input fields and displays error messages if validation fails.
 * On successful submission, it navigates to the project view page.
 *
 * @component
 * @returns {JSX.Element} The rendered component.
 */
const CreateProjectForm: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    setValues((prevValues) => ({
      ...prevValues,
      startDate: newDate ? newDate.toISOString() : ""
    }));
  }, []);

  const handleOnSelectChange = useCallback((prop: keyof FormValues) => (event: SelectChangeEvent<string | number>) => {
    setValues({ ...values, [prop]: event.target.value });
    setErrors({ ...errors, [prop]: "" });
  }, [values, errors]);

  const handleOnTextFieldChange = useCallback((prop: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
    setErrors({ ...errors, [prop]: "" });
  }, [values, errors]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const projectTitle = checkStringValidation("Project title", values.projectTitle, 1, 64);
    if (!projectTitle.accepted) {
      newErrors.projectTitle = projectTitle.message;
    }
    const goal = checkStringValidation("Goal", values.goal, 1, 256);
    if (!goal.accepted) {
      newErrors.goal = goal.message;
    }
    const startDate = checkStringValidation("Start date", values.startDate, 1);
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
    const riskClassification = selectValidation("AI risk classification", values.riskClassification);
    if (!riskClassification.accepted) {
      newErrors.riskClassification = riskClassification.message;
    }
    const typeOfHighRiskRole = selectValidation("Type of high risk role", values.typeOfHighRiskRole);
    if (!typeOfHighRiskRole.accepted) {
      newErrors.typeOfHighRiskRole = typeOfHighRiskRole.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateForm()) {
      //request to the backend
      navigate("/project-view");
    }
  }

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

  const fieldStyle = useMemo(() => ({
    backgroundColor: theme.palette.background.main,
    "& input": {
      padding: "0 14px"
    }
  }), [theme.palette.background.main]);

  return (
    <Stack>
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        </Suspense>
      )}
      <Stack component="form" onSubmit={handleSubmit}>
        <Stack sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20, rowGap: 8, mt: 13.5 }}>
          <Suspense fallback={<div>Loading...</div>}>
            <Field
              id="project-title-input"
              label="Project title"
              width="350px"
              value={values.projectTitle}
              onChange={handleOnTextFieldChange("projectTitle")}
              error={errors.projectTitle}
              sx={fieldStyle}
              isRequired
            />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <Select
              id="users-input"
              label="Users"
              placeholder="Select users"
              value={values.users}
              onChange={handleOnSelectChange("users")}
              items={[
                { _id: 1, name: "Some value 1" },
                { _id: 2, name: "Some value 2" },
                { _id: 3, name: "Some value 3" },
              ]}
              sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
              error={errors.users}
              isRequired
            />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <Select
              id="owner-input"
              label="Owner"
              placeholder="Select owner"
              value={values.owner}
              onChange={handleOnSelectChange("owner")}
              items={[
                { _id: 1, name: "Some value 1" },
                { _id: 2, name: "Some value 2" },
                { _id: 3, name: "Some value 3" },
              ]}
              sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
              error={errors.owner}
              isRequired
            />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <DatePicker
              label="Start date"
              date={values.startDate ? dayjs(values.startDate) : null}
              handleDateChange={handleDateChange}
              sx={{
                width: "130px",
                "& input": { width: "85px" }
              }}
              isRequired
              error={errors.startDate}
            />
          </Suspense>
          <Stack sx={{ display: "grid", gridTemplateColumns: "1fr", columnGap: 20, rowGap: 9.5, marginTop: "16px" }}>
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="risk-classification-input"
                label="AI risk classification"
                placeholder="Select an option"
                value={values.riskClassification}
                onChange={handleOnSelectChange("riskClassification")}
                items={riskClassificationItems}
                sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
                error={errors.riskClassification}
                isRequired
              />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="type-of-high-risk-role-input"
                label="Type of high risk role"
                placeholder="Select an option"
                value={values.typeOfHighRiskRole}
                onChange={handleOnSelectChange("typeOfHighRiskRole")}
                items={highRiskRoleItems}
                sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
                isRequired
                error={errors.typeOfHighRiskRole}
              />
            </Suspense>
          </Stack>
          <Stack sx={{ marginTop: "16px" }}>
            <Suspense fallback={<div>Loading...</div>}>
              <Field
                id="goal-input"
                label="Goal"
                type="description"
                value={values.goal}
                onChange={handleOnTextFieldChange("goal")}
                sx={{ height: 101, backgroundColor: theme.palette.background.main }}
                isRequired
                error={errors.goal}
              />
            </Suspense>
          </Stack>
        </Stack>
        <Button
          type="submit"
          variant="contained"
          disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}
          sx={{
            borderRadius: 2, maxHeight: 34,
            textTransform: "inherit",
            backgroundColor: "#4C7DE7",
            boxShadow: "none",
            border: "1px solid #175CD3",
            ml: "auto",
            mr: 0,
            mt: "30px",
            "&:hover": { boxShadow: "none" }
          }}
        >Create project</Button>
      </Stack>
    </Stack>
  )
}

export default CreateProjectForm;