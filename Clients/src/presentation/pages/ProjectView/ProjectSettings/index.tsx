import { Stack, Typography, useTheme } from "@mui/material";
import { FC, useState } from "react";
import Field from "../../../components/Inputs/Field";
import DatePicker from "../../../components/Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import Select from "../../../components/Inputs/Select";

const ProjectSettings: FC = () => {
    const theme = useTheme();
    const [values, setValues] = useState({
        projectTitle: "",
        goal: "",
        owner: "",
        reviewDate: "",
        addUsers: "",
        riskClassification: "",
        typeOfHighRiskRole: ""
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
            sx={{ display: "grid", columnGap: 20, rowGap: 8 }}
        >
            <Field 
                id="project-title-input" 
                label="Project title" 
                width={458} 
                value={values.projectTitle}
                onChange={(e) => handleOnChange("projectTitle", e.target.value)}
                sx={fieldStyle} 
            />
             <Field 
                id="goal-input" 
                label="Goal" 
                width={458} 
                type="description" 
                value={values.goal}
                onChange={(e) => handleOnChange("goal", e.target.value)}
                sx={{ height: 101, backgroundColor: theme.palette.background.main }} 
            />
            <Select
                id="owner"
                label="Owner"
                placeholder="Add owner"
                value={values.owner}
                onChange={(e) => handleOnChange("owner", e.target.value)}
                items={[
                    { _id: 1, name: "Some value 1" },
                    { _id: 2, name: "Some value 2" },
                    { _id: 3, name: "Some value 3" },
                ]}
                sx={{ width: 357, backgroundColor: theme.palette.background.main }}
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
            <Typography>Team members</Typography>
            <Typography>Add all team members of the project. Only those who are added will be able to see the project.</Typography>
            <Select
                id="add-users"
                placeholder="Add users"
                value={values.addUsers}
                onChange={(e) => handleOnChange("addUsers", e.target.value)}
                items={[
                    { _id: 1, name: "Some value 1" },
                    { _id: 2, name: "Some value 2" },
                    { _id: 3, name: "Some value 3" },
                ]}
                sx={{ width: 357, backgroundColor: theme.palette.background.main }}
            />
            <Typography>AI risk classification</Typography>
            <Typography>To define the AI risk classification, please see this link</Typography>
            <Select
                id="risk-classification-input"
                placeholder="Select an option"
                value={values.riskClassification}
                onChange={(e) => handleOnChange("riskClassification", e.target.value)}
                items={[
                    { _id: 1, name: "Some value 1" },
                    { _id: 2, name: "Some value 2" },
                    { _id: 3, name: "Some value 3" },
                ]}
                sx={{ width: 357, backgroundColor: theme.palette.background.main }}
            />
            <Typography>Type of high risk role</Typography>
            <Typography>If you are not sure about the high risk role, please see this link</Typography>
            <Select
                id="type-of-high-risk-role-input"
                placeholder="Select an option"
                value={values.typeOfHighRiskRole}
                onChange={(e) => handleOnChange("typeOfHighRiskRole", e.target.value)}
                items={[
                    { _id: 1, name: "Some value 1" },
                    { _id: 2, name: "Some value 2" },
                    { _id: 3, name: "Some value 3" },
                ]}
                sx={{ width: 357, backgroundColor: theme.palette.background.main }}
            />
        </Stack>
    )
}

export default ProjectSettings;