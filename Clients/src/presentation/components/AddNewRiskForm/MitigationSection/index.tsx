import { FC, useState } from "react"
import Select from "../../Inputs/Select";
import { Button, Divider, SelectChangeEvent, Stack, Typography, useTheme } from "@mui/material";
import Field from "../../Inputs/Field";
import DatePicker from "../../Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import FileUpload from "../../Modals/FileUpload";
import RiskLevel from "../../RiskLevel";
import { Likelihood, Severity } from "../../RiskLevel/constants";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import Alert from "../../Alert";
import selectValidation from "../../../../application/validations/selectValidation";

interface MitigationSectionProps {
    closePopup: () => void
}

export interface MitigationFormValues {
    mitigationStatus: number,
    mitigationPlan: string,
    currentRiskLevel: number,
    implementationStrategy: string,
    deadline: string,
    doc: string,
    likelihood: Likelihood,
    riskSeverity: Severity,
    approver: number,
    approvalStatus: number,
    dateOfAssessment: string,
    recommendations: string
}

interface FormErrors {
    mitigationStatus?: string,
    mitigationPlan?: string,
    currentRiskLevel?: string,
    implementationStrategy?: string,
    deadline?: string,
    doc?: string,
    approver?: string,
    approvalStatus?: string,
    dateOfAssessment?: string,
    recommendations?: string
}

const initialState: MitigationFormValues = {
    mitigationStatus: 0,
    mitigationPlan: "",
    currentRiskLevel: 0,
    implementationStrategy: "",
    deadline: "",
    doc: "",
    likelihood: 1 as Likelihood,
    riskSeverity: 1 as Severity,
    approver: 0,
    approvalStatus: 0,
    dateOfAssessment: "",
    recommendations: ""
}

