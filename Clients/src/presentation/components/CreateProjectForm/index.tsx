import { FC, useState, useMemo, useCallback, useEffect } from "react";
import {
  Button,
  SelectChangeEvent,
  Stack,
  useTheme,
} from "@mui/material";
import { useSelector } from "react-redux";
import dayjs, { Dayjs } from "dayjs";
import { checkStringValidation } from "../../../application/validations/stringValidation";
import selectValidation from "../../../application/validations/selectValidation";
import { Suspense, lazy } from "react";
import { createNewUser, getAllEntities } from "../../../application/repository/entity.repository";
const Select = lazy(() => import("../Inputs/Select"));
const DatePicker = lazy(() => import("../Inputs/Datepicker"));
const Field = lazy(() => import("../Inputs/Field"));
import { extractUserToken } from "../../../application/tools/extractToken";
import React from "react";


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

interface CreateProjectFormProps {
  closePopup: () => void;
  onNewProject: (value: { isNewProject: boolean; project: any }) => void;
}

/**
 * `CreateProjectForm` is a functional component that renders a form for creating a new project.
 * It includes fields for project title, users, owner, start date, AI risk classification, type of high risk role, and goal.
 * The form validates the input fields and displays error messages if validation fails.
 * On successful submission, it shows a newly created project on project overview page.
 *
 * @component
 * @returns {JSX.Element} The rendered component.
 */

const CreateProjectForm: FC<CreateProjectFormProps> = ({ closePopup, onNewProject }) => {
  const theme = useTheme();
  const [values, setValues] = useState<FormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const authState = useSelector(
    (state: { auth: { authToken: string; userExists: boolean } }) => state.auth
  );

  const [users, setUsers] = useState<[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await getAllEntities({ routeUrl: "/users" });
      let users = response.data.map((item: { id: number; _id: number }) => {
        item._id = item.id;
        return item;
      });
      setUsers(users);
    };
    fetchUsers();
  }, []);


  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setValues((prevValues) => ({
        ...prevValues,
        start_date: newDate ? newDate.toISOString() : "",
      }));
    }
  }, []);

  const handleOnSelectChange = useCallback(
    (prop: keyof FormValues) => (event: SelectChangeEvent<string | number>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
    },
    [values, errors]
  );

  const handleOnTextFieldChange = useCallback(
    (prop: keyof FormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors]
  );

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateForm()) {
      confirmSubmit();
    }
  };

  const confirmSubmit = async () => {
    const userInfo = extractUserToken(authState.authToken)
    await createNewUser({
      routeUrl: "/projects",
      body: {
        ...values,
        type_of_high_risk_role: highRiskRoleItems.find(item => item._id === values.type_of_high_risk_role)?.name,
        ai_risk_classification: riskClassificationItems.find(item => item._id === values.ai_risk_classification)?.name,
        last_updated: values.start_date,
        last_updated_by: values.users // TO Do: get user id from token
      },
    }).then((response) => {
      // Reset form after successful submission
      setValues(initialState);
      setErrors({});
      closePopup();
      if (response.status === 201) {
        onNewProject({ isNewProject: true, project: response.data.data.project });
      }
    });
  };

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
    <Stack>
      <Stack component="form" onSubmit={handleSubmit}>
        <Stack
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 20,
            rowGap: 8,
            mt: 13.5,
          }}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <Field
              id="project-title-input"
              label="Project title"
              width="350px"
              value={values.project_title}
              onChange={handleOnTextFieldChange("project_title")}
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
              items={users}
              sx={{
                width: "350px",
                backgroundColor: theme.palette.background.main,
              }}
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
                { _id: 1, name: "Some value 1", email: "email@email.com" },
                { _id: 2, name: "Some value 2", email: "email@email.com" },
                { _id: 3, name: "Some value 3", email: "email@email.com" },
              ]}
              sx={{
                width: "350px",
                backgroundColor: theme.palette.background.main,
              }}
              error={errors.owner}
              isRequired
            />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <DatePicker
              label="Start date"
              date={values.start_date ? dayjs(values.start_date) : dayjs(new Date)}
              handleDateChange={handleDateChange}
              sx={{
                width: "130px",
                "& input": { width: "85px" },
              }}
              isRequired
              error={errors.startDate}
            />
          </Suspense>
          <Stack
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              columnGap: 20,
              rowGap: 9.5,
              marginTop: "16px",
            }}
          >
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="risk-classification-input"
                label="AI risk classification"
                placeholder="Select an option"
                value={values.ai_risk_classification}
                onChange={handleOnSelectChange("ai_risk_classification")}
                items={riskClassificationItems}
                sx={{
                  width: "350px",
                  backgroundColor: theme.palette.background.main,
                }}
                error={errors.riskClassification}
                isRequired
              />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <Select
                id="type-of-high-risk-role-input"
                label="Type of high risk role"
                placeholder="Select an option"
                value={values.type_of_high_risk_role}
                onChange={handleOnSelectChange("type_of_high_risk_role")}
                items={highRiskRoleItems}
                sx={{
                  width: "350px",
                  backgroundColor: theme.palette.background.main,
                }}
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
                sx={{
                  backgroundColor: theme.palette.background.main,
                }}
                isRequired
                error={errors.goal}
              />
            </Suspense>
          </Stack>
        </Stack>
        <Button
          type="submit"
          variant="contained"
          disableRipple={
            theme.components?.MuiButton?.defaultProps?.disableRipple
          }
          sx={{
            borderRadius: 2,
            maxHeight: 34,
            textTransform: "inherit",
            backgroundColor: "#4C7DE7",
            boxShadow: "none",
            border: "1px solid #175CD3",
            ml: "auto",
            mr: 0,
            mt: "30px",
            "&:hover": { boxShadow: "none", backgroundColor: "#175CD3 " },
          }}
        >
          Create project
        </Button>
      </Stack>
    </Stack>
  );
};

export default CreateProjectForm;
