import { Box, Divider, Link, Stack, Typography, useTheme } from "@mui/material";
import { FC, useEffect, useState } from "react";
import StandardModal from "../StandardModal";
import Field from "../../Inputs/Field";
import { fieldStyle } from "../../Reporting/GenerateReport/GenerateReportFrom/styles";
import SelectComponent from "../../Inputs/Select";
import CustomizableButton from "../../Button/CustomizableButton";
import { ReactComponent as AddCircleOutlineIcon } from "../../../assets/icons/plus-circle-dark_grey.svg";
import {
    addNewStep,
    stepNumberStyle,
} from "./style";
import { ApprovalWorkflowStepModel } from "../../../../domain/models/Common/approvalWorkflow/approvalWorkflowStepModel";
import { logEngine } from "../../../../application/tools/log.engine";


const APPROVERS = [
    { _id: 1, name: "James Smith" },
    { _id: 2, name: "John Doe" },
];

const entities = [
    { _id: 1, name: "Use case" }
];

const conditions = [
    { _id: 1, name: "All" },
    { _id: 2, name: "Any" },
];

interface NewApprovalWorkflowFormErrors {
    workflow_title?: string;
    entity?: string;
    steps: NewApprovalWorkflowStepFormErrors[];
}

interface NewApprovalWorkflowStepFormErrors {

    step_name?: string;
    approver?: string;
    conditions?: string;
}

interface ICreateApprovalWorkflowProps {
    isOpen: boolean;
    setIsOpen: () => void;
    initialData?: {
        workflow_title: string;
        entity: number;
        steps: ApprovalWorkflowStepModel[];
    }
    isEdit?: boolean;
    mode?: string;
    onSuccess?: (data: {
        workflow_title: string;
        entity: number;
        steps: ApprovalWorkflowStepModel[];
    }) => void;
}

