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

const ApprovalWorkflows: React.FC = () => {
    const [workflowData, setWorkflowData] = useState<ApprovalWorkflowModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isNewWorkflowModalOpen, setIsNewWorkflowModalOpen] = useState(false);

    /** -------------------- FILTERING -------------------- */
    const filteredData = useMemo(() => {
        return workflowData;
    }, [workflowData]);


    /** -------------------- FETCHING -------------------- */
    const fetchApprovalWorlflowData = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const formatted = new Array<ApprovalWorkflowModel>();
        
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

    /** -------------------- INITIAL LOAD -------------------- */
    useEffect(() => {
        fetchApprovalWorlflowData();
    }, []);

    /** -------------------- INCIDENT MODAL HANDLERS -------------------- */
    const handleNewWorkflowClick = () => setIsNewWorkflowModalOpen(true);

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
                />

            </Stack>
            <CreateNewApprovalWorkflow
                isOpen={isNewWorkflowModalOpen}
                setIsOpen={() => setIsNewWorkflowModalOpen(false)}
                // onSuccess={handleIncidentSuccess} value={""} handleChange={function (event: React.SyntheticEvent, newValue: string): void {
                //     throw new Error("Function not implemented.");
                // } } vendors={[]}                
                // initialData={
                //     selectedIncident
                //         ? {
                //               incident_id: selectedIncident.incident_id || "",
                //               ai_project: selectedIncident.ai_project || "",
                //               type: selectedIncident.type || "",
                //               severity: selectedIncident.severity || "",
                //               status: selectedIncident.status || "",
                //               occurred_date: selectedIncident.occurred_date
                //                   ? new Date(selectedIncident.occurred_date)
                //                         .toISOString()
                //                         .split("T")[0]
                //                   : new Date().toISOString().split("T")[0],
                //               date_detected: selectedIncident.date_detected
                //                   ? new Date(selectedIncident.date_detected)
                //                         .toISOString()
                //                         .split("T")[0]
                //                   : new Date().toISOString().split("T")[0],
                //               reporter: selectedIncident.reporter,
                //               categories_of_harm:
                //                   selectedIncident.categories_of_harm || [],
                //               description: selectedIncident.description,
                //               affected_persons_groups:
                //                   selectedIncident.affected_persons_groups ||
                //                   "",
                //               relationship_causality:
                //                   selectedIncident.relationship_causality || "",
                //               immediate_mitigations:
                //                   selectedIncident.immediate_mitigations || "",
                //               planned_corrective_actions:
                //                   selectedIncident.planned_corrective_actions ||
                //                   "",
                //               model_system_version:
                //                   selectedIncident.model_system_version,
                //               interim_report:
                //                   selectedIncident.interim_report || false,
                //               approval_status: selectedIncident.approval_status,
                //               approved_by: selectedIncident.approved_by,
                //               approval_date: selectedIncident.approval_date
                //                   ? new Date(selectedIncident.approval_date)
                //                         .toISOString()
                //                         .split("T")[0]
                //                   : new Date().toISOString().split("T")[0],
                //               approval_notes: selectedIncident.approval_notes,
                //           }
                //         : undefined
                // }
                //isEdit={!!selectedIncident}
                //mode={mode}
            />
        </Stack>


    )
}

export default ApprovalWorkflows;