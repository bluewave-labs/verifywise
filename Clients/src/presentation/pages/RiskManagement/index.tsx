import { Suspense, useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Box, Stack, Popover, Typography, IconButton, Tooltip } from "@mui/material";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import RisksCard from "../../components/Cards/RisksCard";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { BarChart3, ChevronDown, History as HistoryIcon } from "lucide-react"
import ibmLogo from "../../assets/ibm_logo.svg";
import mitLogo from "../../assets/mit_logo.svg";
import VWProjectRisksTable from "../../components/Table/VWProjectRisksTable";
import SearchBox from "../../components/Search/SearchBox";
import AddNewRiskForm from "../../components/AddNewRiskForm";
import StandardModal from "../../components/Modals/StandardModal";
import { handleAlert } from "../../../application/tools/alertUtils";
import Alert from "../../components/Alert";
import { deleteEntityById, getEntityById } from "../../../application/repository/entity.repository";
import CustomizableToast from "../../components/Toast";
import CustomizableSkeleton from "../../components/Skeletons";
import allowedRoles from "../../../application/constants/permissions";
import AddNewRiskMITModal from "../../components/AddNewRiskMITForm";
import AddNewRiskIBMModal from "../../components/AddNewRiskIBMForm";
import { getAllProjectRisks } from "../../../application/repository/projectRisk.repository";
import { useAuth } from "../../../application/hooks/useAuth";
import useUsers from "../../../application/hooks/useUsers";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import TipBox from "../../components/TipBox";
import HelperIcon from "../../components/HelperIcon";
import PageTour from "../../components/PageTour";
import RiskManagementSteps from "./RiskManagementSteps";
import { RiskModel } from "../../../domain/models/Common/risks/risk.model";
import AnalyticsDrawer from "../../components/AnalyticsDrawer";
import { ExportMenu } from "../../components/Table/ExportMenu";
import { GroupBy } from "../../components/Table/GroupBy";
import { useTableGrouping, useGroupByState } from "../../../application/hooks/useTableGrouping";
import { FilterBy, FilterColumn } from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import { GroupedTableView } from "../../components/Table/GroupedTableView";
import HistorySidebar from "../../components/Common/HistorySidebar";
import { useEntityChangeHistory } from "../../../application/hooks/useEntityChangeHistory";

/**
 * Set initial loading status for all CRUD process
 */
interface LoadingStatus {
  loading: boolean;
  message: string;
}

const initialLoadingState: LoadingStatus = {
  loading: false,
  message: "",
};


const RiskManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasProcessedUrlParam = useRef(false);
  const { userRoleName } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const [refreshKey, setRefreshKey] = useState(0); // Add refreshKey state
  const [projectRisks, setProjectRisks] = useState<RiskModel[]>([]);
  const [selectedRow, setSelectedRow] = useState<RiskModel[]>([]);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] =
    useState<LoadingStatus>(initialLoadingState);
  const [showCustomizableSkeleton, setShowCustomizableSkeleton] =
    useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<number | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isIBMModalOpen, setIsIBMModalOpen] = useState(false);
  const [insertFromMenuAnchor, setInsertFromMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRiskData, setSelectedRiskData] = useState<{
    riskName: string;
    actionOwner: number;
    aiLifecyclePhase: number;
    riskDescription: string;
    riskCategory: number[];
    potentialImpact: string;
    assessmentMapping: number;
    controlsMapping: number;
    likelihood: number;
    riskSeverity: number;
    riskLevel: number;
    reviewNotes: string;
    applicableProjects: number[];
    applicableFrameworks: number[];
  } | null>(null);

  // State for filtering
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isAnalyticsDrawerOpen, setIsAnalyticsDrawerOpen] = useState(false);

  // Modal state for StandardModal pattern
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isAiRiskModalOpen, setIsAiRiskModalOpen] = useState(false);
  const [isSubmitting] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);

  // Refs for form submission
  const onSubmitRef = useRef<(() => void) | null>(null);
  const onAiRiskSubmitRef = useRef<(() => void) | null>(null);

  // GroupBy state
  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

  // Prefetch history data when modal opens in edit mode
  useEntityChangeHistory(
    "risk",
    isRiskModalOpen && selectedRow.length > 0 && selectedRow[0]?.id ? selectedRow[0].id : 0
  );

  // FilterBy configuration
  const getUniqueOwners = useCallback(() => {
    const ownerIds = new Set<string>();
    projectRisks.forEach((risk) => {
      if (risk.risk_owner) {
        ownerIds.add(risk.risk_owner.toString());
      }
    });

    return Array.from(ownerIds)
      .sort()
      .map((ownerId) => {
        const user = users.find((u) => u.id.toString() === ownerId);
        const userName = user ? `${user.name} ${user.surname}`.trim() : `User ${ownerId}`;
        return { value: ownerId, label: userName };
      });
  }, [projectRisks, users]);

  const filterColumns: FilterColumn[] = useMemo(() => [
    {
      id: 'risk_name',
      label: 'Risk name',
      type: 'text' as const,
    },
    {
      id: 'risk_description',
      label: 'Description',
      type: 'text' as const,
    },
    {
      id: 'severity',
      label: 'Severity',
      type: 'select' as const,
      options: [
        { value: 'Very High', label: 'Very High' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
        { value: 'Very Low', label: 'Very Low' },
      ],
    },
    {
      id: 'likelihood',
      label: 'Likelihood',
      type: 'select' as const,
      options: [
        { value: 'Very High', label: 'Very High' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
        { value: 'Very Low', label: 'Very Low' },
      ],
    },
    {
      id: 'risk_level',
      label: 'Risk level',
      type: 'select' as const,
      options: [
        { value: 'Very High', label: 'Very High' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
        { value: 'Very Low', label: 'Very Low' },
      ],
    },
    {
      id: 'mitigation_status',
      label: 'Mitigation status',
      type: 'select' as const,
      options: [
        { value: 'Completed', label: 'Completed' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Not Started', label: 'Not Started' },
      ],
    },
    {
      id: 'risk_owner',
      label: 'Risk owner',
      type: 'select' as const,
      options: getUniqueOwners(),
    },
    {
      id: 'impact',
      label: 'Impact',
      type: 'text' as const,
    },
    {
      id: 'deadline',
      label: 'Target date',
      type: 'date' as const,
    },
    {
      id: 'date_of_assessment',
      label: 'Assessment date',
      type: 'date' as const,
    },
  ], [getUniqueOwners]);

  // Get field value for filtering
  const getRiskFieldValue = useCallback((risk: RiskModel, fieldId: string): string | number | Date | null | undefined => {
    switch (fieldId) {
      case 'risk_name':
        return risk.risk_name;
      case 'risk_description':
        return risk.risk_description;
      case 'severity':
        return risk.severity;
      case 'likelihood':
        return risk.likelihood;
      case 'risk_level':
        return risk.current_risk_level || risk.risk_level_autocalculated;
      case 'mitigation_status':
        return risk.mitigation_status;
      case 'risk_owner':
        return risk.risk_owner?.toString();
      case 'impact':
        return risk.impact;
      case 'deadline':
        return risk.deadline;
      case 'date_of_assessment':
        return risk.date_of_assessment;
      default:
        return null;
    }
  }, []);

  const { filterData, handleFilterChange: handleFilterByChange } = useFilterBy<RiskModel>(getRiskFieldValue);

  // Apply FilterBy and search filters
  const filteredRisks = useMemo(() => {
    // First apply FilterBy conditions
    const filterByResults = filterData(projectRisks);

    // Then apply search term
    if (!searchTerm.trim()) {
      return filterByResults;
    }

    return filterByResults.filter((risk) =>
      risk.risk_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.risk_description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filterData, projectRisks, searchTerm]);

  // Compute risk summary from fetched data
  const risksSummary = useMemo(() => {
    const veryHighRisks = projectRisks.filter(risk => {
      const riskLevel = (risk.current_risk_level || risk.risk_level_autocalculated || "").toLowerCase();
      return riskLevel.includes("very high");
    }).length;
    const highRisks = projectRisks.filter(risk => {
      const riskLevel = (risk.current_risk_level || risk.risk_level_autocalculated || "").toLowerCase();
      return riskLevel.includes("high") && !riskLevel.includes("very high");
    }).length;
    const mediumRisks = projectRisks.filter(risk => {
      const riskLevel = (risk.current_risk_level || risk.risk_level_autocalculated || "").toLowerCase();
      return riskLevel.includes("medium");
    }).length;
    const lowRisks = projectRisks.filter(risk => {
      const riskLevel = (risk.current_risk_level || risk.risk_level_autocalculated || "").toLowerCase();
      return riskLevel.includes("low") && !riskLevel.includes("very low");
    }).length;
    const veryLowRisks = projectRisks.filter(risk => {
      const riskLevel = (risk.current_risk_level || risk.risk_level_autocalculated || "").toLowerCase();
      return riskLevel.includes("very low") || riskLevel.includes("no risk");
    }).length;

    return {
      veryHighRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      veryLowRisks,
    };
  }, [projectRisks]);

  // Define export columns for risk management table
  const exportColumns = useMemo(() => {
    return [
      { id: 'risk_name', label: 'Risk Name' },
      { id: 'risk_owner', label: 'Owner' },
      { id: 'severity', label: 'Severity' },
      { id: 'likelihood', label: 'Likelihood' },
      { id: 'mitigation_status', label: 'Mitigation Status' },
      { id: 'risk_level', label: 'Risk Level' },
      { id: 'deadline', label: 'Target Date' },
      { id: 'controls_mapping', label: 'Linked Controls' },
    ];
  }, []);

  // Prepare export data - format the data for export
  const exportData = useMemo(() => {
    const dataToExport = filteredRisks.length > 0 ? filteredRisks : projectRisks;
    return dataToExport.map((risk: RiskModel) => {
      const ownerUser = users.find((user) => user.id === risk.risk_owner);
      const ownerName = ownerUser ? `${ownerUser.name} ${ownerUser.surname}` : '-';

      return {
        risk_name: risk.risk_name || '-',
        risk_owner: ownerName,
        severity: risk.severity || '-',
        likelihood: risk.likelihood || '-',
        mitigation_status: risk.mitigation_status || '-',
        risk_level: risk.current_risk_level || risk.risk_level_autocalculated || '-',
        deadline: risk.deadline || '-',
        controls_mapping: risk.controls_mapping || '-',
      };
    });
  }, [filteredRisks, projectRisks, users]);

  const fetchProjectRisks = useCallback(async (filter: 'active' | 'deleted' | 'all' = 'active') => {
    try {
      const response = await getAllProjectRisks({ filter });
      setShowCustomizableSkeleton(false);
      setProjectRisks(response.data);
    } catch (error) {
      console.error("Error fetching project risks:", error);
      handleToast(
        "error",
        "Unexpected error occurs while fetching project risks."
      );
    }
  }, []);

  useEffect(() => {
    setShowCustomizableSkeleton(true);
    fetchProjectRisks();
  }, [fetchProjectRisks, refreshKey]);

  // Auto-open create risk popup when navigating from "Add new..." dropdown
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setIsRiskModalOpen(true);
      setSelectedRow([]);

      // Clear the navigation state to prevent re-opening on subsequent navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Handle riskId URL param to open edit modal from Wise Search
  useEffect(() => {
    const riskId = searchParams.get("riskId");
    if (riskId && !hasProcessedUrlParam.current && !showCustomizableSkeleton) {
      hasProcessedUrlParam.current = true;

      // First check if risk is already in local state
      const existingRisk = projectRisks.find((r) => r.id === parseInt(riskId, 10));
      if (existingRisk) {
        setSelectedRow([existingRisk]);
        setIsRiskModalOpen(true);
        setSearchParams({}, { replace: true });
      } else {
        // Fetch from server if not in local state
        getEntityById({ routeUrl: `/projectRisks/${riskId}` })
          .then((response) => {
            if (response?.data) {
              setSelectedRow([response.data]);
              setIsRiskModalOpen(true);
              setSearchParams({}, { replace: true });
            }
          })
          .catch((err) => {
            console.error("Error fetching risk from URL param:", err);
            setSearchParams({}, { replace: true });
          });
      }
    }
  }, [searchParams, projectRisks, showCustomizableSkeleton, setSearchParams]);

  /**
   * Handle actions for project risk modal
   * Display tostify for create and update project risk
   */
  const handleRiskModalClose = () => {
    setIsRiskModalOpen(false);
    setSelectedRow([]);
    setIsHistorySidebarOpen(false);
  };

  const handleRiskModalSubmit = () => {
    if (onSubmitRef.current) {
      onSubmitRef.current();
    }
  };

  const handleInsertFromMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setInsertFromMenuAnchor(event.currentTarget);
  };

  const handleInsertFromMenuClose = () => {
    setInsertFromMenuAnchor(null);
  };

  const handleMITModalOpen = () => {
    setIsAIModalOpen(true);
    handleInsertFromMenuClose();
  };

  const handleIBMModalOpen = () => {
    setIsIBMModalOpen(true);
    handleInsertFromMenuClose();
  };

  const handleAiRiskModalClose = () => {
    setIsAiRiskModalOpen(false);
    setSelectedRiskData(null);
  };

  const handleAiRiskModalSubmit = () => {
    if (onAiRiskSubmitRef.current) {
      onAiRiskSubmitRef.current();
    }
  };

  const handleRiskSelected = (riskData: {
    riskName: string;
    actionOwner: number;
    aiLifecyclePhase: number;
    riskDescription: string;
    riskCategory: number[];
    potentialImpact: string;
    assessmentMapping: number;
    controlsMapping: number;
    likelihood: number;
    riskSeverity: number;
    riskLevel: number;
    reviewNotes: string;
    applicableProjects: number[];
    applicableFrameworks: number[];
  }) => {
    setSelectedRiskData({
      ...riskData,
      applicableProjects: riskData.applicableProjects || [],
      applicableFrameworks: riskData.applicableFrameworks || [],
    });
    setIsAiRiskModalOpen(true);
  };

  const handleLoading = (message: string) => {
    setIsLoading((prev) => ({ ...prev, loading: true, message: message }));
  };

  const handleToast = (type: "success" | "info" | "warning" | "error", message: string) => {
    handleAlert({
      variant: type,
      body: message,
      setAlert,
    });
    setTimeout(() => {
      setAlert(null);
    }, 3000);
  };

  const handleSuccess = () => {
    setTimeout(() => {
      setIsLoading(initialLoadingState);
      handleToast("success", "Risk created successfully");
    }, 1000);

    // set pagination for FIFO risk listing after adding a new risk
    const rowsPerPage = 5;
    const pageCount = Math.floor(projectRisks.length / rowsPerPage);
    setCurrentPage(pageCount);

    fetchProjectRisks();
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleUpdate = () => {
    setTimeout(() => {
      setIsLoading(initialLoadingState);
      setCurrentRow(selectedRow[0].id!); // set current row to trigger flash-feedback
      handleToast("success", "Risk updated successfully");
    }, 1000);

    setTimeout(() => {
      setCurrentRow(null);
    }, 2000);
    fetchProjectRisks();
    setRefreshKey((prevKey) => prevKey + 1); // Update refreshKey to trigger re-render
  };

  const handleError = (errorMessage: string) => {
    setIsLoading(initialLoadingState);
    handleToast("error", errorMessage);
  };

  const handleDelete = async (riskId: number) => {
    handleLoading("Deleting the risk. Please wait...");
    try {
      const response = await deleteEntityById({
        routeUrl: `/projectRisks/${riskId}`,
      });
      if (response.status === 200) {

          // Delete the risk from all linked policies
      try {
        await deleteEntityById({
          routeUrl: `/policy-linked/risk/${riskId}/unlink-all`, 
        });
      } catch (linkedError) {
        console.error("Error deleting risk from linked policies", linkedError);
        handleToast("warning", "Risk deleted but failed to remove from some linked policies.");
      }


        // Set current pagination number after deleting the risk
        const rowsPerPage = 5;
        const rowCount = projectRisks.slice(
          currentPage * rowsPerPage,
          currentPage * rowsPerPage + rowsPerPage
        );

        if (currentPage !== 0 && rowCount.length === 1) {
          setCurrentPage(currentPage - 1);
        } else {
          setCurrentPage(currentPage);
        }
        setTimeout(() => {
          setIsLoading(initialLoadingState);
          handleToast("success", "Risk deleted successfully.");
        }, 1000);

        fetchProjectRisks();
        setRefreshKey((prevKey) => prevKey + 1);
      } else if (response.status === 404) {
        setIsLoading(initialLoadingState);
        handleToast("error", "Risk not found.");
      } else {
        setIsLoading(initialLoadingState);
        handleToast("error", "Unexpected error occurs. Risk delete fails.");
      }
    } catch (error) {
      console.error("Error sending request", error);
      setIsLoading(initialLoadingState);
      handleToast("error", "Risk delete fails.");
    }
  };

  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page);
  };

  // Define how to get the group key for each risk
  const getRiskGroupKey = useCallback((risk: RiskModel, field: string): string => {
    switch (field) {
      case 'risk_level':
        return risk.current_risk_level || risk.risk_level_autocalculated || 'Unknown';
      case 'mitigation_status':
        return risk.mitigation_status || 'Unknown';
      case 'owner':
        if (risk.risk_owner) {
          const user = users.find((u) => u.id === risk.risk_owner);
          return user ? `${user.name} ${user.surname}`.trim() : 'Unknown';
        }
        return 'Unassigned';
      case 'severity':
        return risk.severity || 'Unknown';
      case 'likelihood':
        return risk.likelihood || 'Unknown';
      default:
        return 'Other';
    }
  }, [users]);

  // Apply grouping to filtered risks
  const groupedRisks = useTableGrouping({
    data: filteredRisks,
    groupByField: groupBy,
    sortOrder: groupSortOrder,
    getGroupKey: getRiskGroupKey,
  });

  return (
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />

      <Stack gap={"16px"} key={refreshKey}>
        <PageHeader
          title="Risk Management"
          description="Manage and monitor risks across all your projects"
          rightContent={
            <HelperIcon
              articlePath="risk-management/risk-assessment"
              size="small"
            />
          }
        />
        <TipBox entityName="risk-management" />

      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Box>
            <Alert
              variant={alert.variant}
              title={alert.title}
              body={alert.body}
              isToast={true}
              onClick={() => setAlert(null)}
            />
          </Box>
        </Suspense>
      )}
      {isLoading.loading && <CustomizableToast title={isLoading.message} />}
      <Stack className="risk-management-row" sx={{ display: "flex", flexDirection: "row", gap: 10 }} data-joyride-id="risk-summary-cards">
        <RisksCard risksSummary={risksSummary} />
      </Stack>

      <Stack
        className="risk-management-row"
        sx={{
          gap: 10,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-end"
        >
          <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div data-joyride-id="risk-filters">
              <FilterBy
                columns={filterColumns}
                onFilterChange={handleFilterByChange}
              />
            </div>
            <GroupBy
              options={[
                { id: 'risk_level', label: 'Risk level' },
                { id: 'mitigation_status', label: 'Mitigation status' },
                { id: 'owner', label: 'Owner' },
                { id: 'severity', label: 'Severity' },
                { id: 'likelihood', label: 'Likelihood' },
              ]}
              onGroupChange={handleGroupChange}
            />
            <SearchBox
              placeholder="Search risks..."
              value={searchTerm}
              onChange={setSearchTerm}
              inputProps={{ "aria-label": "Search risks"}}
              fullWidth={false}
            />
          </Box>
          <Stack direction="row" gap="8px" alignItems="center">
            <ExportMenu
              data={exportData}
              columns={exportColumns}
              filename="risk-management"
              title="Risk Management"
            />
            <div data-joyride-id="analytics-button">
              <IconButton
                onClick={() => setIsAnalyticsDrawerOpen(true)}
                aria-label="Analytics"
                sx={{
                  height: '34px',
                  width: '34px',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                  },
                }}
              >
                <BarChart3 size={16} color="#344054" />
              </IconButton>
            </div>
            <div data-joyride-id="add-risk-button">
              <CustomizableButton
                variant="contained"
                text="Add new risk"
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                }}
                onClick={handleInsertFromMenuOpen}
                icon={<ChevronDown size={16} />}
                isDisabled={
                  !allowedRoles.projectRisks.create.includes(userRoleName)
                }
              />
              <Popover
                id="insert-risk-mega-dropdown"
                open={Boolean(insertFromMenuAnchor)}
                anchorEl={insertFromMenuAnchor}
                onClose={handleInsertFromMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                sx={{
                  mt: 1,
                  "& .MuiPopover-paper": {
                    borderRadius: "4px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                    overflow: "visible",
                    backgroundColor: "#fff",
                  },
                }}
              >
                <Box
                  role="menu"
                  aria-label="Add new risk menu"
                  sx={{
                    p: 2,
                    width: "420px",
                  }}
                >
                  {/* Add new risk option */}
                  <Box
                    role="menuitem"
                    tabIndex={0}
                    aria-label="Add new risk manually"
                    onClick={() => {
                      handleInsertFromMenuClose();
                      setIsRiskModalOpen(true);
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleInsertFromMenuClose();
                        setIsRiskModalOpen(true);
                      }
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      backgroundColor: "#fff",
                      transition: "all 0.2s ease",
                      mb: 2,
                      "&:hover": {
                        backgroundColor: "#f9fafb",
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                      },
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: "13px",
                          color: "rgba(0, 0, 0, 0.85)",
                        }}
                      >
                        Add new risk
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "11px",
                          color: "rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        Create a custom risk manually
                      </Typography>
                    </Box>
                  </Box>

                  {/* Divider with text */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1, height: "1px", backgroundColor: "rgba(0, 0, 0, 0.08)" }} />
                    <Typography sx={{ fontSize: "11px", color: "rgba(0, 0, 0, 0.45)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Or import from
                    </Typography>
                    <Box sx={{ flex: 1, height: "1px", backgroundColor: "rgba(0, 0, 0, 0.08)" }} />
                  </Box>

                  {/* AI Risk databases grid */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 2,
                    }}
                  >
                  <Box
                    role="menuitem"
                    tabIndex={0}
                    aria-label="Insert risk from IBM AI Risk database"
                    onClick={handleIBMModalOpen}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleIBMModalOpen();
                      }
                    }}
                    sx={{
                      background: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
                      borderRadius: "4px",
                      padding: "20px 16px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 1.5,
                      border: "1px solid rgba(0, 0, 0, 0.04)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      minHeight: "140px",
                      position: "relative",
                      "&:hover": {
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                        border: "1px solid rgba(0, 0, 0, 0.08)",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(250, 250, 250, 1) 100%)",
                      },
                      "&:active": {
                        transform: "scale(0.98)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "#10B981",
                        color: "white",
                        fontSize: "9px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "3px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Recommended
                    </Box>
                    <img src={ibmLogo} alt="IBM Logo" style={{ height: 24 }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: "13px",
                        color: "rgba(0, 0, 0, 0.85)",
                        textAlign: "center",
                      }}
                    >
                      IBM AI Risk database
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "11px",
                        color: "rgba(0, 0, 0, 0.6)",
                        textAlign: "center",
                        lineHeight: 1.4,
                      }}
                    >
                      113 risks covering agentic AI, data privacy, inference attacks, and operational failures
                    </Typography>
                  </Box>
                  <Box
                    role="menuitem"
                    tabIndex={0}
                    aria-label="Insert risk from MIT AI Risk database"
                    onClick={handleMITModalOpen}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleMITModalOpen();
                      }
                    }}
                    sx={{
                      background: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
                      borderRadius: "4px",
                      padding: "20px 16px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 1.5,
                      border: "1px solid rgba(0, 0, 0, 0.04)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      minHeight: "140px",
                      "&:hover": {
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                        border: "1px solid rgba(0, 0, 0, 0.08)",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(250, 250, 250, 1) 100%)",
                      },
                      "&:active": {
                        transform: "scale(0.98)",
                      },
                    }}
                  >
                    <img src={mitLogo} alt="MIT Logo" style={{ height: 24 }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: "13px",
                        color: "rgba(0, 0, 0, 0.85)",
                        textAlign: "center",
                      }}
                    >
                      MIT AI Risk database
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "11px",
                        color: "rgba(0, 0, 0, 0.6)",
                        textAlign: "center",
                        lineHeight: 1.4,
                      }}
                    >
                      Academic research-based risks covering AI safety, fairness, and societal impact
                    </Typography>
                  </Box>
                  </Box>
                </Box>
              </Popover>
            </div>
          </Stack>
        </Stack>

        {/* Add/Edit Risk Modal */}
        <StandardModal
          isOpen={isRiskModalOpen}
          onClose={handleRiskModalClose}
          title={selectedRow.length > 0 ? "Edit project risk" : "Add a new risk"}
          description={selectedRow.length > 0
            ? "Modify the risk details and mitigation strategies."
            : "Create a detailed breakdown of risks and their mitigation strategies to assist in documenting your risk management activities effectively."
          }
          onSubmit={handleRiskModalSubmit}
          submitButtonText={selectedRow.length > 0 ? "Update" : "Save"}
          isSubmitting={isSubmitting}
          maxWidth={isHistorySidebarOpen ? "1375px" : "1039px"}
          headerActions={selectedRow.length > 0 ? (
            <Tooltip title="View activity history" arrow>
              <IconButton
                onClick={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
                size="small"
                sx={{
                  color: isHistorySidebarOpen ? "#13715B" : "#98A2B3",
                  padding: "4px",
                  borderRadius: "4px",
                  backgroundColor: isHistorySidebarOpen ? "#E6F4F1" : "transparent",
                  "&:hover": {
                    backgroundColor: isHistorySidebarOpen ? "#D1EDE6" : "#F2F4F7",
                  },
                }}
              >
                <HistoryIcon size={20} />
              </IconButton>
            </Tooltip>
          ) : undefined}
        >
          <Stack
            direction="row"
            sx={{
              width: "100%",
              minHeight: 0,
              alignItems: "stretch",
              overflow: "hidden",
              position: "relative"
            }}
          >
            <Box sx={{
              flex: isHistorySidebarOpen ? "0 0 auto" : 1,
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflowX: "hidden",
              overflowY: "auto"
            }}>
              <AddNewRiskForm
                closePopup={handleRiskModalClose}
                popupStatus={selectedRow.length > 0 ? "edit" : "new"}
                onSuccess={selectedRow.length > 0 ? handleUpdate : handleSuccess}
                onError={handleError}
                onLoading={handleLoading}
                users={users}
                usersLoading={usersLoading}
                onSubmitRef={onSubmitRef}
                compactMode={isHistorySidebarOpen}
              />
            </Box>
            {selectedRow.length > 0 && selectedRow[0]?.id && (
              <HistorySidebar
                entityType="risk"
                entityId={selectedRow[0].id}
                isOpen={isHistorySidebarOpen}
              />
            )}
          </Stack>
        </StandardModal>
        {showCustomizableSkeleton ? (
          <CustomizableSkeleton
            variant="rectangular"
            width="100%"
            height={200}
          />
        ) : (
          <GroupedTableView
            groupedData={groupedRisks}
            ungroupedData={filteredRisks}
            renderTable={(data, options) => (
              <VWProjectRisksTable
                rows={data}
                setPage={setCurrentPagingation}
                page={currentPage}
                setSelectedRow={(row: RiskModel) => setSelectedRow([row])}
                setAnchor={() => setIsRiskModalOpen(true)}
                onDeleteRisk={handleDelete}
                flashRow={currentRow}
                hidePagination={options?.hidePagination}
              />
            )}
          />
        )}
      </Stack>
      <AddNewRiskMITModal
        isOpen={isAIModalOpen}
        setIsOpen={setIsAIModalOpen}
        onRiskSelected={handleRiskSelected}
      />
      <AddNewRiskIBMModal
        isOpen={isIBMModalOpen}
        setIsOpen={setIsIBMModalOpen}
        onRiskSelected={handleRiskSelected}
      />
      {/* AI Risk Modal */}
      <StandardModal
        isOpen={isAiRiskModalOpen && !!selectedRiskData}
        onClose={handleAiRiskModalClose}
        title="Add a new risk from AI database"
        description="Review and edit the selected risk from the AI database before saving."
        onSubmit={handleAiRiskModalSubmit}
        submitButtonText="Save"
        isSubmitting={isSubmitting}
        maxWidth="1039px"
      >
        <AddNewRiskForm
          closePopup={handleAiRiskModalClose}
          popupStatus="new"
          onSuccess={handleSuccess}
          onError={handleError}
          onLoading={handleLoading}
          initialRiskValues={selectedRiskData || undefined}
          users={users}
          usersLoading={usersLoading}
          onSubmitRef={onAiRiskSubmitRef}
        />
      </StandardModal>

      {/* Analytics Drawer */}
      <AnalyticsDrawer
        open={isAnalyticsDrawerOpen}
        onClose={() => setIsAnalyticsDrawerOpen(false)}
        title="Risk Analytics & Trends"
        description="Track your project risks history over time"
        entityName="Risk"
        chartType="risk"
        availableParameters={[
          { value: "severity", label: "Severity" },
          { value: "likelihood", label: "Likelihood" },
          { value: "mitigation_status", label: "Mitigation Status" },
          { value: "risk_level", label: "Risk Level" },
        ]}
        defaultParameter="risk_level"
      />

      <PageTour steps={RiskManagementSteps} run={true} tourKey="risk-management-tour" />
      </Stack>
    </Stack>
  );
};

export default RiskManagement;