const MitigationSection: FC<MitigationSectionProps> = ({ closePopup }) => {
    const theme = useTheme();
    const [values, setValues] = useState<MitigationFormValues>(initialState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [alert, setAlert] = useState<{
        variant: "success" | "info" | "warning" | "error";
        title?: string;
        body: string;
      } | null>(null);

    const handleOnSelectChange = (prop: keyof MitigationFormValues) => (event: SelectChangeEvent<string | number>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
    };
    const handleDateChange = (field: string, newDate: Dayjs | null) => {
        setValues((prevValues) => ({
            ...prevValues,
            [field]: newDate ? newDate.toISOString() : ""
        }));
    };
    const handleOnTextFieldChange =
        (prop: keyof MitigationFormValues) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setValues({ ...values, [prop]: event.target.value });
                setErrors({ ...errors, [prop]: "" });
            };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        const mitigationPlan = checkStringValidation("Mitigation plan", values.mitigationPlan, 1, 1024);
        if (!mitigationPlan.accepted) {
            newErrors.mitigationPlan = mitigationPlan.message;
        }
        const implementationStrategy = checkStringValidation("Implementation strategy", values.implementationStrategy, 1, 1024);
        if (!implementationStrategy.accepted) {
            newErrors.implementationStrategy = implementationStrategy.message;
        }
        const recommendations = checkStringValidation("Recommendations", values.recommendations, 1, 1024);
        if (!recommendations.accepted) {
            newErrors.recommendations = recommendations.message;
        }
        const deadline = checkStringValidation("Recommendations", values.deadline, 1);
        if (!deadline.accepted) {
            newErrors.deadline = deadline.message;
        }
        const dateOfAssessment = checkStringValidation("Recommendations", values.dateOfAssessment, 1);
        if (!dateOfAssessment.accepted) {
            newErrors.dateOfAssessment = dateOfAssessment.message;
        }
        const mitigationStatus = selectValidation("Mitigation status", values.mitigationStatus);
        if (!mitigationStatus.accepted) {
          newErrors.mitigationStatus = mitigationStatus.message;
        }
        const currentRiskLevel = selectValidation("Current risk level", values.currentRiskLevel);
        if (!currentRiskLevel.accepted) {
          newErrors.currentRiskLevel = currentRiskLevel.message;
        }
        const approver = selectValidation("Approver", values.approver);
        if (!approver.accepted) {
          newErrors.approver = approver.message;
        }
        const approvalStatus = selectValidation("Approval status", values.approvalStatus);
        if (!approvalStatus.accepted) {
          newErrors.approvalStatus = approvalStatus.message;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (validateForm()) {
            //request to the backend
            closePopup();
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
                <Stack sx={{ flexDirection: "row", columnGap: 12.5, mb: 8 }}>
                    <Stack sx={{ rowGap: 8.5 }}>
                        <Select
                            id="mitigation-status-input"
                            label="Mitigation status"
                            placeholder="Select status"
                            value={values.mitigationStatus}
                            onChange={handleOnSelectChange("mitigationStatus")}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                            isRequired
                            error={errors.mitigationStatus}
                        />
                        <Field
                            id="mitigation-plan-input"
                            label="Mitigation plan"
                            type="description"
                            value={values.mitigationPlan}
                            onChange={handleOnTextFieldChange("mitigationPlan")}
                            sx={{ backgroundColor: theme.palette.background.main }}
                            isRequired
                            error={errors.mitigationPlan}
                        />
                    </Stack>
                    <Stack sx={{ rowGap: 8.5 }}>
                        <Select
                            id="current-risk-level-input"
                            label="Current risk level"
                            placeholder="Select risk level"
                            value={values.currentRiskLevel}
                            onChange={handleOnSelectChange("currentRiskLevel")}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                            isRequired
                            error={errors.currentRiskLevel}
                        />
                        <Field
                            id="implementation-strategy-input"
                            label="Implementation strategy"
                            type="description"
                            value={values.implementationStrategy}
                            onChange={handleOnTextFieldChange("implementationStrategy")}
                            sx={{ backgroundColor: theme.palette.background.main }}
                            isRequired
                            error={errors.implementationStrategy}
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
                            isRequired
                            error={errors.deadline}
                        />
                        <FileUpload />
                    </Stack>
                </Stack>
                <Divider />
                <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 8, mb: 3 }}>Residual risk level</Typography>
                <Typography sx={{ fontSize: theme.typography.fontSize, mb: 4.5 }}>The Risk Level is calculated by multiplying the Likelihood and Severity scores. By assigning these scores, the risk level will be determined based on your inputs.</Typography>
                <RiskLevel likelihood={values.likelihood} riskSeverity={values.riskSeverity} handleOnSelectChange={handleOnSelectChange} />
                <Divider />
                <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 8, mb: 4.5 }}>Risk approval</Typography>
                <Stack sx={{ flexDirection: "row", columnGap: 12.5, mb: 9.5 }}>
                    <Select
                        id="approver-input"
                        label="Approver"
                        placeholder="Select approver"
                        value={values.approver}
                        onChange={handleOnSelectChange("approver")}
                        items={[
                            { _id: 1, name: "Some value 1" },
                            { _id: 2, name: "Some value 2" },
                            { _id: 3, name: "Some value 3" },
                        ]}
                        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                        isRequired
                        error={errors.approver}
                    />
                    <Select
                        id="approval-status-input"
                        label="Approval status"
                        placeholder="Select status"
                        value={values.approvalStatus}
                        onChange={handleOnSelectChange("approvalStatus")}
                        items={[
                            { _id: 1, name: "Some value 1" },
                            { _id: 2, name: "Some value 2" },
                            { _id: 3, name: "Some value 3" },
                        ]}
                        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                        isRequired
                        error={errors.approvalStatus}
                    />
                    <DatePicker
                        label="Start date"
                        date={values.dateOfAssessment ? dayjs(values.dateOfAssessment) : null}
                        handleDateChange={(e) => handleDateChange("dateOfAssessment", e)}
                        sx={{
                            width: 130,
                            "& input": { width: 85 }
                        }}
                        isRequired
                        error={errors.dateOfAssessment}
                    />
                </Stack>
                <Field
                    id="recommendations-input"
                    label="Recommendations"
                    type="description"
                    value={values.recommendations}
                    onChange={handleOnTextFieldChange("recommendations")}
                    sx={{ backgroundColor: theme.palette.background.main }}
                    isOptional
                />
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
                >Save</Button>
            </Stack>
        </Stack>
    )
};

export default MitigationSection;