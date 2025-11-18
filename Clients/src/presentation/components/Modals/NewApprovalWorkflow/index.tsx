import { Box, Divider, Link, Stack, Typography, useTheme } from "@mui/material";
import { FC, useState } from "react";
import StandardModal from "../StandardModal";
import Field from "../../Inputs/Field";
import { fieldStyle } from "../../Reporting/GenerateReport/GenerateReportFrom/styles";
import SelectComponent from "../../Inputs/Select";
import CustomizableButton from "../../Button/CustomizableButton";
import {
    addNewStep,
    stepNumberStyle,
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
        <StandardModal
            isOpen={isOpen}
            onClose={() => {
                setIsOpen();
            }}
            title="Add new workflow"
            description="Define a structured approval workflow with multiple steps, approvers, and conditions to ensure proper oversight and compliance."
            maxWidth="680px">
            <Stack spacing={8}>
                <Stack direction="row" spacing={6}>
                    <Field
                        id="title"
                        label="Workflow title"
                        width="50%"
                        isRequired
                        sx={fieldStyle}
                        placeholder="Enter workflow title"
                    />
                    <SelectComponent
                        items={approverRoles}
                        value={""}
                        sx={{
                            width: "50%",
                            backgroundColor: theme.palette.background.main,
                        }}
                        id="entity"
                        label="Entity"
                        isRequired
                        onChange={() => { }}
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
                            <Stack direction="row" alignItems="center" spacing={8}>
                                <Box sx={stepNumberStyle}>{step + 1}</Box>
                                <Typography fontWeight={500} fontSize={16}>
                                    {"STEP " + (step + 1)}
                                </Typography>
                                <Box sx={{ 
                                    flex: 1,
                                    ml: -4,
                                    display: "flex",
                                    justifyContent: "flex-end",
                                 }}>
                                    <Link
                                        component="button"
                                        onClick={() => { }
                                        }
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
                                            height: "248px",
                                            borderColor: "#E0E0E0",
                                            mt: 6,
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
            </Stack>
        </StandardModal>
    );
}

export default CreateNewApprovalWorkflow;