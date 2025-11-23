/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { Box, Stack, Fade } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg";
import { SearchBox } from "../../components/Search";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";

import CustomizableButton from "../../components/Button/CustomizableButton";
import { logEngine } from "../../../application/tools/log.engine";
import {
    archiveIncidentById,
    getAllEntities,
    getEntityById,
    updateEntityById,
} from "../../../application/repository/entity.repository";
import { useAuth } from "../../../application/hooks/useAuth";
import PageHeader from "../../components/Layout/PageHeader";
import SelectComponent from "../../components/Inputs/Select";
import {
    addNewIncidentButton,
    incidentFilterRow,
    incidentMainStack,
    incidentStatusSelect,
    incidentToastContainer,
} from "./style";
import IncidentTable from "./IncidentTable";
import NewIncident from "../../components/Modals/NewIncident";
import {
    AIIncidentManagementApprovalStatus,
    IncidentManagementStatus,
    Severity,
} from "../../../domain/enums/aiIncidentManagement.enum";
import { createIncidentManagement } from "../../../application/repository/incident_management.repository";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import IncidentStatusCard from "./IncidentStatusCard";
import PageTour from "../../components/PageTour";
import IncidentManagementSteps from "./IncidentManagementSteps";
import { AIIncidentManagementModel } from "../../../domain/models/Common/incidentManagement/incidentManagement.model";
import { GroupBy } from "../../components/Table/GroupBy";
import { useTableGrouping, useGroupByState } from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../../components/Table/GroupedTableView";

const Alert = React.lazy(() => import("../../components/Alert"));

