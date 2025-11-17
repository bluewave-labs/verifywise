import { Box, Stack, Typography, useTheme } from "@mui/material";
import { FC, useState } from "react";
import StandardModal from "../StandardModal";
import Field from "../../Inputs/Field";
import { fieldStyle } from "../../Reporting/GenerateReport/GenerateReportFrom/styles";
import SelectComponent from "../../Inputs/Select";
import CustomizableButton from "../../Button/CustomizableButton";
import {
    addNewStep,
} from "./style";


const approverRoles = [
    { _id: 1, name: "Bussiness owner" },
    { _id: 2, name: "Product owner" },
];

const conditions = [
    { _id: 1, name: "Any" },
    { _id: 2, name: "One can approve" },
];

interface ICreateApprovalWorkflowProps {
    isOpen: boolean;
    setIsOpen: () => void;
}

const CreateNewApprovalWorkflow: FC<ICreateApprovalWorkflowProps> = ({
    isOpen,
    setIsOpen,
}) => {

    const theme = useTheme();

    const [stepsCount, setStepsCount] = useState(1);

    const handleNewStepClick = () => setStepsCount(stepsCount + 1);

    return (
        <Stack >
            <StandardModal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen();
                }}
                title="Add new workflow"
                description="Define a structured approval workflow with multiple steps, approvers, and conditions to ensure proper oversight and compliance."
                maxWidth="1000px">
                {[...Array(stepsCount)].map((_, step) => (

                    <Stack spacing={12}>
                        {/* Row 1: Task title | Entity */}
                        <Stack direction="row" spacing={6}>
                            <Field
                                id="title"
                                label="Workflow title"
                                width="350px"
                                isRequired
                                sx={fieldStyle}
                                placeholder="Enter workflow title"
                            />

                            <SelectComponent
                                items={approverRoles}
                                value={""}
                                sx={{
                                    width: "350px",
                                    backgroundColor: theme.palette.background.main,
                                }}
                                id="status"
                                label="Entity"
                                isRequired
                                onChange={() => { }}
                                placeholder="Select entity"
                            />
                        </Stack>
                        {/* STEPS */}
                        <Stack spacing={16}>
                            {/* STEP 1 */}
                            <Stack spacing={6}>
                                <Typography
                                    fontWeight={500}
                                    fontSize={16}
                                >
                                    {"STEP " + (step + 1)}
                                </Typography>
                                <Field
                                    id="title"
                                    label="Step name"
                                    width="350px"
                                    isRequired
                                    sx={fieldStyle}
                                    placeholder="Enter step name"
                                />

                                {/* Row 2: Status | Categories */}
                                <Stack direction="row" spacing={6}>
                                    <SelectComponent
                                        items={approverRoles}
                                        value={""}
                                        sx={{
                                            width: "350px",
                                            backgroundColor: theme.palette.background.main,
                                        }}
                                        id="status"
                                        label="Approver"
                                        isRequired
                                        onChange={() => { }}
                                        placeholder="Select status"
                                    />

                                    <SelectComponent
                                        items={conditions}
                                        value={""}
                                        sx={{
                                            width: "350px",
                                            backgroundColor: theme.palette.background.main,
                                        }}
                                        id="status"
                                        label="Conditions"
                                        isRequired
                                        onChange={() => { }}
                                        placeholder="Select status"
                                    />
                                </Stack>
                                {/* Row 3: Description */}
                                <Stack>
                                    <Field
                                        id="description"
                                        label="Description"
                                        width="100%"
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
                <Box data-joyride-id="add-incident-button">
                    <CustomizableButton
                        variant="contained"
                        sx={addNewStep}
                        text="Add step"
                        onClick={handleNewStepClick}
                    />
                </Box>
            </StandardModal>
        </Stack>
    );
}

export default CreateNewApprovalWorkflow;