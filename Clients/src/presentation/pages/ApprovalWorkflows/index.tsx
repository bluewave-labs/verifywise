import { Box, Stack } from "@mui/material"
import { TabContext, TabPanel } from "@mui/lab";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import TabBar from "../../components/TabBar";
import ApprovalWorkflowsTable from "./ApprovalWorkflowsTable";
import { useState, useMemo, useEffect, useCallback } from "react";
import { ApprovalWorkflowModel } from "../../../domain/models/Common/approvalWorkflow/approvalWorkflow.model";
import { logEngine } from "../../../application/tools/log.engine";
import { addNewWorkflowButton, workflowMainStack, filterSearchContainer } from "./style";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg";
import CreateNewApprovalWorkflow from "../../components/Modals/NewApprovalWorkflow";
import RequestorApprovalModal from "../../components/Modals/RequestorApprovalModal";
import { ApprovalWorkflowStepModel } from "../../../domain/models/Common/approvalWorkflow/approvalWorkflowStepModel";
import { ApprovalStatus } from "../../../domain/enums/aiApprovalWorkflow.enum";
import { FilterBy, FilterColumn } from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import { SearchBox } from "../../components/Search";
import { MOCK_WORKFLOWS } from "./mockData";
import { MOCK_REQUESTS, ApprovalRequest } from "./mockRequestsData";
import ApprovalRequestsTable from "./ApprovalRequestsTable";

const ApprovalWorkflows: React.FC = () => {

    const [workflowData, setWorkflowData] = useState<ApprovalWorkflowModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectWorkflow, setSelectWorkflow] = useState<ApprovalWorkflowModel | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [requestSearchTerm, setRequestSearchTerm] = useState("");
    const [isNewWorkflowModalOpen, setIsNewWorkflowModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("workflows");
    const [requestsData, setRequestsData] = useState<ApprovalRequest[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<number | undefined>(undefined);

    /** -------------------- FILTERING SETUP -------------------- */

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

    // Requests FilterBy - Filter columns configuration
    const requestsFilterColumns: FilterColumn[] = useMemo(() => [
        {
            id: 'request_name',
            label: 'Request Name',
            type: 'text' as const,
        },
        {
            id: 'workflow_name',
            label: 'Workflow',
            type: 'text' as const,
        },
        {
            id: 'status',
            label: 'Status',
            type: 'select' as const,
            options: [
                { value: 'Pending', label: 'Pending' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Withdrawn', label: 'Withdrawn' },
                { value: 'Rejected', label: 'Rejected' },
            ],
        },
    ], []);

    // Requests FilterBy - Field value getter
    const getRequestFieldValue = useCallback(
        (item: ApprovalRequest, fieldId: string): string | number | Date | null | undefined => {
            switch (fieldId) {
                case 'request_name':
                    return item.request_name;
                case 'workflow_name':
                    return item.workflow_name;
                case 'status':
                    return item.status;
                default:
                    return null;
            }
        },
        []
    );

    // Requests FilterBy - Initialize hook
    const { filterData: filterRequestsData, handleFilterChange: handleRequestsFilterChange } = useFilterBy<ApprovalRequest>(getRequestFieldValue);

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

    /** -------------------- REQUESTS FILTERING -------------------- */
    const filteredRequestsData = useMemo(() => {
        // Apply FilterBy conditions
        let result = filterRequestsData(requestsData);

        // Apply search filter
        if (requestSearchTerm) {
            const search = requestSearchTerm.toLowerCase();
            result = result.filter((r) =>
                (r.request_name || "").toLowerCase().includes(search) ||
                (r.workflow_name || "").toLowerCase().includes(search) ||
                (r.id || "").toString().toLowerCase().includes(search)
            );
        }

        return result;
    }, [filterRequestsData, requestsData, requestSearchTerm]);


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

    const fetchRequestsData = async () => {
        setIsLoadingRequests(true);
        try {
            //TO-DO: fetch approval requests from API
            setRequestsData(MOCK_REQUESTS);
        } catch (error) {
            logEngine({
                type: "error",
                message: `Failed to fetch approval requests: ${error}`,
            });
        } finally {
            setIsLoadingRequests(false);
        }
    };

    /** -------------------- INITIAL LOAD -------------------- */
    useEffect(() => {
        fetchApprovalWorkflowData();
        fetchRequestsData();
    }, []);

    /** -------------------- WORKFLOW MODAL HANDLERS -------------------- */
    const handleNewWorkflowClick = () => setIsNewWorkflowModalOpen(true);

    const handleEditWorkflowClick = async (id: string) => {
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
    }

    const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue);
    }

    const handleOpenRequestDetails = (requestId: string) => {
        setSelectedRequestId(Number(requestId));
        setIsRequestModalOpen(true);
    };

    const handleCloseRequestModal = () => {
        setIsRequestModalOpen(false);
        setSelectedRequestId(undefined);
    };

    /** -------------------- RENDER -------------------- */
    return (
        <Stack className="vwhome" gap={"16px"}>
            <PageBreadcrumbs />
            <Stack sx={workflowMainStack}>
                <Stack>
                    <PageHeader
                        title={activeTab === "workflows" ? "Approval Workflows" : "Approval Requests"}
                        description={
                            activeTab === "workflows"
                                ? "A structured overview of all approval processes, including steps, conditions, and current status."
                                : "A list of approval requests created based on workflows."
                        }
                    />
                </Stack>
                {/* Tab Bar */}
                <Box sx={{ mt: 2 }}>
                    <TabContext value={activeTab}>
                        <TabBar
                            tabs={[
                                {
                                    label: "Workflows",
                                    value: "workflows",
                                    icon: "Workflow",
                                    count: filteredData.length,
                                    isLoading: isLoading,
                                },
                                {
                                    label: "Requests",
                                    value: "requests",
                                    icon: "FileText",
                                    count: filteredRequestsData.length,
                                    isLoading: isLoadingRequests,
                                },
                            ]}
                            activeTab={activeTab}
                            onChange={handleTabChange}
                            dataJoyrideId="approval-workflows-tabs"
                        />
                    </TabContext>
                </Box>
                {/* Workflows Tab Content */}
                <TabContext value={activeTab}>
                    <TabPanel value="workflows" sx={{ p: 0, mt: 2 }}>
                        <Stack spacing={2}>
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
                    </TabPanel>
                    {/* Requests Tab Content */}
                    <TabPanel value="requests" sx={{ p: 0, mt: 2 }}>
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                spacing={2}
                                sx={filterSearchContainer}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <FilterBy
                                        columns={requestsFilterColumns}
                                        onFilterChange={handleRequestsFilterChange}
                                    />
                                    <SearchBox
                                        placeholder="Search requests..."
                                        value={requestSearchTerm}
                                        onChange={setRequestSearchTerm}
                                        inputProps={{ "aria-label": "Search requests" }}
                                        fullWidth={false}
                                    />
                                </Stack>
                            </Stack>
                            <ApprovalRequestsTable
                                data={filteredRequestsData}
                                isLoading={isLoadingRequests}
                                onOpenRequestDetails={handleOpenRequestDetails}
                            />
                        </Stack>
                    </TabPanel>
                </TabContext>
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
            <RequestorApprovalModal
                isOpen={isRequestModalOpen}
                onClose={handleCloseRequestModal}
                mode="viewOnly"
                requestId={selectedRequestId}
            />
        </Stack>)

}

export default ApprovalWorkflows;