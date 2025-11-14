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

const ApprovalWorkflows: React.FC = () => {
    const [workflowData, setWorkflowData] = useState<ApprovalWorkflowModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
                        />
                    </Box>
                </Stack>
                {/* Approval Table */}
                <ApprovalWorkflowsTable
                    data={filteredData}
                    isLoading={isLoading}
                />

            </Stack>
        </Stack>


    )
}

export default ApprovalWorkflows;