const CreateNewApprovalWorkflow: FC<ICreateApprovalWorkflowProps> = ({
    isOpen,
    setIsOpen,
    initialData,
    isEdit = false,
    mode,
    onSuccess
}) => {

    const theme = useTheme();
    const [errors, setErrors] = useState<NewApprovalWorkflowFormErrors>({ steps: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [stepsCount, setStepsCount] = useState(1);
    const [workflowTitle, setWorkflowTitle] = useState("");
    const [entity, setEntity] = useState(0);
    const [workflowSteps, setWorkflowSteps] = useState<ApprovalWorkflowStepModel[]>([]);

    useEffect(() => {
        if (initialData && isEdit) {
            setWorkflowTitle(initialData.workflow_title || "");
            setEntity(initialData.entity);
            if (initialData.steps && initialData.steps.length > 0) {
                setWorkflowSteps(initialData.steps.map(step =>
                    new ApprovalWorkflowStepModel(step)
                ));
                setStepsCount(initialData.steps.length)
            } else {
                setWorkflowSteps([new ApprovalWorkflowStepModel()]);
                setStepsCount(1)
            }
        } else {
            clearForm();
        }
    }, [initialData, isEdit]);

    const clearForm = () => {
        setWorkflowTitle("");
        setEntity(0);
        setWorkflowSteps([new ApprovalWorkflowStepModel()]);
        setStepsCount(1)
    }


    const validateForm = (): boolean => {
        const newErrors: NewApprovalWorkflowFormErrors = {
            steps: []
        };
        let hasErrors = false;
        
        if (!workflowTitle.trim()) {
            newErrors.workflow_title = "Workflow title is required.";
            hasErrors = true;
        }
        if (entity < 1) {
            newErrors.entity = "Entity is required.";
            hasErrors = true;
        }
        for (let i = 0; i < workflowSteps.length; i++) {
            const step = workflowSteps[i];
            newErrors.steps.push({})
            if (!step.step_name || !step.step_name.trim()) {
                newErrors.steps[i].step_name = "Step name is required.";
                hasErrors = true;
            }
            if (!step.approver) {
                newErrors.steps[i].approver = "Approver is required.";
                hasErrors = true;
            }
            if (!step.conditions) {
                newErrors.steps[i].conditions = "Conditions are required.";
                hasErrors = true;
            }
        }
        setErrors(newErrors);
        return !hasErrors;
    }
    
    const handleSave = () => {
        if (validateForm()) {
            const formData = {
                workflow_title: workflowTitle.trim(),
                entity: entity,
                steps: workflowSteps.map(
                    step => new ApprovalWorkflowStepModel({
                        step_name: step.step_name?.trim() || "",
                        approver: step.approver,
                        conditions: step.conditions,
                        description: step.description?.trim() || ""
                    })),
            };
            clearForm();
            onSuccess?.(formData);
        }
    };

    const handleNewStepClick = () => {
        setWorkflowSteps([...workflowSteps, new ApprovalWorkflowStepModel()]);
        setStepsCount(stepsCount + 1);
    };

    const removeStep = (stepIndex: number) => {
        const updatedSteps = workflowSteps.filter((_, index) => index !== stepIndex);
        setWorkflowSteps(updatedSteps);
        setStepsCount(updatedSteps.length);
    }

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={() => {
                clearForm();
                setIsOpen();
            }}
            title={isEdit ? "Edit approval workflow" : "New approval workflow"}
            description="Define a structured approval workflow with multiple steps, approvers, and conditions to ensure proper oversight and compliance."
            maxWidth="680px"
            onSubmit={handleSave}
            submitButtonText={isEdit ? "Update" : "Create workflow"}
            isSubmitting={isSubmitting}>
            <Stack spacing={8}>
                <Stack direction="row" spacing={6}>
                    <Field
                        id="title"
                        label="Workflow title"
                        width="50%"
                        error={errors.workflow_title}
                        isRequired
                        sx={fieldStyle}
                        placeholder="Enter workflow title"
                        value={workflowTitle}
                        onChange={(e) => setWorkflowTitle(e.target.value)}
                    />
                    <SelectComponent
                        items={entities}
                        value={entity}
                        sx={{
                            width: "50%",
                            backgroundColor: theme.palette.background.main,
                        }}
                        id="entity"
                        label="Entity"
                        error={errors.entity}
                        isRequired
                        onChange={(e: any) => setEntity(e.target.value)}
                        placeholder="Select entity"
                    />
                </Stack>
                {workflowSteps.map((step, stepIndex) => (
                    <Stack key={stepIndex} spacing={8}>
                        {/* STEPS */}
                        <Stack spacing={4}
                            sx={{
                                pt: stepIndex > 0 ? 8 : 0
                            }}>
                            <Stack direction="row" spacing={8}>
                                <Box sx={stepNumberStyle}>{stepIndex + 1}</Box>
                                <Typography fontWeight={500} fontSize={16}>
                                    {"STEP " + (stepIndex + 1)}
                                </Typography>
                                <Box sx={{
                                    flex: 1,
                                    display: "flex",
                                    justifyContent: "flex-start",
                                }}>
                                    <Link
                                        component="button"
                                        onClick={() => removeStep(stepIndex)}
                                        sx={{
                                            color: "#13715B",
                                            textDecoration: "underline",
                                            cursor: "pointer",
                                            fontSize: 13,
                                            fontWeight: 500,
                                            "&:hover": {
                                                color: "#0F5A47",
                                            },
                                            visibility: stepIndex === 0 ? "hidden" : "visible",
                                        }}
                                    >
                                        Remove step
                                    </Link>
                                </Box>
                            </Stack>
                            <Stack direction="row" alignItems="flex-start" >
                                <Box>
                                    <Divider
                                        orientation="vertical"
                                        flexItem
                                        sx={{
                                            borderRightWidth: "1px",
                                            height: "216px",
                                            borderColor: "#E0E0E0",
                                            mt: 4,
                                            ml: 6,
                                            mr: 12,
                                        }}
                                    />
                                </Box>
                                <Stack sx={{ flex: 1 }} spacing={6}>
                                    <Field
                                        id={`step_name_${stepIndex}`}
                                        label="Step name"
                                        width="100%"
                                        isRequired
                                        error={errors.steps[stepIndex]?.step_name}
                                        sx={fieldStyle}
                                        placeholder="Enter step name"
                                        value={step.step_name || ""}
                                        onChange={(e) => {
                                            const newSteps = [...workflowSteps];
                                            newSteps[stepIndex].step_name = e.target.value;
                                            setWorkflowSteps(newSteps);
                                        }}
                                    />
                                    <Stack direction="row" spacing={6}>
                                        <SelectComponent
                                            items={APPROVERS}
                                            value={step.approver || ""}
                                            sx={{
                                                width: "48%",
                                                backgroundColor: theme.palette.background.main,
                                            }}
                                            id={`approver-${stepIndex}`}
                                            label="Approver"
                                            isRequired
                                            error={errors.steps[stepIndex]?.approver}
                                            onChange={(e: any) => {
                                                const newSteps = [...workflowSteps];
                                                newSteps[stepIndex].approver = Number(e.target.value);
                                                setWorkflowSteps(newSteps);
                                            }}
                                            placeholder="Select approver"
                                        />
                                        <SelectComponent
                                            items={conditions}
                                            value={step.conditions || ""}
                                            sx={{
                                                width: "52%",
                                                backgroundColor: theme.palette.background.main,
                                            }}
                                            id={`conditions-${stepIndex}`}
                                            label="Conditions"
                                            isRequired
                                            error={errors.steps[stepIndex]?.conditions}
                                            onChange={(e: any) => {
                                                const newSteps = [...workflowSteps];
                                                newSteps[stepIndex].conditions = Number(e.target.value);
                                                setWorkflowSteps(newSteps);
                                            }}
                                            placeholder="Select conditions"
                                        />
                                    </Stack>
                                    <Field
                                        id={`description_${stepIndex}`}
                                        label="Description"
                                        width="100%"
                                        rows={2}
                                        type="description"
                                        value={step.description || ""}
                                        onChange={(e) => {
                                            const newSteps = [...workflowSteps];
                                            newSteps[stepIndex].description = e.target.value;
                                            setWorkflowSteps(newSteps);
                                        }}
                                        sx={{ ...fieldStyle, maxHeight: "115px" }}
                                        placeholder="Enter description"
                                    />
                                </Stack>
                            </Stack>
                        </Stack>
                    </Stack>
                ))}
                <Box data-joyride-id="add-step-button">
                    <CustomizableButton
                        variant="outlined"
                        text="Add step"
                        onClick={handleNewStepClick}
                        icon={<AddCircleOutlineIcon />}
                        sx={addNewStep}
                    />
                </Box>
            </Stack>
        </StandardModal>
    );
}

export default CreateNewApprovalWorkflow;