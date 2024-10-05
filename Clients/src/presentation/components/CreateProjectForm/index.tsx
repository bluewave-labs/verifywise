import { FC } from 'react';
import { Box, FormControl, InputLabel, InputBase, MenuItem, Select } from '@mui/material';
import { styles } from "./styles";

const CreateProjectForm: FC = () => {
  return (
    <Box
      component="form"
      noValidate
      sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20, rowGap: 8 }}
    >

      {/* Project title field */}
      <FormControl variant="standard" sx={{ width: 350 }}>
        <InputLabel shrink htmlFor="project-title-input" sx={styles.label}>
          Project title
        </InputLabel>
        <InputBase id="project-title-input" sx={{ ...styles.input, ...styles.field }} />
      </FormControl>

      {/* Users field */}
      <FormControl variant="standard" sx={{ width: 350 }}>
        <InputLabel shrink htmlFor="users-input" sx={styles.label}>
          Users
        </InputLabel>
        <InputBase id="users-input" placeholder="Add user" sx={{ ...styles.input, ...styles.field }} />
      </FormControl>

      {/* Owner field */}
      <FormControl variant="standard" sx={{ width: 350 }}>
        <InputLabel shrink htmlFor="owner-input" sx={styles.label}>
          Owner
        </InputLabel>
        <InputBase id="owner-input" sx={{ ...styles.input, ...styles.field }} />
      </FormControl>

      {/* Start data field */}
      <FormControl variant="standard" sx={{ width: 350 }}>
        <InputLabel shrink htmlFor="start-date-input" sx={styles.label}>
          Start date
        </InputLabel>
        <InputBase id="start-date-input" type="date" sx={{ ...styles.field, ...styles.input2 }} />
      </FormControl>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", columnGap: 20, rowGap: 8 }}>

        {/* AI risk classification select */}
        <FormControl variant="standard" >
          <InputLabel shrink id="classification-input" sx={{ ...styles.label, ...styles.label2 }}>
            AI risk classification
          </InputLabel>
          <Select
            labelId="classification-input"
            id="classification-input"
            //value={}
            label="AI risk classification"
            //onChange={handleChange}
            placeholder="Select an option"
            sx={{ ...styles.input2, ...styles.field, ...styles.select }}
          >
            <MenuItem value={"Some value 1"}>Some value 1</MenuItem>
            <MenuItem value={"Some value 2"}>Some value 2</MenuItem>
            <MenuItem value={"Some value 3"}>Some value 3</MenuItem>
          </Select>
        </FormControl>

        {/* Type of high risk role select */}
        <FormControl variant="standard" >
          <InputLabel shrink id="risk-role-input" sx={{ ...styles.label, ...styles.label2 }}>
            Type of high risk role
          </InputLabel>
          <Select
            labelId="risk-role--input"
            id="risk-role-input"
            //value={}
            label="Type of high risk role"
            //onChange={handleChange}
            placeholder="Select an option"
            sx={{ ...styles.input2, ...styles.field }}
          >
            <MenuItem value={"Some value 1"}>Some value 1</MenuItem>
            <MenuItem value={"Some value 2"}>Some value 2</MenuItem>
            <MenuItem value={"Some value 3"}>Some value 3</MenuItem>
          </Select>
        </FormControl>

      </Box>

      {/* Goal text area */}
      <FormControl variant="standard" >
        <InputLabel shrink htmlFor="goal-input" sx={styles.label}>
          Goal
        </InputLabel>
        <InputBase id="goal-input" multiline rows={4} sx={{ ...styles.field, ...styles.textarea }} />
      </FormControl>

    </Box>
  )
}

export default CreateProjectForm;