import { Suspense, useCallback, useEffect, useState, useMemo } from "react";
import { Box, Stack, Popover, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import RisksCard from "../../components/Cards/RisksCard";
import RiskFilters from "../../components/RiskVisualization/RiskFilters";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { CirclePlus as AddCircleOutlineIcon, TrendingUp, ChevronDown } from "lucide-react"
import ibmLogo from "../../assets/ibm_logo.svg";
import mitLogo from "../../assets/mit_logo.svg";
import VWProjectRisksTable from "../../components/Table/VWProjectRisksTable";
import AddNewRiskForm from "../../components/AddNewRiskForm";
import Popup from "../../components/Popup";
import { handleAlert } from "../../../application/tools/alertUtils";
import Alert from "../../components/Alert";
import { deleteEntityById } from "../../../application/repository/entity.repository";
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
import HelperDrawer from "../../components/HelperDrawer";
import TipBox from "../../components/TipBox";
import HelperIcon from "../../components/HelperIcon";
import PageTour from "../../components/PageTour";
import RiskManagementSteps from "./RiskManagementSteps";
import { RiskModel } from "../../../domain/models/Common/risks/risk.model";
import { IFilterState } from "../../../domain/interfaces/i.filter";
import AnalyticsDrawer from "../../components/AnalyticsDrawer";
import { ExportMenu } from "../../components/Table/ExportMenu";

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
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [aiRiskAnchor, setAiRiskAnchor] = useState<null | HTMLElement>(null);
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
  const [filteredRisks, setFilteredRisks] = useState<RiskModel[]>([]);
  const [activeFilters, setActiveFilters] = useState<IFilterState | null>(null);
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);
  const [isAnalyticsDrawerOpen, setIsAnalyticsDrawerOpen] = useState(false);

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

  const fetchProjectRisks = useCallback(async (filter = 'active') => {
    try {
      const response = await getAllProjectRisks({ filter: filter as 'active' | 'deleted' | 'all' });
      setShowCustomizableSkeleton(false);
      setProjectRisks(response.data);
      setFilteredRisks(response.data); // Initialize filtered risks
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
      // Create a temporary button element to use as anchor
      const tempButton = document.createElement('button');
      setAnchor(tempButton);
      setSelectedRow([]);

      // Clear the navigation state to prevent re-opening on subsequent navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  /**
   * Handle actions for project risk modal
   * Set an anchor to open/close the add-new-risk-popup
   * Display tostify for create and update project risk
   *
   */

  const handleOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : event.currentTarget);
    setSelectedRow([]);
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

  const handleAiRiskOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
    setAiRiskAnchor(aiRiskAnchor ? null : event.currentTarget);
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
    // Created a dummy anchor element to trigger the popup
    const dummyElement = document.createElement("div");
    setAiRiskAnchor(dummyElement);
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

  const handleRiskFilterChange = (filtered: RiskModel[], filters: IFilterState) => {
    setFilteredRisks(filtered);
    setActiveFilters(filters);
    
    // If deletion status filter changes, refetch data from API
    if (filters.deletionStatus !== (activeFilters?.deletionStatus || 'active')) {
      setShowCustomizableSkeleton(true);
      fetchProjectRisks(filters.deletionStatus);
    }
  };

  return (
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Risk management & mitigation"
        description="Identify, assess, and mitigate risks across your AI projects and operations"
        whatItDoes="Manage *risk lifecycle* from *identification* to *mitigation* across all AI projects. Track *risk severity*, *likelihood assessments*, and *mitigation strategies*. Maintain comprehensive *risk registers* with *ownership assignments* and *progress monitoring*."
        whyItMatters="Effective **risk management** is crucial for maintaining *operational resilience* and *regulatory compliance*. Proactive risk identification and mitigation help prevent incidents, protect assets, and ensure *business continuity* while meeting *governance requirements*."
        quickActions={[
          {
            label: "Add New Risk",
            description: "Identify and document new risks with assessment details",
            primary: true
          },
          {
            label: "Import AI Risks",
            description: "Add risks from the MIT AI Risk Database for comprehensive coverage"
          }
        ]}
        useCases={[
          "*Operational risk assessment* for *AI model deployments* and *data processing activities*",
          "*Regulatory compliance* tracking for *governance frameworks* like *EU AI Act* and ISO standards"
        ]}
        keyFeatures={[
          "**Comprehensive risk assessment** with *severity* and *likelihood scoring*",
          "*MIT AI Risk Database* integration for *industry-standard risk templates*",
          "*Risk visualization* and *filtering* with *real-time dashboard updates*"
        ]}
        tips={[
          "*Regular risk reviews* help identify *emerging threats* before they impact operations",
          "Use *risk categories* to organize threats by *impact area* and *regulatory requirements*",
          "Set *clear ownership* and *target dates* for effective *risk mitigation tracking*"
        ]}
      />

      <Stack gap={"16px"} maxWidth={1400} key={refreshKey}>
        <PageHeader
          title="Risk Management"
          description="Manage and monitor risks across all your projects"
          rightContent={
            <HelperIcon
              onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
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
          <div data-joyride-id="risk-filters">
            <RiskFilters
              risks={projectRisks}
              onFilterChange={handleRiskFilterChange}
            />
          </div>
          <Stack direction="row" gap="8px" alignItems="center">
            <ExportMenu
              data={exportData}
              columns={exportColumns}
              filename="risk-management"
              title="Risk Management"
            />
            <div data-joyride-id="analytics-button">
              <CustomizableButton
                variant="contained"
                text="Analytics"
                sx={{
                  backgroundColor: "#7F56D9",
                  border: "1px solid #7F56D9",
                  gap: 2,
                  "&:hover": {
                    backgroundColor: "#6941C6",
                  },
                }}
                onClick={() => setIsAnalyticsDrawerOpen(true)}
                icon={<TrendingUp size={16} />}
              />
            </div>
            <div data-joyride-id="import-ai-risks-button">
              <CustomizableButton
                variant="contained"
                text="Insert risk from..."
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
                  aria-label="Insert risk from database menu"
                  sx={{
                    p: 2,
                    width: "420px",
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
              </Popover>
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
                onClick={handleOpenOrClose}
                icon={<AddCircleOutlineIcon size={16} />}
                isDisabled={
                  !allowedRoles.projectRisks.create.includes(userRoleName)
                }
              />
            </div>
          </Stack>
        </Stack>

        {selectedRow.length > 0 && anchor ? (
          <Popup
            popupId="edit-new-risk-popup"
            popupContent={
              <AddNewRiskForm
                closePopup={() => setAnchor(null)}
                popupStatus="edit"
                onSuccess={handleUpdate}
                onError={handleError}
                onLoading={handleLoading}
                users={users}
                usersLoading={usersLoading}
              />
            }
            openPopupButtonName="Edit risk"
            popupTitle="Edit project risk"
            handleOpenOrClose={handleOpenOrClose}
            anchor={anchor}
          />
        ) : (
          <Popup
            popupId="add-new-risk-popup"
            popupContent={
              <AddNewRiskForm
                closePopup={() => setAnchor(null)}
                popupStatus="new"
                onSuccess={handleSuccess}
                onError={handleError}
                onLoading={handleLoading}
                users={users}
                usersLoading={usersLoading}
              />
            }
            openPopupButtonName="Add new risk"
            popupTitle="Add a new risk"
            popupSubtitle="Create a detailed breakdown of risks and their mitigation strategies to assist in documenting your risk management activities effectively."
            handleOpenOrClose={handleOpenOrClose}
            anchor={anchor}
          />
        )}
        {showCustomizableSkeleton ? (
          <CustomizableSkeleton
            variant="rectangular"
            width="100%"
            height={200}
          />
        ) : (
          <VWProjectRisksTable
            rows={filteredRisks.length > 0 ? filteredRisks : projectRisks}
            setPage={setCurrentPagingation}
            page={currentPage}
            setSelectedRow={(row: RiskModel) => setSelectedRow([row])}
            setAnchor={setAnchor}
            onDeleteRisk={handleDelete}
            flashRow={currentRow}
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
      {selectedRiskData && aiRiskAnchor && (
        <Popup
          popupId="add-risk-from-ai-popup"
          popupContent={
            <AddNewRiskForm
              closePopup={() => {
                setAiRiskAnchor(null);
                setSelectedRiskData(null);
              }}
              popupStatus="new"
              onSuccess={handleSuccess}
              onError={handleError}
              onLoading={handleLoading}
              initialRiskValues={selectedRiskData}
              users={users}
              usersLoading={usersLoading}
            />
          }
          openPopupButtonName="Add risk from AI database"
          popupTitle="Add a new risk from AI database"
          popupSubtitle="Review and edit the selected risk from the AI database before saving."
          handleOpenOrClose={handleAiRiskOpenOrClose}
          anchor={aiRiskAnchor}
        />
      )}

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