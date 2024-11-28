import {
  Button,
  SelectChangeEvent,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import React, { FC, useState, useCallback, useMemo } from "react";
import Field from "../../../components/Inputs/Field";
import DatePicker from "../../../components/Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import Select from "../../../components/Inputs/Select";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import selectValidation from "../../../../application/validations/selectValidation";
import Alert from "../../../components/Alert";

interface ProjectSettingsProps {
  setTabValue: (value: string) => void;
}

interface FormValues {
  projectTitle: string;
  goal: string;
  owner: number;
  startDate: string;
  addUsers: number;
  riskClassification: number;
  typeOfHighRiskRole: number;
}

interface FormErrors {
  projectTitle?: string;
  goal?: string;
  owner?: string;
  startDate?: string;
  addUsers?: string;
  riskClassification?: string;
  typeOfHighRiskRole?: string;
}

const initialState: FormValues = {
  projectTitle: "",
  goal: "",
  owner: 0,
  startDate: "",
  addUsers: 0,
  riskClassification: 0,
  typeOfHighRiskRole: 0,
};

const ProjectSettings: FC<ProjectSettingsProps> = React.memo(
  ({ setTabValue }) => {
    const theme = useTheme();
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
        startDate: newDate ? newDate.toISOString() : "",
      }));
    }, []);

    const handleOnSelectChange = useCallback(
      (prop: keyof FormValues) =>
        (event: SelectChangeEvent<string | number>) => {
          setValues((prevValues) => ({
            ...prevValues,
            [prop]: event.target.value,
          }));
          setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
        },
      []
    );

    const handleOnTextFieldChange = useCallback(
      (prop: keyof FormValues) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
          setValues((prevValues) => ({
            ...prevValues,
            [prop]: event.target.value,
          }));
          setErrors((prevErrors) => ({ ...prevErrors, [prop]: "" }));
        },
      []
    );

    const validateForm = useCallback((): boolean => {
      const newErrors: FormErrors = {};

      const projectTitle = checkStringValidation(
        "Project title",
        values.projectTitle,
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
      const startDate = checkStringValidation(
        "Start date",
        values.startDate,
        1
      );
      if (!startDate.accepted) {
        newErrors.startDate = startDate.message;
      }
      const addUsers = selectValidation("Team members", values.addUsers);
      if (!addUsers.accepted) {
        newErrors.addUsers = addUsers.message;
      }
      const owner = selectValidation("Owner", values.owner);
      if (!owner.accepted) {
        newErrors.owner = owner.message;
      }
      const riskClassification = selectValidation(
        "AI risk classification",
        values.riskClassification
      );
      if (!riskClassification.accepted) {
        newErrors.riskClassification = riskClassification.message;
      }
      const typeOfHighRiskRole = selectValidation(
        "Type of high risk role",
        values.typeOfHighRiskRole
      );
      if (!typeOfHighRiskRole.accepted) {
        newErrors.typeOfHighRiskRole = typeOfHighRiskRole.message;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [values]);

    const handleSubmit = useCallback(
      async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (validateForm()) {
          //request to the backend
          setTabValue("overview");
        }
      },
      [validateForm, setTabValue]
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
        {alert && (
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        )}
        <Stack component="form" onSubmit={handleSubmit} rowGap="15px">
          <Field
            id="project-title-input"
            label="Project title"
            width={458}
            value={values.projectTitle}
            onChange={handleOnTextFieldChange("projectTitle")}
            sx={fieldStyle}
            error={errors.projectTitle}
            isRequired
          />
          <Field
            id="goal-input"
            label="Goal"
            width={458}
            type="description"
            value={values.goal}
            onChange={handleOnTextFieldChange("goal")}
            sx={{ height: 101, backgroundColor: theme.palette.background.main }}
            error={errors.goal}
            isRequired
          />
          <Select
            id="owner"
            label="Owner"
            placeholder="Add owner"
            value={values.owner}
            onChange={handleOnSelectChange("owner")}
            items={[
              { _id: 1, name: "Some value 1" },
              { _id: 2, name: "Some value 2" },
              { _id: 3, name: "Some value 3" },
            ]}
            sx={{ width: 357, backgroundColor: theme.palette.background.main }}
            error={errors.owner}
            isRequired
          />
          <DatePicker
            label="Start date"
            date={values.startDate ? dayjs(values.startDate) : null}
            handleDateChange={handleDateChange}
            sx={{
              width: "130px",
              "& input": { width: "85px" },
            }}
            isRequired
            error={errors.startDate}
          />
          <Stack gap="5px" sx={{ mt: "6px" }}>
            <Typography
              sx={{ fontSize: theme.typography.fontSize, fontWeight: 600 }}
            >
              Team members
            </Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize }}>
              Add all team members of the project. Only those who are added will
              be able to see the project.
            </Typography>
          </Stack>
          <Select
            id="add-users"
            placeholder="Add users"
            value={values.addUsers}
            onChange={handleOnSelectChange("addUsers")}
            items={[
              { _id: 1, name: "Some value 1" },
              { _id: 2, name: "Some value 2" },
              { _id: 3, name: "Some value 3" },
            ]}
            sx={{ width: 357, backgroundColor: theme.palette.background.main }}
            error={errors.addUsers}
            isRequired
          />
          <Stack gap="5px" sx={{ mt: "6px" }}>
            <Typography
              sx={{ fontSize: theme.typography.fontSize, fontWeight: 600 }}
            >
              AI risk classification
            </Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize }}>
              To define the AI risk classification,&nbsp;
              <Link
                href="https://artificialintelligenceact.eu/high-level-summary/"
                target="_blank"
                rel="noopener"
                color={theme.palette.text.secondary}
              >
                please see this link
              </Link>
            </Typography>
          </Stack>
          <Select
            id="risk-classification-input"
            placeholder="Select an option"
            value={values.riskClassification}
            onChange={handleOnSelectChange("riskClassification")}
            items={[
              { _id: 1, name: "Some value 1" },
              { _id: 2, name: "Some value 2" },
              { _id: 3, name: "Some value 3" },
            ]}
            sx={{ width: 357, backgroundColor: theme.palette.background.main }}
            error={errors.riskClassification}
            isRequired
          />
          <Stack gap="5px" sx={{ mt: "6px" }}>
            <Typography
              sx={{ fontSize: theme.typography.fontSize, fontWeight: 600 }}
            >
              Type of high risk role
            </Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize }}>
              If you are not sure about the high risk role,&nbsp;
              <Link
                href="https://artificialintelligenceact.eu/high-level-summary/"
                target="_blank"
                rel="noopener"
                color={theme.palette.text.secondary}
              >
                please see this link
              </Link>
            </Typography>
          </Stack>
          <Select
            id="type-of-high-risk-role-input"
            placeholder="Select an option"
            value={values.typeOfHighRiskRole}
            onChange={handleOnSelectChange("typeOfHighRiskRole")}
            items={[
              { _id: 1, name: "Some value 1" },
              { _id: 2, name: "Some value 2" },
              { _id: 3, name: "Some value 3" },
            ]}
            sx={{ width: 357, backgroundColor: theme.palette.background.main }}
            error={errors.typeOfHighRiskRole}
            isRequired
          />
          <Button
            variant="contained"
            type="submit"
            sx={{
              width: 60,
              height: 34,
              fontSize: theme.typography.fontSize,
              textTransform: "inherit",
              backgroundColor: "#4C7DE7",
              boxShadow: "none",
              borderRadius: 2,
              border: "1px solid #175CD3",
              ml: "auto",
              mr: 0,
              "&:hover": { boxShadow: "none", backgroundColor: "#175CD3 " },
            }}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    );
  }
);

export default ProjectSettings;
