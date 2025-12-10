import { Box, Stack } from "@mui/material"
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import ApprovalWorkflowsTable from "./ApprovalWorkflowsTable";
import { useState, useMemo, useEffect, useCallback } from "react";
import { ApprovalWorkflowModel } from "../../../domain/models/Common/approvalWorkflow/approvalWorkflow.model";
import { logEngine } from "../../../application/tools/log.engine";
import { addNewWorkflowButton, workflowMainStack, filterSearchContainer } from "./style";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg";
import CreateNewApprovalWorkflow from "../../components/Modals/NewApprovalWorkflow";
import { ApprovalWorkflowStepModel } from "../../../domain/models/Common/approvalWorkflow/approvalWorkflowStepModel";
import { ApprovalStatus } from "../../../domain/enums/aiApprovalWorkflow.enum";
import { FilterBy, FilterColumn } from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import { SearchBox } from "../../components/Search";
import { MOCK_WORKFLOWS } from "./mockData";

const ApprovalWorkflows: React.FC = () => {

    const [workflowData, setWorkflowData] = useState<ApprovalWorkflowModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectWorkflow, setSelectWorkflow] = useState<ApprovalWorkflowModel | null>(null);
    const [selectWorkflowId, setSelectWorkflowId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isNewWorkflowModalOpen, setIsNewWorkflowModalOpen] = useState(false);


    // FilterBy - Filter columns configuration
    const workflowFilterColumns: FilterColumn[] = useMemo(() => [
        {
            id: 'workflow_title',
            label: 'Title',
            type: 'text' as const,
        },
        {
            id: 'entity',
            label: 'Entity',
            type: 'select' as const,
            options: [
                { value: '1', label: 'Use case' },
            ],
        },
        {
            id: 'approval_status',
            label: 'Approval Status',
            type: 'select' as const,
            options: [
                { value: ApprovalStatus.PENDING, label: 'Pending' },
                { value: ApprovalStatus.APPROVED, label: 'Approved' },
                { value: ApprovalStatus.REJECTED, label: 'Rejected' },
            ],
        },
    ], []);

    // FilterBy - Field value getter
    const getWorkflowFieldValue = useCallback(
        (item: ApprovalWorkflowModel, fieldId: string): string | number | Date | null | undefined => {
            switch (fieldId) {
                case 'workflow_title':
                    return item.workflow_title;
                case 'entity':
                    return item.entity?.toString();
                case 'approval_status':
                    return item.approval_status;
                default:
                    return null;
            }
        },
        []
    );

    // FilterBy - Initialize hook
    const { filterData: filterWorkflowData, handleFilterChange: handleWorkflowFilterChange } = useFilterBy<ApprovalWorkflowModel>(getWorkflowFieldValue);

    /** -------------------- FILTERING -------------------- */
    const filteredData = useMemo(() => {
        // Apply FilterBy conditions
        let result = filterWorkflowData(workflowData);

        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter((w) =>
                (w.workflow_title || "").toLowerCase().includes(search) ||
                (w.id || "").toString().toLowerCase().includes(search)
            );
        }

        return result;
    }, [filterWorkflowData, workflowData, searchTerm]);


    /** -------------------- FETCHING ON LOAD -------------------- */
    const fetchApprovalWorkflowData = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            if (!workflowData || workflowData.length === 0) {
                setWorkflowData(MOCK_WORKFLOWS);
            }
            //TO-DO: fetch approval workflows from API

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
            return null;
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

    const handleEditWorkflowClick = async (id: string) => {
        setSelectWorkflowId(id);
        const workflow = await fetchWorkflowDataById(id);
        if (workflow) {
            setIsNewWorkflowModalOpen(true);
        }
    }

    const handleWorkflowSuccess = async (formData: {
        workflow_title: string;
        entity: number;
        steps: ApprovalWorkflowStepModel[];
    }) => {
        try {
            if (selectWorkflow) {
                logEngine({
                    type: "info",
                    message: `Would update workflow ${selectWorkflow.id} with: ${JSON.stringify(formData)}`,
                });

                //TO-DO: call API to update workflow
                const updatedWorkflow = new ApprovalWorkflowModel({
                    ...selectWorkflow,
                    workflow_title: formData.workflow_title,
                    entity: formData.entity,
                    steps: formData.steps.map(step => new ApprovalWorkflowStepModel(step)),
                    date_updated: new Date(),
                });

                setWorkflowData(prev => prev.map(w => w.id === selectWorkflow.id ? updatedWorkflow : w)
                );

                logEngine({
                    type: "info",
                    message: "Workflow updated successfully!",
                });
            } else {
                logEngine({
                    type: "info",
                    message: `Would create new workflow with: ${JSON.stringify(formData)}`,
                });

                const newWorkflow = new ApprovalWorkflowModel({
                    id: workflowData.length > 0
                        ? Math.max(...workflowData.map(w => w.id || 0)) + 1
                        : 1,
                    type: "approval",
                    workflow_title: formData.workflow_title,
                    entity: formData.entity,
                    steps: formData.steps.map(step => new ApprovalWorkflowStepModel(step)),
                    approval_status: ApprovalStatus.PENDING,
                    date_updated: new Date(),
                });

                setWorkflowData(prev => [...prev, newWorkflow]);
                logEngine({
                    type: "info",
                    message: "Workflow created successfully!",
                });
            }
            handleCloseModal();
            await fetchApprovalWorkflowData(false);
        } catch (error) {
            logEngine({
                type: "error",
                message: `Failed to save workflow: ${error}`,
            });
        }
    };

    const handleCloseModal = () => {
        setIsNewWorkflowModalOpen(false);
        setSelectWorkflow(null);
        setSelectWorkflowId(null);
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
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    sx={filterSearchContainer}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <FilterBy
                            columns={workflowFilterColumns}
                            onFilterChange={handleWorkflowFilterChange}
                        />
                        <SearchBox
                            placeholder="Search workflows..."
                            value={searchTerm}
                            onChange={setSearchTerm}
                            inputProps={{ "aria-label": "Search workflows" }}
                            fullWidth={false}
                        />
                       
                    </Stack>
                    <Box data-joyride-id="add-workflow-button">
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
                    onEdit={handleEditWorkflowClick}
                />
            </Stack>
            <CreateNewApprovalWorkflow
                isOpen={isNewWorkflowModalOpen}
                setIsOpen={handleCloseModal}
                initialData={
                    selectWorkflow
                        ? {
                            workflow_title: selectWorkflow.workflow_title || "",
                            entity: selectWorkflow.entity ?? 0,
                            steps: selectWorkflow?.steps || [],
                        }
                        : undefined
                }
                isEdit={!!selectWorkflow}
                onSuccess={handleWorkflowSuccess}
            />
        </Stack>
    )
}

export default ApprovalWorkflows;