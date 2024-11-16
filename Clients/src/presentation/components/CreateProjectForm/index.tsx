import { FC, useState } from 'react';
import { Button, SelectChangeEvent, Stack, useTheme } from '@mui/material';
import Select from "../Inputs/Select";
import DatePicker from '../Inputs/Datepicker';
import Field from '../Inputs/Field';
import dayjs, { Dayjs } from "dayjs";
import { checkStringValidation } from '../../../application/validations/stringValidation';
import { useNavigate } from "react-router-dom";
import Alert from '../Alert';
import selectValidation from '../../../application/validations/selectValidation';

interface FormValues {
  projectTitle: string,
  users: number,
  owner: number,
  startDate: string,
  riskClassification: number,
  typeOfHighRiskRole: number,
  goal: string
}

interface FormErrors {
  projectTitle?: string,
  users?: string,
  owner?: string,
  startDate?: string,
  riskClassification?: string,
  typeOfHighRiskRole?: string,
  goal?: string
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

  const handleDateChange = (newDate: Dayjs | null) => {
    setValues((prevValues) => ({
      ...prevValues,
      startDate: newDate ? newDate.toISOString() : ""
    }));
  };
  const handleOnSelectChange = (prop: keyof FormValues) => (event: SelectChangeEvent<string | number>) => {
    setValues({ ...values, [prop]: event.target.value });
    setErrors({ ...errors, [prop]: "" });
  };
  const handleOnTextFieldChange = (prop: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
    setErrors({ ...errors, [prop]: "" });
  };

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

  const fieldStyle = {
    backgroundColor: theme.palette.background.main,
    "& input": {
      padding: "0 14px"
    }
  }

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
      <Stack component="form" onSubmit={handleSubmit}>
        <Stack sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20, rowGap: 8, mt: 13.5 }}>
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
          <Stack sx={{ display: "grid", gridTemplateColumns: "1fr", columnGap: 20, rowGap: 9.5, marginTop: "16px" }}>
            <Select
              id="risk-classification-input"
              label="AI risk classification"
              placeholder="Select an option"
              value={values.riskClassification}
              onChange={handleOnSelectChange("riskClassification")}
              items={[
                { _id: 1, name: "Some value 1" },
                { _id: 2, name: "Some value 2" },
                { _id: 3, name: "Some value 3" },
              ]}
              sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
              error={errors.riskClassification}
              isRequired
            />
            <Select
              id="type-of-high-risk-role-input"
              label="Type of high risk role"
              placeholder="Select an option"
              value={values.typeOfHighRiskRole}
              onChange={handleOnSelectChange("typeOfHighRiskRole")}
              items={[
                { _id: 1, name: "Some value 1" },
                { _id: 2, name: "Some value 2" },
                { _id: 3, name: "Some value 3" },
              ]}
              sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
              isRequired
              error={errors.typeOfHighRiskRole}
            />
          </Stack>
          <Stack sx={{ marginTop: "16px" }}>
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