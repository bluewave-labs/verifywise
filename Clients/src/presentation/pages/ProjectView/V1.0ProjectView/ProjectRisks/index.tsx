import { Suspense, useCallback, useContext, useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Project } from "../../../../../domain/types/Project";
import { useSearchParams } from "react-router-dom";
import useProjectRisks from "../../../../../application/hooks/useProjectRisks";
import RisksCard from "../../../../components/Cards/RisksCard";
import { rowStyle } from "./style";
import CustomizableButton from "../../../../vw-v2-components/Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VWProjectRisksTable from "../../../../vw-v2-components/Table";
import { ProjectRisk } from "../../../../../domain/types/ProjectRisk";
import AddNewRiskForm from "../../../../components/AddNewRiskForm";
import Popup from "../../../../components/Popup";
import { handleAlert } from "../../../../../application/tools/alertUtils";
import Alert from "../../../../components/Alert";
import { deleteEntityById } from "../../../../../application/repository/entity.repository";
import CustomizableToast from "../../../../vw-v2-components/Toast";
import CustomizableSkeleton from "../../../../vw-v2-components/Skeletons";
import allowedRoles from "../../../../../application/constants/permissions";
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";
import AddNewRiskMITModal from "../../../../components/AddNewRiskMITForm";
import { getAllProjectRisksByProjectId } from "../../../../../application/repository/projectRisk.repository";
import RiskMetricsCard from "../../../../components/Cards/RiskMetricsCard";
import RiskVisualizationTabs from "../../../../components/RiskVisualization/RiskVisualizationTabs";
import RiskFilters from "../../../../components/RiskVisualization/RiskFilters";
import { EnhancedRiskSummary, RiskMetrics } from "../../../../../domain/interfaces/iRiskSummary";

const TITLE_OF_COLUMNS = [
  "RISK NAME", // value from risk tab
  "OWNER", // value from risk tab
  "SEVERITY", // value from risk tab
  "LIKELIHOOD", // value from risk tab
  "MITIGATION STATUS", // mitigation status
  "RISK LEVEL", // risk auto calculated value from risk tab
  "TARGET DATE", // start date (deadline) value from mitigation tab
  "Linked controls",
  "",
];

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

