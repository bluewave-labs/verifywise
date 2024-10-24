import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Divider, Stack, Tab, Typography, useTheme } from "@mui/material";
import { FC, useState } from "react";
import Select from "../Inputs/Select";
import Field from "../Inputs/Field";
import "./styles.css"

const AddNewRiskForm: FC = () => {
    const theme = useTheme();
    const disableRipple = theme.components?.MuiButton?.defaultProps?.disableRipple;
    const [value, setValue] = useState("risks");
    const handleChange = (_: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };
    const [values, setValues] = useState({
        projectName: "Select project",
        actionOwner: "Select owner",
        aiLifecyclePhase: "Select phase",
        riskDescription: "",
        riskCategory: "Select category",
        potentialImpact: "",
        assessmentMapping: "Map assessment",
        controlsMapping: "Map controls",
        likelihood: "Select likelihood of risk to happen",
        riskSeverity: "Select risk severity",
        riskLevel: "Select risk level",
        reviewNotes: ""

    });
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
    const tabStyle = {
        textTransform: "none",
        fontWeight: 400,
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: "16px 0 7px",
        minHeight: "20px"
    };

    const riskTabRender = () => {
        return (
            <Stack className="AddNewRiskForm">
                <Stack sx={{ flexDirection: "row", columnGap: "26px", mb: "20px" }}>
                    <Stack sx={{ display: "grid", gridTemplateColumns: "324px 324px", columnGap: "26px", rowGap: "17px" }}>
                        <Select
                            id="project-name-input"
                            label="Project name"
                            placeholder="Select project"
                            value={values.projectName}
                            onChange={(e) => handleOnChange("projectName", e.target.value)}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: "324px", backgroundColor: theme.palette.background.main }}
                        />
                        <Field
                            id="risk-description-input"
                            label="Risk description"
                            width={324}
                            value={values.riskDescription}
                            onChange={(e) => handleOnChange("riskDescription", e.target.value)}
                            sx={fieldStyle}
                        />
                        <Select
                            id="assessment-mapping-input"
                            label="Assessment mapping"
                            placeholder="Map assessment"
                            value={values.assessmentMapping}
                            onChange={(e) => handleOnChange("assessmentMapping", e.target.value)}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: "324px", backgroundColor: theme.palette.background.main }}
                        />
                        <Select
                            id="action-owner-input"
                            label="Action owner"
                            placeholder="Select owner"
                            value={values.actionOwner}
                            onChange={(e) => handleOnChange("actionOwner", e.target.value)}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: "324px", backgroundColor: theme.palette.background.main }}
                        />
                        <Select
                            id="risk-category-input"
                            label="Risk category"
                            placeholder="Select category"
                            value={values.riskCategory}
                            onChange={(e) => handleOnChange("riskCategory", e.target.value)}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: "324px", backgroundColor: theme.palette.background.main }}
                        />
                        <Select
                            id="controls-mapping-input"
                            label="Controls mapping"
                            placeholder="Map controls"
                            value={values.controlsMapping}
                            onChange={(e) => handleOnChange("controlsMapping", e.target.value)}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: "324px", backgroundColor: theme.palette.background.main }}
                        />
                    </Stack>
                    <Stack sx={{ rowGap: "17px" }}>
                        <Select
                            id="ai-lifecycle-phase-input"
                            label="AI lifecycle phase"
                            placeholder="Select phase"
                            value={values.aiLifecyclePhase}
                            onChange={(e) => handleOnChange("aiLifecyclePhase", e.target.value)}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: "324px", backgroundColor: theme.palette.background.main }}
                        />
                        <Field
                            id="potential-impact-input"
                            label="Potential Impact"
                            type="description"
                            value={values.potentialImpact}
                            onChange={(e) => handleOnChange("potentialImpact", e.target.value)}
                            sx={{ backgroundColor: theme.palette.background.main }}
                        />
                    </Stack>
                </Stack>
                <Divider />
                <Typography sx={{ fontSize: 16, fontWeight: 600, mt: "13px" }}>Calculate risk level</Typography>
                <Typography sx={{ fontSize: theme.typography.fontSize, mb: "16px" }}>The Risk Level is calculated by multiplying the Likelihood and Severity scores. By assigning these scores, the risk level will be determined based on your inputs.</Typography>
                <Stack sx={{ flexDirection: "row", justifyContent: "space-between", mb: "35px" }}>
                    <Select
                        id="likelihood-input"
                        label="Likelihood"
                        placeholder="Select likelihood of risk to happen"
                        value={values.likelihood}
                        onChange={(e) => handleOnChange("likelihood", e.target.value)}
                        items={[
                            { _id: 1, name: "Some value 1" },
                            { _id: 2, name: "Some value 2" },
                            { _id: 3, name: "Some value 3" },
                        ]}
                        sx={{ width: "324px", backgroundColor: theme.palette.background.main }}
                    />
                    <Select
                        id="risk-severity-input"
                        label="Risk severity"
                        placeholder="Select risk severity"
                        value={values.riskSeverity}
                        onChange={(e) => handleOnChange("riskSeverity", e.target.value)}
                        items={[
                            { _id: 1, name: "Some value 1" },
                            { _id: 2, name: "Some value 2" },
                            { _id: 3, name: "Some value 3" },
                        ]}
                        sx={{ width: "324px", backgroundColor: theme.palette.background.main }}
                    />
                    <Select
                        id="risk-level-input"
                        label="Risk level (auto-calculated)"
                        placeholder="Select risk level"
                        value={values.riskLevel}
                        onChange={(e) => handleOnChange("riskLevel", e.target.value)}
                        items={[
                            { _id: 1, name: "Some value 1" },
                            { _id: 2, name: "Some value 2" },
                            { _id: 3, name: "Some value 3" },
                        ]}
                        sx={{ width: "324px", backgroundColor: theme.palette.background.main }}
                    />
                </Stack>
                <Divider />
                <Stack sx={{ mt: "9px" }}>
                    <Field
                        id="review-notes-input"
                        label="Review notes"
                        type="description"
                        value={values.reviewNotes}
                        onChange={(e) => handleOnChange("reviewNotes", e.target.value)}
                        sx={{ backgroundColor: theme.palette.background.main }}
                    />
                </Stack>
            </Stack>
        )
    }

    return (
        <Stack component="form" noValidate>
            <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <TabList onChange={handleChange} aria-label="Add new risk tabs"
                        sx={{
                            minHeight: "20px",
                            "& .MuiTabs-flexContainer": { columnGap: "34px" }
                        }}
                    >
                        <Tab label="Risks" value="risks" sx={tabStyle} disableRipple={disableRipple} />
                        <Tab label="Mitigation" value="mitigation" sx={tabStyle} disableRipple={disableRipple} />
                    </TabList>
                </Box>
                <TabPanel value="risks" sx={{ p: "24px 0 0" }}>{riskTabRender()}</TabPanel>
                <TabPanel value="mitigation" sx={{ p: "24px 0 0" }}>

                </TabPanel>
            </TabContext>
        </Stack>
    )
}

export default AddNewRiskForm;