import { FC, useState } from "react"
import Select from "../../Inputs/Select";
import { Divider, Stack, Typography, useTheme } from "@mui/material";
import Field from "../../Inputs/Field";
import DatePicker from "../../Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import FileUpload from "../../Modals/FileUpload";

const MitigationSection: FC = () => {
    const theme = useTheme();
    const [values, setValues] = useState({
        mitigationStatus: "Select status",
        mitigationPlan: "",
        currentRiskLevel: "Select risk Level",
        implementationStrategy: "",
        deadline: "",
        doc: "",
        likelihood: "Select risk severity",
        riskSeverity: "Select risk severity",
        riskLevel: "Select risk level",
        approver: "Select approver",
        approvalStatus: "Select status",
        dateOfAssessment: "",
        recommendations: ""
    });
    const handleOnChange = (field: string, value: string | number) => {
        setValues((prevValues) => ({
            ...prevValues,
            [field]: value,
        }));
    };
    const handleDateChange = (field: string, newDate: Dayjs | null) => {
        setValues((prevValues) => ({
            ...prevValues,
            [field]: newDate ? newDate.toISOString() : ""
        }));
    };

    return (
        <Stack>
            <Stack sx={{ flexDirection: "row", columnGap: 12.5, mb: 8 }}>
                <Stack sx={{ rowGap: 8.5 }}>
                    <Select
                        id="mitigation-status-input"
                        label="Mitigation status"
                        placeholder="Select status"
                        value={values.mitigationStatus}
                        onChange={(e) => handleOnChange("mitigationStatus", e.target.value)}
                        items={[
                            { _id: 1, name: "Some value 1" },
                            { _id: 2, name: "Some value 2" },
                            { _id: 3, name: "Some value 3" },
                        ]}
                        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                    />
                    <Field
                        id="mitigation-plan-input"
                        label="Mitigation plan"
                        type="description"
                        value={values.mitigationPlan}
                        onChange={(e) => handleOnChange("mitigationPlan", e.target.value)}
                        sx={{ backgroundColor: theme.palette.background.main }}
                    />
                </Stack>
                <Stack sx={{ rowGap: 8.5 }}>
                    <Select
                        id="current-risk-level-input"
                        label="Current risk level"
                        placeholder="Select risk level"
                        value={values.currentRiskLevel}
                        onChange={(e) => handleOnChange("currentRiskLevel", e.target.value)}
                        items={[
                            { _id: 1, name: "Some value 1" },
                            { _id: 2, name: "Some value 2" },
                            { _id: 3, name: "Some value 3" },
                        ]}
                        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                    />
                    <Field
                        id="implementation-strategy-input"
                        label="Implementation strategy"
                        type="description"
                        value={values.implementationStrategy}
                        onChange={(e) => handleOnChange("implementationStrategy", e.target.value)}
                        sx={{ backgroundColor: theme.palette.background.main }}
                    />
                </Stack>
                <Stack sx={{ rowGap: 8.5 }}>
                    <DatePicker
                        label="Start date"
                        date={values.deadline ? dayjs(values.deadline) : null}
                        handleDateChange={(e) => handleDateChange("deadline", e)}
                        sx={{
                            width: 130,
                            "& input": { width: 85 }
                        }}
                    />
                    <FileUpload />
                </Stack>
            </Stack>
            <Divider />
            <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 8, mb: 3 }}>Residual risk level</Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize, mb: 4.5 }}>The Risk Level is calculated by multiplying the Likelihood and Severity scores. By assigning these scores, the risk level will be determined based on your inputs.</Typography>
            <Stack sx={{ flexDirection: "row", justifyContent: "space-between", columnGap: 12.5, mb: 12.5 }}>
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
                    sx={{ width: 324, backgroundColor: theme.palette.background.main }}
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
                    sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                />
                <Select
                    id="risk-level-input"
                    label="Risk level"
                    placeholder="Select risk level"
                    value={values.riskLevel}
                    onChange={(e) => handleOnChange("riskLevel", e.target.value)}
                    items={[
                        { _id: 1, name: "Some value 1" },
                        { _id: 2, name: "Some value 2" },
                        { _id: 3, name: "Some value 3" },
                    ]}
                    sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                />
            </Stack>
            <Divider />
            <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 8, mb: 4.5 }}>Risk approval</Typography>
            <Stack sx={{ flexDirection: "row", columnGap: 12.5, mb: 9.5 }}>
                <Select
                    id="approver-input"
                    label="Approver"
                    placeholder="Select approver"
                    value={values.approver}
                    onChange={(e) => handleOnChange("approver", e.target.value)}
                    items={[
                        { _id: 1, name: "Some value 1" },
                        { _id: 2, name: "Some value 2" },
                        { _id: 3, name: "Some value 3" },
                    ]}
                    sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                />
                <Select
                    id="approval-status-input"
                    label="Approval status"
                    placeholder="Select status"
                    value={values.approvalStatus}
                    onChange={(e) => handleOnChange("approvalStatus", e.target.value)}
                    items={[
                        { _id: 1, name: "Some value 1" },
                        { _id: 2, name: "Some value 2" },
                        { _id: 3, name: "Some value 3" },
                    ]}
                    sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                />
                <DatePicker
                    label="Start date"
                    date={values.dateOfAssessment ? dayjs(values.dateOfAssessment) : null}
                    handleDateChange={(e) => handleDateChange("dateOfAssessment", e)}
                    sx={{
                        width: 130,
                        "& input": { width: 85 }
                    }}
                />
            </Stack>
            <Field
                id="recommendations-input"
                label="Recommendations"
                type="description"
                value={values.recommendations}
                onChange={(e) => handleOnChange("recommendations", e.target.value)}
                sx={{ backgroundColor: theme.palette.background.main }}
            />
        </Stack>
    )
};

export default MitigationSection;