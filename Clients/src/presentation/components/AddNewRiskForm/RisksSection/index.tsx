import { Stack, Divider, Typography, useTheme } from "@mui/material"
import { FC, useState } from "react"
import Field from "../../Inputs/Field"
import Select from "../../Inputs/Select";
import RiskLevel from "../../RiskLevel";
import { Likelihood, Severity } from "../../RiskLevel/constants";

const RiskSection: FC = () => {
    const theme = useTheme();
    const [values, setValues] = useState({
        riskNameInput: "",
        actionOwner: "0",
        aiLifecyclePhase: "0",
        riskDescription: "",
        riskCategory: "0",
        potentialImpact: "",
        assessmentMapping: "0",
        controlsMapping: "0",
        likelihood: 1 as Likelihood,
        riskSeverity: 1 as Severity,
        riskLevel: "0",
        reviewNotes: ""

    });
    console.log(values.likelihood)
    const handleOnChange = (field: string, value: string | number) => {
        setValues((prevValues) => ({
            ...prevValues,
            [field]: value,
        }));
    };

    return (
        <Stack className="AddNewRiskForm">
            <Stack sx={{ flexDirection: "row", columnGap: 13, mb: 10 }}>
                <Stack sx={{ display: "grid", gridTemplateColumns: "324px 324px", columnGap: 13, rowGap: 8.5 }}>
                    <Field
                        id="risk-name-input"
                        label="Risk name"
                        placeholder="Write risk name"
                        width={324}
                        value={values.riskNameInput}
                        onChange={(e) => handleOnChange("riskNameInput", e.target.value)}
                        sx={{ 
                            backgroundColor: theme.palette.background.main,
                            "& input": {
                                padding: "0 14px"
                            }
                        }}
                    />
                    <Field
                        id="risk-description-input"
                        label="Risk description"
                        width={324}
                        value={values.riskDescription}
                        onChange={(e) => handleOnChange("riskDescription", e.target.value)}
                        sx={{ 
                            backgroundColor: theme.palette.background.main,
                            "& input": {
                                padding: "0 14px"
                            }
                        }}
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
                        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
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
                        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
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
                        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
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
                        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                    />
                </Stack>
                <Stack sx={{ rowGap: 8.5 }}>
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
                        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
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
            <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 6.5 }}>Calculate risk level</Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize, mb: 8 }}>The Risk Level is calculated by multiplying the Likelihood and Severity scores. By assigning these scores, the risk level will be determined based on your inputs.</Typography>
            <RiskLevel likelihood={values.likelihood} riskSeverity={values.riskSeverity} handleOnChange={handleOnChange} />
            <Divider />
            <Stack sx={{ mt: 4.5 }}>
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

export default RiskSection;