const VWProjectRisks = ({ project }: { project?: Project }) => {
  const { userRoleName } = useContext(VerifyWiseContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId =
    parseInt(searchParams.get("projectId") ?? "0") || project!.id;
  const riskId = searchParams.get("riskId");
  const [refreshKey, setRefreshKey] = useState(0); // Add refreshKey state
  const { projectRisksSummary } = useProjectRisks({
    projectId,
    refreshKey,
  });
  const [projectRisks, setProjectRisks] = useState<ProjectRisk[]>([]);
  const [selectedRow, setSelectedRow] = useState<ProjectRisk[]>([]);
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
  } | null>(null);
  
  // New state for enhanced risk visualization
  const [selectedRisk, setSelectedRisk] = useState<ProjectRisk | null>(null);
  const [riskFilters, setRiskFilters] = useState<any>(null);
  const [filteredRisks, setFilteredRisks] = useState<ProjectRisk[]>([]);
  const [activeFilters, setActiveFilters] = useState<any>(null);

  const fetchProjectRisks = useCallback(async () => {
    try {
    const response = await getAllProjectRisksByProjectId({
        projectId: String(projectId),
      });
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
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      setShowCustomizableSkeleton(true);
      fetchProjectRisks();
    }
  }, [projectId, fetchProjectRisks, refreshKey]); // Add refreshKey to dependencies

  /**
   * Handle actions for project risk modal
   * Set an anchor to open/close the add-new-risk-popup
   * Display tostify for create and update project risk
   *
   */

  const handleOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : event.currentTarget);
    setSelectedRow([]);
    if (riskId) {
      searchParams.delete("riskId");
      setSearchParams(searchParams);
    }
  };

  const handleAIModalOpen = () => {
    setIsAIModalOpen(true);
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
  }) => {
    setSelectedRiskData(riskData);
    // Created a dummy anchor element to trigger the popup
    const dummyElement = document.createElement('div');
    setAiRiskAnchor(dummyElement);
  };

  const handleLoading = (message: string) => {
    setIsLoading((prev) => ({ ...prev, loading: true, message: message }));
  };

  const handleToast = (type: any, message: string) => {
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
    let rowsPerPage = 5;
    let pageCount = Math.floor(projectRisks.length / rowsPerPage);
    setCurrentPage(pageCount);

    fetchProjectRisks();
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleUpdate = () => {
    setTimeout(() => {
      setIsLoading(initialLoadingState);
      setCurrentRow(selectedRow[0].id); // set current row to trigger flash-feedback
      handleToast("success", "Risk updated successfully");
    }, 1000);

    setTimeout(() => {
      setCurrentRow(null);
    }, 2000);
    fetchProjectRisks();
    setRefreshKey((prevKey) => prevKey + 1); // Update refreshKey to trigger re-render
  };

  const handleError = (errorMessage: any) => {
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
        let rowsPerPage = 5;
        let rowCount = projectRisks.slice(
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
        handleToast("error", "Risk not found.");
      } else {
        handleToast("error", "Unexpected error occurs. Risk delete fails.");
      }
    } catch (error) {
      console.error("Error sending request", error);
      handleToast("error", "Risk delete fails.");
    }
  };

  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page);
  };

  const getEnhancedRiskSummary = (): EnhancedRiskSummary => {
    if (!projectRisksSummary) {
      return {
        veryHighRisks: 0,
        highRisks: 0,
        mediumRisks: 0,
        lowRisks: 0,
        veryLowRisks: 0,
      };
    }

    const mockTrends = {
      veryHighTrend: { direction: 'stable' as const, change: 0, period: 'week' as const },
      highTrend: { direction: 'up' as const, change: 2, period: 'week' as const },
      mediumTrend: { direction: 'down' as const, change: 1, period: 'week' as const },
      lowTrend: { direction: 'stable' as const, change: 0, period: 'week' as const },
      veryLowTrend: { direction: 'up' as const, change: 1, period: 'week' as const },
    };

    return {
      ...projectRisksSummary,
      trends: mockTrends,
      velocity: {
        newRisksThisWeek: 2,
        resolvedRisksThisWeek: 3,
        overdueRisks: getOverdueRisksCount(),
      },
    };
  };

  const handleRiskLevelFilter = (level: string) => {
    const filteredRisks = projectRisks.filter(risk => {
      const riskLevel = risk.riskLevel;
      switch (level) {
        case 'veryHigh':
          return riskLevel >= 16;
        case 'high':
          return riskLevel >= 12 && riskLevel < 16;
        case 'medium':
          return riskLevel >= 8 && riskLevel < 12;
        case 'low':
          return riskLevel >= 4 && riskLevel < 8;
        case 'veryLow':
          return riskLevel < 4;
        default:
          return true;
      }
    });
    
    setRiskFilters({ level, risks: filteredRisks });
    handleToast("info", `Filtered to show ${filteredRisks.length} ${level.replace(/([A-Z])/g, ' $1').toLowerCase()} risks`);
  };

  const getRiskMetrics = (): RiskMetrics => {
    const totalRisks = projectRisks.length;
    const resolvedRisks = projectRisks.filter(risk => 
      risk.mitigations?.some(m => m.status === 'completed')
    ).length;
    
    const newRisksThisWeek = 2;
    const resolvedThisWeek = 3;
    const riskVelocity = newRisksThisWeek - resolvedThisWeek;
    
    const mitigationProgress = totalRisks > 0 ? Math.round((resolvedRisks / totalRisks) * 100) : 0;
    
    const totalFinancialImpact = projectRisks.reduce((sum, risk) => {
      return sum + (risk.potentialImpact?.match(/\$(\d+(?:,\d+)*)/)?.[1]?.replace(/,/g, '') || 0);
    }, 0);
    
    return {
      riskVelocity,
      mitigationProgress,
      overdueCount: getOverdueRisksCount(),
      totalFinancialImpact: typeof totalFinancialImpact === 'string' ? 0 : totalFinancialImpact,
    };
  };

  const getOverdueRisksCount = (): number => {
    const now = new Date();
    return projectRisks.filter(risk => {
      if (!risk.mitigations || risk.mitigations.length === 0) return false;
      
      return risk.mitigations.some(mitigation => {
        if (!mitigation.deadline || mitigation.status === 'completed') return false;
        const deadline = new Date(mitigation.deadline);
        return deadline < now;
      });
    }).length;
  };

  const handleVisualizationFilter = (filters: any) => {
    setRiskFilters(filters);
    if (filters.selectedRisk) {
      setSelectedRisk(filters.selectedRisk);
    }
  };

  const handleRiskSelect = (risk: ProjectRisk) => {
    setSelectedRisk(risk);
    // Removed detail panel opening - just keep risk selected for visualization highlighting
  };


  const handleRiskFilterChange = (filtered: ProjectRisk[], filters: any) => {
    setFilteredRisks(filtered);
    setActiveFilters(filters);
  };

  return (
    <Stack className="vw-project-risks" key={refreshKey}>
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
      <Stack className="vw-project-risks-row" sx={rowStyle}>
        <RisksCard 
          risksSummary={getEnhancedRiskSummary()} 
          onRiskLevelClick={handleRiskLevelFilter}
        />
        <RiskMetricsCard 
          metrics={getRiskMetrics()}
          velocity={{
            newRisksThisWeek: 2,
            resolvedRisksThisWeek: 3,
            overdueRisks: getOverdueRisksCount()
          }}
        />
      </Stack>
      
      {/* Risk Filters */}
      <RiskFilters
        risks={projectRisks}
        onFilterChange={handleRiskFilterChange}
      />
      
      {/* Risk Visualization Section */}
      <RiskVisualizationTabs
        risks={filteredRisks}
        selectedRisk={selectedRisk}
        onRiskSelect={handleRiskSelect}
        onFilterChange={handleVisualizationFilter}
      />
      <br />
      <Stack
        className="vw-project-risks-row"
        sx={{
          gap: 10,
          mb: 10,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#1A1919" }}>
            Project risks
          </Typography>
          <Stack direction="row" gap={10}>
            <CustomizableButton
              variant="contained"
              text="Insert from AI risks database"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
              }}
              onClick={handleAIModalOpen}
              icon={<AddCircleOutlineIcon />}
              isDisabled={
                !allowedRoles.projectRisks.create.includes(userRoleName)
              }
            />
            <CustomizableButton
              variant="contained"
              text="Add new risk"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
              }}
              onClick={handleOpenOrClose}
              icon={<AddCircleOutlineIcon />}
              isDisabled={
                !allowedRoles.projectRisks.create.includes(userRoleName)
              }
            />
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
            columns={TITLE_OF_COLUMNS}
            rows={filteredRisks}
            setPage={setCurrentPagingation}
            page={currentPage}
            setSelectedRow={(row: ProjectRisk) => setSelectedRow([row])}
            setAnchor={setAnchor}
            deleteRisk={handleDelete}
            flashRow={currentRow}
          />
        )}
      </Stack>
      <AddNewRiskMITModal
        isOpen={isAIModalOpen}
        setIsOpen={setIsAIModalOpen}
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
            />
          }
          openPopupButtonName="Add risk from AI database"
          popupTitle="Add a new risk from AI database"
          popupSubtitle="Review and edit the selected risk from the AI database before saving."
          handleOpenOrClose={handleAiRiskOpenOrClose}
          anchor={aiRiskAnchor}
        />
      )}
    </Stack>
  );
};

export default VWProjectRisks;
