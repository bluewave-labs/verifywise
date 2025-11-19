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


const approverRoles = [
    { _id: 1, name: "Bussiness owner" },
    { _id: 2, name: "Product owner" },
];

const entities = [
    { _id: 1, name: "Use case" }
];

const conditions = [
    { _id: 1, name: "All" },
    { _id: 2, name: "Any" },
];

interface ICreateApprovalWorkflowProps {
    isOpen: boolean;
    setIsOpen: () => void;
    initialData?: {
        workflow_title: string;
        entity_name: string;
        steps: ApprovalWorkflowStepModel[];
    }
    isEdit?: boolean;
    mode?: "create" | "edit";
}

const CreateNewApprovalWorkflow: FC<ICreateApprovalWorkflowProps> = ({
    isOpen,
    setIsOpen,
    initialData,
    isEdit = false,
    mode,
}) => {

    const theme = useTheme();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [stepsCount, setStepsCount] = useState(1);
    const [workflowTitle, setWorkflowTitle] = useState("");
    const [entityName, setEntityName] = useState("");
    const [workflowSteps, setWorkflowSteps] = useState<ApprovalWorkflowStepModel[]>([]);

    useEffect(() => {
        if (initialData && isEdit) {
            setWorkflowTitle(initialData.workflow_title || "");
            setEntityName(initialData.entity_name || "");
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
            setWorkflowTitle("");
            setEntityName("");
            setWorkflowSteps([new ApprovalWorkflowStepModel()]);
            setStepsCount(1)
        }
    }, [initialData, isEdit]);

    const handleNewStepClick = () => setStepsCount(stepsCount + 1);
    const removeStep = (step: number) => {
        if (stepsCount > 1) {
            setStepsCount(stepsCount - 1);
        }
    }

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={() => {
                setIsOpen();
            }}
            title="Add new workflow"
            description="Define a structured approval workflow with multiple steps, approvers, and conditions to ensure proper oversight and compliance."
            maxWidth="680px"
            onSubmit={() => { }}
            submitButtonText="Create workflow"
            isSubmitting={isSubmitting}>
            <Stack spacing={8}>
                <Stack direction="row" spacing={6}>
                    <Field
                        id="title"
                        label="Workflow title"
                        width="50%"
                        isRequired
                        sx={fieldStyle}
                        placeholder="Enter workflow title"
                        value={workflowTitle}
                        onChange={(e) => setWorkflowTitle(e.target.value)}
                    />
                    <SelectComponent
                        items={entities}
                        value={""}
                        sx={{
                            width: "50%",
                            backgroundColor: theme.palette.background.main,
                        }}
                        id="entity"
                        label="Entity"
                        isRequired
                        onChange={(e: any) => setEntityName(e.target.value)}
                        placeholder="Select entity"
                    />
                </Stack>
                {[...Array(stepsCount)].map((_, step) => (
                    <Stack spacing={8}>
                        {/* STEPS */}
                        <Stack spacing={4}
                            sx={{
                                pt: step > 0 ? 8 : 0
                            }}>
                            <Stack direction="row" spacing={8}>
                                <Box sx={stepNumberStyle}>{step + 1}</Box>
                                <Typography fontWeight={500} fontSize={16}>
                                    {"STEP " + (step + 1)}
                                </Typography>
                                <Box sx={{
                                    flex: 1,
                                    display: "flex",
                                    justifyContent: "flex-start",
                                }}>
                                    <Link
                                        component="button"
                                        onClick={() => removeStep(step)}
                                        sx={{
                                            color: "#13715B",
                                            textDecoration: "underline",
                                            cursor: "pointer",
                                            fontSize: 13,
                                            fontWeight: 500,
                                            "&:hover": {
                                                color: "#0F5A47",
                                            },
                                            visibility: step === 0 ? "hidden" : "visible",
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
                                        id="title"
                                        label="Step name"
                                        width="100%"
                                        isRequired
                                        sx={fieldStyle}
                                        placeholder="Enter step name"
                                    />
                                    <Stack direction="row" spacing={6}>
                                        <SelectComponent
                                            items={approverRoles}
                                            value={""}
                                            sx={{
                                                width: "48%",
                                                backgroundColor: theme.palette.background.main,
                                            }}
                                            id="approver"
                                            label="Approver"
                                            isRequired
                                            onChange={() => { }}
                                            placeholder="Select approver"
                                        />
                                        <SelectComponent
                                            items={conditions}
                                            value={""}
                                            sx={{
                                                width: "52%",
                                                backgroundColor: theme.palette.background.main,
                                            }}
                                            id="status"
                                            label="Conditions"
                                            isRequired
                                            onChange={() => { }}
                                            placeholder="Select status"
                                        />
                                    </Stack>
                                    <Field
                                        id="description"
                                        label="Description"
                                        width="100%"
                                        max-height="115px"
                                        rows={2}
                                        type="description"
                                        onChange={() => { }}
                                        sx={fieldStyle}
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