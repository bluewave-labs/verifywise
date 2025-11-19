import { Box, Stack } from "@mui/material"
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import ApprovalWorkflowsTable from "./ApprovalWorkflowsTable";
import { useState, useMemo, useEffect } from "react";
import { ApprovalWorkflowModel } from "../../../domain/models/Common/approvalWorkflow/approvalWorkflow.model";
import { logEngine } from "../../../application/tools/log.engine";
import {
    addNewWorkflowButton,
    workflowMainStack
} from "./style";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg";
import CreateNewApprovalWorkflow from "../../components/Modals/NewApprovalWorkflow";
import { log } from "console";

const ApprovalWorkflows: React.FC = () => {
    const [workflowData, setWorkflowData] = useState<ApprovalWorkflowModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectWorkflow, setSelectWorkflow] = useState<ApprovalWorkflowModel | null>(null);
    const [selectWorkflowId, setSelectWorkflowId] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState("")

    const MOCK_WORKFLOWS: ApprovalWorkflowModel[] = [
        new ApprovalWorkflowModel({
            id: 1,
            type: "approval",
            workflow_title: "Model Deployment Approval",
            entity_name: "Use case",
            steps: [
                {
                    step_name: "Initial Review",
                    approver: "Business owner",
                    conditions: "Any",
                    description: "Review the model deployment request and initial documentation"
                },
                {
                    step_name: "Technical Validation",
                    approver: "John Doe",
                    conditions: "One can approve",
                    description: "Validate technical requirements and compliance"
                }
            ],
            approval_status: "Pending" as any,
            date_updated: new Date(),
        }),
        new ApprovalWorkflowModel({
            id: 2,
            type: "approval",
            workflow_title: "Risk Assessment Approval",
            entity_name: "Use case",
            steps: [
                {
                    step_name: "Risk Analysis",
                    approver: "John Doe",
                    conditions: "Any",
                    description: "Analyze potential risks and impacts"
                }
            ],
            approval_status: "Approved" as any,
            date_updated: new Date(),
        }),
    ];



    const [isNewWorkflowModalOpen, setIsNewWorkflowModalOpen] = useState(false);

    /** -------------------- FILTERING -------------------- */
    const filteredData = useMemo(() => {
        return workflowData;
    }, [workflowData]);


    /** -------------------- FETCHING ON LOAD -------------------- */
    const fetchApprovalWorkflowData = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const formatted = MOCK_WORKFLOWS;

            //TO-DO: fetch approval workflows from API


            setWorkflowData(formatted);

        } catch (error) {
            logEngine({
                type: "error",
                message: `Failed to fetch approval workflows: ${error}`,
            });
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };


    /** -------------------- FETCHING BY SELECTED ID -------------------- */
    const fetchWorkflowDataById = async (id: string) => {
        try {
            setIsLoading(true);

            const workflowFromState = workflowData.find(w => w.id?.toString() === id);
            if (workflowFromState) {
                setSelectWorkflow(workflowFromState);
                return workflowFromState;
            }

            const mockWorkflow = MOCK_WORKFLOWS.find(w => w.id?.toString() === id);
            if (mockWorkflow) {
                setSelectWorkflow(mockWorkflow);
                return mockWorkflow;
            }

            logEngine({
                type: "error",
                message: "No workflow data found for this ID.",
            });
            return
        }
        catch (error) {
            logEngine({
                type: "error",
                message: `Failed to fetch workflow by ID: ${error}`,
            });
            return null;
        }
        finally {
            setIsLoading(false);
        }
    };

    /** -------------------- INITIAL LOAD -------------------- */
    useEffect(() => {
        fetchApprovalWorkflowData();
    }, []);

    /** -------------------- WORKFLOW MODAL HANDLERS -------------------- */
    const handleNewWorkflowClick = () => setIsNewWorkflowModalOpen(true);

    const handleEditWorkflowClick =  async (id: string, mode: string) => {
        setSelectWorkflowId(id);
        setModalMode(mode);
        const workflow = await fetchWorkflowDataById(id);
        if (workflow) {
            setIsNewWorkflowModalOpen(true);
        }
    }

    const handleCloseModal = () => {
        setIsNewWorkflowModalOpen(false);
        setSelectWorkflow(null);
        setSelectWorkflowId(null);
        setModalMode("");
    }

    /** -------------------- RENDER -------------------- */
    return (
        <Stack className="vwhome" gap={"16px"}>
            <PageBreadcrumbs />

            <Stack sx={workflowMainStack}>
                <Stack>
                    <PageHeader
                        title="Approval Workflows"
                        description="A structured overview of all approval processes, including steps, conditions, and current status."
                    />
                </Stack>
                <Stack
                    direction="row"
                    justifyContent="right"
                >
                    <Box data-joyride-id="add-incident-button">
                        <CustomizableButton
                            variant="contained"
                            sx={addNewWorkflowButton}
                            text="Add new workflow"
                            icon={<AddCircleOutlineIcon />}
                            onClick={handleNewWorkflowClick}
                        />
                    </Box>
                </Stack>
                {/* Approval Table */}
                <ApprovalWorkflowsTable
                    data={filteredData}
                    isLoading={isLoading}
                    onEdit={handleCloseModal}
                />
            </Stack>
            <CreateNewApprovalWorkflow
                isOpen={isNewWorkflowModalOpen}
                setIsOpen={handleCloseModal}
            />
        </Stack>
    )
}

export default ApprovalWorkflows;