const IncidentManagement: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);
    const [incidentsData, setIncidentsData] = useState<AIIncidentManagementModel[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<AIIncidentManagementModel | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState(false);
    const [, setSelectedIncidentId] = useState<string | null>(null);
    const [, setUsers] = useState<any[]>([]);
    const [alert, setAlert] = useState<{
        variant: "success" | "info" | "warning" | "error";
        title?: string;
        body: string;
    } | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [tableKey, setTableKey] = useState(0);

    const [searchParams, setSearchParams] = useSearchParams();
    const { userRoleName } = useAuth();

    const [archiveId, setArchiveId] = useState<string | null>(null);

    //   const statusFilter = useSelector((state: any) => state.ui?.incidents?.statusFilter || "all");
    const [statusFilter, setStatusFilter] = useState(
        searchParams.get("status") || "all"
    );
    const [severityFilter, setSeverityFilter] = useState(
        searchParams.get("severity") || "all"
    );
    const [approvalFilter, setApprovalFilter] = useState(
        searchParams.get("approval") || "all"
    );
    const [searchTerm, setSearchTerm] = useState(
        searchParams.get("search") || ""
    );

    const [mode, setModalMode] = useState("");

    // GroupBy state
    const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

    const isCreatingDisabled =
        !userRoleName || !["Admin", "Editor"].includes(userRoleName);

    /** -------------------- FILTERING -------------------- */
    const filteredData = useMemo(() => {
        return incidentsData.filter((i) => {
            const matchesStatus =
                statusFilter === "all" || i.status === statusFilter;
            const matchesSeverity =
                severityFilter === "all" || i.severity === severityFilter;
            const matchesApproval =
                approvalFilter === "all" ||
                i.approval_status === approvalFilter;
            const matchesSearch =
                !searchTerm ||
                (i.id || "")
                    .toString()
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                (i.ai_project || "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                (i.reporter || "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const isNotArchived = !i.archived; // <- filter out archived items

            return (
                matchesStatus &&
                matchesSeverity &&
                matchesApproval &&
                matchesSearch &&
                isNotArchived
            );
        });
    }, [
        incidentsData,
        statusFilter,
        severityFilter,
        approvalFilter,
        searchTerm,
    ]);

    // Define how to get the group key for each incident
    const getIncidentGroupKey = (incident: AIIncidentManagementModel, field: string): string | string[] => {
        switch (field) {
            case 'severity':
                return incident.severity || 'Unknown';
            case 'status':
                return incident.status || 'Unknown';
            case 'approval_status':
                return incident.approval_status || 'Unknown';
            case 'type':
                return incident.type || 'Unknown';
            case 'ai_project':
                return incident.ai_project || 'Unknown Project';
            case 'reporter':
                return incident.reporter || 'Unknown';
            default:
                return 'Other';
        }
    };

    // Apply grouping to filtered incidents
    const groupedIncidents = useTableGrouping({
        data: filteredData,
        groupByField: groupBy,
        sortOrder: groupSortOrder,
        getGroupKey: getIncidentGroupKey,
    });

    /** -------------------- FETCHING -------------------- */
    const fetchIncidentsData = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const response = await getAllEntities({
                routeUrl: "/ai-incident-managements",
            });
            // if (response?.data) setIncidentsData(response.data);
            if (response?.data) {
                const formatted = response.data.map(
                  (item: AIIncidentManagementModel) => new AIIncidentManagementModel(item)
                );
                setIncidentsData(formatted);
              }              
        } catch (error) {
            logEngine({
                type: "error",
                message: `Failed to fetch incidents: ${error}`,
            });
            setAlert({
                variant: "error",
                body: "Failed to load incidents. Please try again later.",
            });
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    const fetchUsersData = async () => {
        try {
            const response = await getAllEntities({ routeUrl: "/users" });
            const usersData = Array.isArray(response?.data)
                ? response.data
                : [];
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    /** -------------------- ALERT HANDLING -------------------- */
    useEffect(() => {
        if (alert) {
            setShowAlert(true);
            const timer = setTimeout(() => {
                setShowAlert(false);
                setTimeout(() => setAlert(null), 300);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [alert]);

    /** -------------------- CHECK FOR NAVIGATION STATE -------------------- */
    useEffect(() => {
        const state = location.state as { openCreateModal?: boolean } | null;
        if (state?.openCreateModal) {
            setIsNewIncidentModalOpen(true);
            setModalMode("new");
            // Clear the state to prevent modal from opening again on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
        // Dependencies: location contains state from mega dropdown navigation, navigate used for state clearing
    }, [location, navigate]);

    /** -------------------- INITIAL LOAD -------------------- */
    useEffect(() => {
        fetchIncidentsData();
        fetchUsersData();
    }, []);

    /** -------------------- URL SYNC -------------------- */
    useEffect(() => {
        const params = new URLSearchParams();

        if (statusFilter !== "all") params.set("status", statusFilter);
        if (severityFilter !== "all") params.set("severity", severityFilter);
        if (approvalFilter !== "all") params.set("approval", approvalFilter);
        if (searchTerm) params.set("search", searchTerm);

        setSearchParams(params);
        setTableKey((prev) => prev + 1);
    }, [
        statusFilter,
        severityFilter,
        approvalFilter,
        searchTerm,
        setSearchParams,
    ]);

    /** -------------------- INCIDENT MODAL HANDLERS -------------------- */
    const handleNewIncidentClick = () => setIsNewIncidentModalOpen(true);

    const fetchIncidentDataForSelectedId = async (id: string) => {
        try {
            setIsLoading(true);
            const response = await getEntityById({
                routeUrl: `/ai-incident-managements/${id}`,
            });
            if (response?.data) {
                const incident = new AIIncidentManagementModel(response.data);
                setSelectedIncident(incident);
                return incident;
            } else {
                setAlert({
                    variant: "error",
                    body: "No incident data found for this ID.",
                });
                return null;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setAlert({
                variant: "error",
                body: "Failed to load incident details.",
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditIncident = async (id: string, mode: string) => {
        setSelectedIncidentId(id);
        setModalMode(mode);
        const data = await fetchIncidentDataForSelectedId(id);
        if (data) setIsNewIncidentModalOpen(true);
    };

    const handleViewIncident = async (id: string, mode: string) => {
        setSelectedIncidentId(id);
        setModalMode(mode);
        const data = await fetchIncidentDataForSelectedId(id);
        if (data) setIsNewIncidentModalOpen(true);
    };

    const handleArchiveIncident = async (id: string, mode: string) => {
        try {
            setSelectedIncidentId(id);
            setModalMode(mode);
            setArchiveId(id);

            // Optimistically remove from local state for snappy UI feedback
            setIncidentsData((prevData) =>
                prevData.filter((item) => item.id?.toString() !== id)
            );

            //API route to match your backend: /:id/archive
            await archiveIncidentById({
                routeUrl: `/ai-incident-managements/${id}`,
                body: {},
            });

        
            // Re-fetch to ensure consistent state
            await fetchIncidentsData(false);

            // Force table refresh
            setTableKey((prev) => prev + 1);

            setAlert({
                variant: "success",
                body: "Incident archived successfully.",
            });
        } catch (error) {
            console.error("❌ Error archiving incident:", error);

            // Revert optimistic update
            await fetchIncidentsData(false);

            setAlert({
                variant: "error",
                body: "Failed to archive incident. Please try again.",
            });
        } finally {
            setSelectedIncidentId(null);
            setModalMode("");
            setArchiveId(null);
        }
    };

    const handleCloseModal = () => {
        setIsNewIncidentModalOpen(false);
        setSelectedIncident(null);
        setSelectedIncidentId(null);
        setModalMode("");
        setArchiveId(null);
    };

    const handleIncidentSuccess = async (formData: any) => {
        try {
            if (selectedIncident) {
                await updateEntityById({
                    routeUrl: `/ai-incident-managements/${selectedIncident.id}`,
                    body: formData,
                });
                setAlert({
                    variant: "success",
                    body: "Incident updated successfully!",
                });
            } else {
                await createIncidentManagement(
                    "/ai-incident-managements",
                    formData
                );
                setAlert({
                    variant: "success",
                    body: "New incident added successfully!",
                });
            }
            await fetchIncidentsData();
            handleCloseModal();
        } catch {
            setAlert({
                variant: "error",
                body: selectedIncident
                    ? "Failed to update incident."
                    : "Failed to add incident.",
            });
        }
    };

    /** -------------------- FILTER OPTIONS -------------------- */
    const statusOptions = [
        { _id: "all", name: "All statuses" },
        { _id: IncidentManagementStatus.OPEN, name: "Open" },
        { _id: IncidentManagementStatus.INVESTIGATED, name: "Investigating" },
        { _id: IncidentManagementStatus.MITIGATED, name: "Mitigated" },
        { _id: IncidentManagementStatus.CLOSED, name: "Closed" },
    ];

    const severityOptions = [
        { _id: "all", name: "All severities" },
        { _id: Severity.MINOR, name: "Minor" },
        { _id: Severity.SERIOUS, name: "Serious" },
        { _id: Severity.VERY_SERIOUS, name: "Very serious" },
    ];

    const approvalOptions = [
        { _id: "all", name: "All approval statuses" },
        { _id: AIIncidentManagementApprovalStatus.PENDING, name: "Pending" },
        { _id: AIIncidentManagementApprovalStatus.APPROVED, name: "Approved" },
        { _id: AIIncidentManagementApprovalStatus.REJECTED, name: "Rejected" },
        {
            _id: AIIncidentManagementApprovalStatus.NOT_REQUIRED,
            name: "Not required",
        },
    ];

    /** -------------------- RENDER -------------------- */
    return (
        <Stack className="vwhome" gap={"16px"}>
            <PageBreadcrumbs />

            <HelperDrawer
                open={isHelperDrawerOpen}
                onClose={() => setIsHelperDrawerOpen(false)}
                title="Incident Management"
                description="Track, investigate, and resolve AI-related incidents efficiently"
                whatItDoes="Maintain a centralized log of all AI incidents including *incident type*, *severity*, *reporter details*, and *status*. Record *impact assessment*, *mitigations*, *corrective actions*, and *approval workflow* for full traceability."
                whyItMatters="Effective incident management ensures *regulatory compliance*, *operational reliability*, and *risk mitigation*. It helps your team respond to issues promptly, identify root causes, and prevent recurrence."
                quickActions={[
                    {
                        label: "Add New Incident",
                        description:
                            "Create a new incident record with details like severity, type, categories of harm, and reporter",
                        primary: true,
                    },
                    {
                        label: "Filter Incidents",
                        description:
                            "Use status, severity, and approval filters to find specific incidents quickly",
                    },
                    {
                        label: "Archive Incident",
                        description:
                            "Archive resolved incidents to keep your active list clean while preserving records",
                    },
                ]}
                useCases={[
                    "Track incidents affecting health, safety, rights, property, or environment",
                    "Document incidents requiring investigation and regulatory reporting",
                    "Record mitigations and corrective actions for AI system failures",
                ]}
                keyFeatures={[
                    "Incident lifecycle tracking from logging through investigation to closure",
                    "Severity and status filtering for quick incident prioritization",
                    "Approval workflows with pending, approved, and rejected statuses",
                    "Search and filter by status, severity, and approval status",
                ]}
                tips={[
                    "Use severity levels to prioritize incidents needing immediate attention",
                    "Document immediate mitigations and planned corrective actions",
                    "Archive resolved incidents to maintain a clean active list",
                    "Review incident patterns regularly to improve AI system reliability",
                ]}
            />

            {alert && (
                <Suspense fallback={<div>Loading...</div>}>
                    <Fade
                        in={showAlert}
                        timeout={300}
                        style={incidentToastContainer}
                    >
                        <Box mb={2}>
                            <Alert
                                variant={alert.variant}
                                title={alert.title}
                                body={alert.body}
                                isToast={true}
                                onClick={() => {
                                    setShowAlert(false);
                                    setTimeout(() => setAlert(null), 300);
                                }}
                            />
                        </Box>
                    </Fade>
                </Suspense>
            )}

            <Stack sx={incidentMainStack}>
                <Stack>
                    <PageHeader
                        title="Incident Management"
                        description="End-to-end management of the AI incident lifecycle. You can log events in full detail, analyze root causes, and document corrective and preventive actions."
                        rightContent={
                            <HelperIcon
                                onClick={() =>
                                    setIsHelperDrawerOpen(!isHelperDrawerOpen)
                                }
                                size="small"
                            />
                        }
                    />
                </Stack>

                {/* Incident by Status Cards */}
                {/* TODO: Refactor to always show cards (like Model Inventory) to prevent layout shift and beacon positioning issues */}
                {incidentsData.length > 0 && (
                    <Box data-joyride-id="incident-status-cards">
                        <IncidentStatusCard incidents={incidentsData} />
                    </Box>
                )}

                {/* Filters Row */}
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={4}
                    sx={incidentFilterRow}
                >
                    <Stack direction="row" spacing={6} alignItems="center">
                        <div data-joyride-id="incident-status-filter">
                            <SelectComponent
                                id="status-filter"
                                value={statusFilter}
                                items={statusOptions}
                                onChange={(e: any) =>
                                    setStatusFilter(e.target.value)
                                }
                                sx={incidentStatusSelect}
                                customRenderValue={(value, selectedItem) => {
                                    if (value === "all") {
                                        return selectedItem.name;
                                    }
                                    return `Status: ${selectedItem.name.toLowerCase()}`;
                                }}
                            />
                        </div>

                        <div data-joyride-id="incident-severity-filter">
                            <SelectComponent
                                id="severity-filter"
                                value={severityFilter}
                                items={severityOptions}
                                onChange={(e: any) =>
                                    setSeverityFilter(e.target.value)
                                }
                                sx={incidentStatusSelect}
                                customRenderValue={(value, selectedItem) => {
                                    if (value === "all") {
                                        return selectedItem.name;
                                    }
                                    return `Severity: ${selectedItem.name.toLowerCase()}`;
                                }}
                            />
                        </div>

                        <div data-joyride-id="incident-approval-filter">
                            <SelectComponent
                                id="approval-filter"
                                value={approvalFilter}
                                items={approvalOptions}
                                onChange={(e: any) =>
                                    setApprovalFilter(e.target.value)
                                }
                                sx={incidentStatusSelect}
                                customRenderValue={(value, selectedItem) => {
                                    if (value === "all") {
                                        return selectedItem.name;
                                    }
                                    return `Approval status: ${selectedItem.name.toLowerCase()}`;
                                }}
                            />
                        </div>

                        {/* Search box */}
                        <Box sx={{ width: 300 }} data-joyride-id="incident-search">
                            <SearchBox
                                placeholder="Search incidents..."
                                value={searchTerm}
                                onChange={setSearchTerm}
                                inputProps={{ "aria-label": "Search incidents" }}
                            />
                        </Box>

                        {/* GroupBy button */}
                        <GroupBy
                            options={[
                                { id: 'severity', label: 'Severity' },
                                { id: 'status', label: 'Status' },
                                { id: 'approval_status', label: 'Approval status' },
                                { id: 'type', label: 'Type' },
                                { id: 'ai_project', label: 'AI Project' },
                                { id: 'reporter', label: 'Reporter' },
                            ]}
                            onGroupChange={handleGroupChange}
                        />
                    </Stack>

                    <Box data-joyride-id="add-incident-button">
                        <CustomizableButton
                            variant="contained"
                            sx={addNewIncidentButton}
                            text="Add new incident"
                            icon={<AddCircleOutlineIcon />}
                            onClick={handleNewIncidentClick}
                            isDisabled={isCreatingDisabled}
                        />
                    </Box>
                </Stack>

                <GroupedTableView
                    groupedData={groupedIncidents}
                    ungroupedData={filteredData}
                    renderTable={(data, options) => (
                        <IncidentTable
                            key={tableKey}
                            data={data}
                            isLoading={isLoading}
                            onEdit={handleEditIncident}
                            onArchive={handleArchiveIncident}
                            onView={handleViewIncident}
                            archivedId={archiveId}
                            hidePagination={options?.hidePagination}
                        />
                    )}
                />
            </Stack>

            <NewIncident
                isOpen={isNewIncidentModalOpen}
                setIsOpen={handleCloseModal}
                onSuccess={handleIncidentSuccess}
                initialData={
                    selectedIncident
                        ? {
                              incident_id: selectedIncident.incident_id || "",
                              ai_project: selectedIncident.ai_project || "",
                              type: selectedIncident.type || "",
                              severity: selectedIncident.severity || "",
                              status: selectedIncident.status || "",
                              occurred_date: selectedIncident.occurred_date
                                  ? new Date(selectedIncident.occurred_date)
                                        .toISOString()
                                        .split("T")[0]
                                  : new Date().toISOString().split("T")[0],
                              date_detected: selectedIncident.date_detected
                                  ? new Date(selectedIncident.date_detected)
                                        .toISOString()
                                        .split("T")[0]
                                  : new Date().toISOString().split("T")[0],
                              reporter: selectedIncident.reporter,
                              categories_of_harm:
                                  selectedIncident.categories_of_harm || [],
                              description: selectedIncident.description,
                              affected_persons_groups:
                                  selectedIncident.affected_persons_groups ||
                                  "",
                              relationship_causality:
                                  selectedIncident.relationship_causality || "",
                              immediate_mitigations:
                                  selectedIncident.immediate_mitigations || "",
                              planned_corrective_actions:
                                  selectedIncident.planned_corrective_actions ||
                                  "",
                              model_system_version:
                                  selectedIncident.model_system_version,
                              interim_report:
                                  selectedIncident.interim_report || false,
                              approval_status: selectedIncident.approval_status,
                              approved_by: selectedIncident.approved_by,
                              approval_date: selectedIncident.approval_date
                                  ? new Date(selectedIncident.approval_date)
                                        .toISOString()
                                        .split("T")[0]
                                  : new Date().toISOString().split("T")[0],
                              approval_notes: selectedIncident.approval_notes,
                          }
                        : undefined
                }
                isEdit={!!selectedIncident}
                mode={mode}
            />

            <PageTour steps={IncidentManagementSteps} run={!isLoading} tourKey="incident-management-tour" />
        </Stack>
    );
};

export default IncidentManagement;