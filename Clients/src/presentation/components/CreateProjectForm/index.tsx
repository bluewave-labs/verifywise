import { FC, useState } from 'react';
import { Box } from '@mui/material';
import Select from "../Inputs/Select";
import DatePicker from '../Inputs/Datepicker';
import Field from '../Inputs/Field';

const CreateProjectForm: FC = () => {
  const [riskClassification, setRiskClassification] = useState<string | number>("Select an option");
  const [typeOfHighRiskRole, setTypeOfHighRiskRole] = useState<string | number>("Select an option");
  const fieldStyle = {
    height: 30, 
    "& input": {
      padding: "0 14px"
    }
  }
  return (
    <Box
      component="form"
      noValidate
      sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20, rowGap: 8 }}
    >
      <Field id="project-title-input" label="Project title" width="350px" sx={fieldStyle} />
      <Field id="users-input" label="Users" placeholder="Add user" width="350px" sx={fieldStyle} />
      <Field id="owner-input" label="Owner" width="350px" sx={fieldStyle} />
      <DatePicker label="Start date" 
        sx={{ width: "130px", 
          "& input": {
            padding: "0 14px"
          }
      }} />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", columnGap: 20, rowGap: 9.5, marginTop: "16px" }}>
         <Select
          id="risk-classification-input"
          label="AI risk classification"
          value={riskClassification}
          onChange={(e) => setRiskClassification(e.target.value)}
          items={[
            { _id: 1, name: "Some value 1" },
            { _id: 2, name: "Some value 2" },
            { _id: 3, name: "Some value 3" },
          ]}
          sx={{ width: "350px" }}
        />
        <Select
          id="type-of-high-risk-role-input"
          label="Type of high risk role"
          value={typeOfHighRiskRole}
          onChange={(e) => setTypeOfHighRiskRole(e.target.value)}
          items={[
            { _id: 1, name: "Some value 1" },
            { _id: 2, name: "Some value 2" },
            { _id: 3, name: "Some value 3" },
          ]}
          sx={{ width: "350px" }}
        />
      </Box>
      <Box sx={{ marginTop: "16px" }}>
        <Field id="goal-input" label="Goal" type="description" sx={{ height: 101 }} />
      </Box>
    </Box>
  )
}

export default CreateProjectForm;