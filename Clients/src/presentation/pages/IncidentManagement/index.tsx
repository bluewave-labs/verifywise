/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  useMemo,
  Suspense,
  useCallback,
  useRef,
} from "react";
import { Box, Stack, Fade } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg";
import { SearchBox } from "../../components/Search";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

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
import TipBox from "../../components/TipBox";
import {
  addNewIncidentButton,
  incidentFilterRow,
  incidentMainStack,
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
import HelperIcon from "../../components/HelperIcon";
import IncidentStatusCard from "./IncidentStatusCard";
import PageTour from "../../components/PageTour";
import IncidentManagementSteps from "./IncidentManagementSteps";
import { AIIncidentManagementModel } from "../../../domain/models/Common/IncidentManagement/incidentManagement.model";
import { GroupBy } from "../../components/Table/GroupBy";
import {
  useTableGrouping,
  useGroupByState,
} from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../../components/Table/GroupedTableView";
import { ExportMenu } from "../../components/Table/ExportMenu";
import { FilterBy, FilterColumn } from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";

const Alert = React.lazy(() => import("../../components/Alert"));

const IncidentManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasProcessedUrlParam = useRef(false);
  const [incidentsData, setIncidentsData] = useState<
    AIIncidentManagementModel[]
  >([]);
  const [selectedIncident, setSelectedIncident] =
    useState<AIIncidentManagementModel | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [, setIsModalLoading] = useState(false);
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

  const { userRoleName } = useAuth();

  const [archiveId, setArchiveId] = useState<string | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const [mode, setModalMode] = useState("");

  // GroupBy state
  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

  const isCreatingDisabled =
    !userRoleName || !["Admin", "Editor"].includes(userRoleName);

  // FilterBy - Dynamic options generators
  const getUniqueProjects = useCallback(() => {
    const projectNames = new Set<string>();
    incidentsData.forEach((incident) => {
      if (incident.ai_project) {
        projectNames.add(incident.ai_project);
      }
    });
    return Array.from(projectNames)
      .sort()
      .map((project) => ({
        value: project,
        label: project,
      }));
  }, [incidentsData]);

  const getUniqueReporters = useCallback(() => {
    const reporters = new Set<string>();
    incidentsData.forEach((incident) => {
      if (incident.reporter) {
        reporters.add(incident.reporter);
      }
    });
    return Array.from(reporters)
      .sort()
      .map((reporter) => ({
        value: reporter,
        label: reporter,
      }));
  }, [incidentsData]);

  const getUniqueTypes = useCallback(() => {
    const types = new Set<string>();
    incidentsData.forEach((incident) => {
      if (incident.type) {
        types.add(incident.type);
      }
    });
    return Array.from(types)
      .sort()
      .map((type) => ({
        value: type,
        label: type,
      }));
  }, [incidentsData]);

  // FilterBy - Filter columns configuration
  const incidentFilterColumns: FilterColumn[] = useMemo(
    () => [
      {
        id: "incident_id",
        label: "Incident ID",
        type: "text" as const,
      },
      {
        id: "ai_project",
        label: "AI project",
        type: "select" as const,
        options: getUniqueProjects(),
      },
      {
        id: "type",
        label: "Type",
        type: "select" as const,
        options: getUniqueTypes(),
      },
      {
        id: "severity",
        label: "Severity",
        type: "select" as const,
        options: [
          { value: Severity.MINOR, label: "Minor" },
          { value: Severity.SERIOUS, label: "Serious" },
          { value: Severity.VERY_SERIOUS, label: "Very serious" },
        ],
      },
      {
        id: "status",
        label: "Status",
        type: "select" as const,
        options: [
          { value: IncidentManagementStatus.OPEN, label: "Open" },
          {
            value: IncidentManagementStatus.INVESTIGATED,
            label: "Investigating",
          },
          { value: IncidentManagementStatus.MITIGATED, label: "Mitigated" },
          { value: IncidentManagementStatus.CLOSED, label: "Closed" },
        ],
      },
      {
        id: "approval_status",
        label: "Approval status",
        type: "select" as const,
        options: [
          {
            value: AIIncidentManagementApprovalStatus.PENDING,
            label: "Pending",
          },
          {
            value: AIIncidentManagementApprovalStatus.APPROVED,
            label: "Approved",
          },
          {
            value: AIIncidentManagementApprovalStatus.REJECTED,
            label: "Rejected",
          },
          {
            value: AIIncidentManagementApprovalStatus.NOT_REQUIRED,
            label: "Not required",
          },
        ],
      },
      {
        id: "reporter",
        label: "Reporter",
        type: "select" as const,
        options: getUniqueReporters(),
      },
      {
        id: "occurred_date",
        label: "Occurred date",
        type: "date" as const,
      },
    ],
    [getUniqueProjects, getUniqueReporters, getUniqueTypes]
  );

  // FilterBy - Field value getter
  const getIncidentFieldValue = useCallback(
    (
      item: AIIncidentManagementModel,
      fieldId: string
    ): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "incident_id":
          return item.incident_id;
        case "ai_project":
          return item.ai_project;
        case "type":
          return item.type;
        case "severity":
          return item.severity;
        case "status":
          return item.status;
        case "approval_status":
          return item.approval_status;
        case "reporter":
          return item.reporter;
        case "occurred_date":
          return item.occurred_date;
        default:
          return null;
      }
    },
    []
  );

  // FilterBy - Initialize hook
  const {
    filterData: filterIncidentData,
    handleFilterChange: handleIncidentFilterChange,
  } = useFilterBy<AIIncidentManagementModel>(getIncidentFieldValue);

  /** -------------------- FILTERING -------------------- */
  const filteredData = useMemo(() => {
    // Filter out archived items first
    const nonArchivedData = incidentsData.filter((i) => !i.archived);

    // Apply FilterBy conditions
    let result = filterIncidentData(nonArchivedData);

    // Apply search filter last
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          (i.id || "").toString().toLowerCase().includes(search) ||
          (i.ai_project || "").toLowerCase().includes(search) ||
          (i.reporter || "").toLowerCase().includes(search)
      );
    }

    return result;
  }, [filterIncidentData, incidentsData, searchTerm]);

  // Define how to get the group key for each incident
  const getIncidentGroupKey = (
    incident: AIIncidentManagementModel,
    field: string
  ): string | string[] => {
    switch (field) {
      case "severity":
        return incident.severity || "Unknown";
      case "status":
        return incident.status || "Unknown";
      case "approval_status":
        return incident.approval_status || "Unknown";
      case "type":
        return incident.type || "Unknown";
      case "ai_project":
        return incident.ai_project || "Unknown Project";
      case "reporter":
        return incident.reporter || "Unknown";
      default:
        return "Other";
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
          (item: AIIncidentManagementModel) =>
            new AIIncidentManagementModel(item)
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
      const usersData = Array.isArray(response?.data) ? response.data : [];
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
    return undefined;
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

  // Handle incidentId URL param to open view modal from Wise Search
  useEffect(() => {
    const incidentId = searchParams.get("incidentId");
    if (incidentId && !hasProcessedUrlParam.current && !isLoading) {
      hasProcessedUrlParam.current = true;
      // Use existing handleViewIncident pattern which fetches and opens modal
      handleViewIncident(incidentId, "view");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, isLoading, setSearchParams]);

  /** -------------------- INITIAL LOAD -------------------- */
  useEffect(() => {
    fetchIncidentsData();
    fetchUsersData();
  }, []);

  /** -------------------- INCIDENT MODAL HANDLERS -------------------- */
  const handleNewIncidentClick = () => setIsNewIncidentModalOpen(true);

  const fetchIncidentDataForSelectedId = async (id: string) => {
    try {
      setIsModalLoading(true);
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
      setIsModalLoading(false);
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
        await createIncidentManagement("/ai-incident-managements", formData);
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

  /** -------------------- EXPORT DATA -------------------- */
  const exportColumns = useMemo(() => {
    return [
      { id: "incident_id", label: "Incident ID" },
      { id: "ai_project", label: "AI Project" },
      { id: "type", label: "Type" },
      { id: "severity", label: "Severity" },
      { id: "status", label: "Status" },
      { id: "occurred_date", label: "Occurred Date" },
      { id: "date_detected", label: "Date Detected" },
      { id: "reporter", label: "Reporter" },
      { id: "approval_status", label: "Approval Status" },
    ];
  }, []);

  const exportData = useMemo(() => {
    return filteredData.map((incident: AIIncidentManagementModel) => {
      return {
        incident_id: incident.incident_id || "-",
        ai_project: incident.ai_project || "-",
        type: incident.type || "-",
        severity: incident.severity || "-",
        status: incident.status || "-",
        occurred_date: incident.occurred_date || "-",
        date_detected: incident.date_detected || "-",
        reporter: incident.reporter || "-",
        approval_status: incident.approval_status || "-",
      };
    });
  }, [filteredData]);

  /** -------------------- RENDER -------------------- */
  return (
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />

      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Fade in={showAlert} timeout={300} style={incidentToastContainer}>
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
                articlePath="ai-governance/incident-management"
                size="small"
              />
            }
          />
        </Stack>
        <TipBox entityName="ai-incident-managements" />

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
          <Stack direction="row" spacing={2} alignItems="center">
            <FilterBy
              columns={incidentFilterColumns}
              onFilterChange={handleIncidentFilterChange}
            />

            <GroupBy
              options={[
                { id: "severity", label: "Severity" },
                { id: "status", label: "Status" },
                { id: "approval_status", label: "Approval status" },
                { id: "type", label: "Type" },
                { id: "ai_project", label: "AI Project" },
                { id: "reporter", label: "Reporter" },
              ]}
              onGroupChange={handleGroupChange}
            />

            <Box data-joyride-id="incident-search">
              <SearchBox
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={setSearchTerm}
                inputProps={{ "aria-label": "Search incidents" }}
                fullWidth={false}
              />
            </Box>
          </Stack>

          <Stack direction="row" gap="8px" alignItems="center">
            <ExportMenu
              data={exportData}
              columns={exportColumns}
              filename="incident-management"
              title="Incident Management"
            />
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
                categories_of_harm: selectedIncident.categories_of_harm || [],
                description: selectedIncident.description,
                affected_persons_groups:
                  selectedIncident.affected_persons_groups || "",
                relationship_causality:
                  selectedIncident.relationship_causality || "",
                immediate_mitigations:
                  selectedIncident.immediate_mitigations || "",
                planned_corrective_actions:
                  selectedIncident.planned_corrective_actions || "",
                model_system_version: selectedIncident.model_system_version,
                interim_report: selectedIncident.interim_report || false,
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
        incidentId={selectedIncident?.id}
      />

      <PageTour
        steps={IncidentManagementSteps}
        run={!isLoading}
        tourKey="incident-management-tour"
      />
    </Stack>
  );
};

export default IncidentManagement;
