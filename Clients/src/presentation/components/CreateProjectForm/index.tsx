import { FC, useState } from 'react';
import { Stack, useTheme } from '@mui/material';
import Select from "../Inputs/Select";
import DatePicker from '../Inputs/Datepicker';
import Field from '../Inputs/Field';
import dayjs, { Dayjs } from "dayjs";

const CreateProjectForm: FC = () => {
  const theme = useTheme();
  const [values, setValues] = useState({
    projectTitle: "",
    users: "0",
    owner: "",
    reviewDate: "",
    riskClassification: "0",
    typeOfHighRiskRole: "0",
    goal: ""
  });
  const handleDateChange = (newDate: Dayjs | null) => {
    setValues((prevValues) => ({
      ...prevValues,
      reviewDate: newDate ? newDate.toISOString() : ""
    }));
  };
  const handleOnChange = (field: string, value: string | number) => {
    setValues((prevValues) => ({
      ...prevValues,
      [field]: value,
    }));
  };
  const fieldStyle = {
    backgroundColor: theme.palette.background.main,
    "& input": {
      padding: "0 14px"
    }
  }
  return (
    <Stack
      component="form"
      noValidate
      sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20, rowGap: 8, mt: 13.5 }}
    >
      <Field 
        id="project-title-input" 
        label="Project title" 
        width="350px" 
        value={values.projectTitle}
        onChange={(e) => handleOnChange("projectTitle", e.target.value)}
        sx={fieldStyle} 
      />
      <Select
        id="users-input"
        label="Users"
        placeholder="Select users"
        value={values.users}
        onChange={(e) => handleOnChange("users", e.target.value)}
        items={[
          { _id: 1, name: "Some value 1" },
          { _id: 2, name: "Some value 2" },
          { _id: 3, name: "Some value 3" },
        ]}
        sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
      />
      <Field 
        id="owner-input" 
        label="Owner" 
        width="350px" 
        value={values.owner}
        onChange={(e) => handleOnChange("owner", e.target.value)}
        sx={fieldStyle} 
      />
      <DatePicker 
        label="Start date" 
        date={ values.reviewDate ? dayjs(values.reviewDate) : null }
        handleDateChange={handleDateChange}
        sx={{ 
          width: "130px",
          "& input": { width: "85px" }
        }} 
      />
      <Stack sx={{ display: "grid", gridTemplateColumns: "1fr", columnGap: 20, rowGap: 9.5, marginTop: "16px" }}>
         <Select
          id="risk-classification-input"
          label="AI risk classification"
          placeholder="Select an option"
          value={values.riskClassification}
          onChange={(e) => handleOnChange("riskClassification", e.target.value)}
          items={[
            { _id: 1, name: "Some value 1" },
            { _id: 2, name: "Some value 2" },
            { _id: 3, name: "Some value 3" },
          ]}
          sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
        />
        <Select
          id="type-of-high-risk-role-input"
          label="Type of high risk role"
          placeholder="Select an option"
          value={values.typeOfHighRiskRole}
          onChange={(e) => handleOnChange("typeOfHighRiskRole", e.target.value)}
          items={[
            { _id: 1, name: "Some value 1" },
            { _id: 2, name: "Some value 2" },
            { _id: 3, name: "Some value 3" },
          ]}
          sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
        />
      </Stack>
      <Stack sx={{ marginTop: "16px" }}>
        <Field 
          id="goal-input" 
          label="Goal" 
          type="description" 
          value={values.goal}
          onChange={(e) => handleOnChange("goal", e.target.value)}
          sx={{ height: 101, backgroundColor: theme.palette.background.main }} 
        />
      </Stack>
    </Stack>
  )
}

export default CreateProjectForm;