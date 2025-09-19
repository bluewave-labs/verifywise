import { Suspense, useCallback, useEffect, useState, useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Project } from "../../../../../domain/types/Project";
import { useSearchParams } from "react-router-dom";
import RisksCard from "../../../../components/Cards/RisksCard";
import RiskVisualizationTabs from "../../../../components/RiskVisualization/RiskVisualizationTabs";
import RiskFilters from "../../../../components/RiskVisualization/RiskFilters";
import { rowStyle } from "./style";
import VWProjectRisksTable from "../../../../components/Table/VWProjectRisksTable";
import { ProjectRisk } from "../../../../../domain/types/ProjectRisk";
import AddNewRiskForm from "../../../../components/AddNewRiskForm";
import Popup from "../../../../components/Popup";
import { handleAlert } from "../../../../../application/tools/alertUtils";
import Alert from "../../../../components/Alert";
import { deleteEntityById } from "../../../../../application/repository/entity.repository";
import CustomizableToast from "../../../../components/Toast";
import CustomizableSkeleton from "../../../../components/Skeletons";
import useUsers from "../../../../../application/hooks/useUsers";
import { getAllProjectRisksByProjectId } from "../../../../../application/repository/projectRisk.repository";

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
  const { users, loading: usersLoading } = useUsers();
  const [searchParams] = useSearchParams();
  const projectId =
    parseInt(searchParams.get("projectId") ?? "0") || project!.id;
  const [refreshKey, setRefreshKey] = useState(0); // Add refreshKey state
  const [projectRisks, setProjectRisks] = useState<ProjectRisk[]>([]);
  const [selectedRow, setSelectedRow] = useState<ProjectRisk[]>([]);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
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

  // New state for enhanced risk visualization
  const [selectedRisk, setSelectedRisk] = useState<ProjectRisk | null>(null);
  const [filteredRisks, setFilteredRisks] = useState<ProjectRisk[]>([]);
  const [, setActiveFilters] = useState<any>(null);

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


  const handleLoading = (message: string) => {
    setIsLoading((prev) => ({ ...prev, loading: true, message: message }));
  };

  const handleUpdate = () => {
    setTimeout(() => {
      setIsLoading(initialLoadingState);
      handleToast("success", "Risk updated successfully");
    }, 1000);

    fetchProjectRisks();
    setRefreshKey((prevKey) => prevKey + 1);
    setAnchor(null); // Close the popup
  };

  const handleError = (errorMessage: any) => {
    setIsLoading(initialLoadingState);
    handleToast("error", errorMessage);
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

  const handleRiskSelect = (risk: ProjectRisk) => {
    setSelectedRisk(risk);
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
        <RisksCard risksSummary={risksSummary} />
      </Stack>
      <br />

      <Stack spacing={3}>
        {/* Risk Filters */}
        <RiskFilters
          risks={projectRisks}
          onFilterChange={handleRiskFilterChange}
          hideProjectFilter={true}
          hideFrameworkFilter={true}
        />

        {/* Risk Visualization Section */}
        <RiskVisualizationTabs
          risks={filteredRisks}
          selectedRisk={selectedRisk}
          onRiskSelect={handleRiskSelect}
        />
      </Stack>
      <br />
      <Stack
        className="vw-project-risks-row"
        sx={{
          gap: 10,
          mb: 10,
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#1A1919" }}>
          Project risks
        </Typography>

        {showCustomizableSkeleton ? (
          <CustomizableSkeleton
            variant="rectangular"
            width="100%"
            height={200}
          />
        ) : (
          <VWProjectRisksTable
            columns={TITLE_OF_COLUMNS}
            rows={projectRisks}
            setPage={setCurrentPagingation}
            page={currentPage}
            setSelectedRow={(row: ProjectRisk) => setSelectedRow([row])}
            setAnchor={setAnchor}
            deleteRisk={handleDelete}
            flashRow={null}
          />
        )}
      </Stack>

      {/* Edit Risk Popup */}
      {selectedRow.length > 0 && anchor && (
        <Popup
          popupId="edit-risk-popup"
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
          handleOpenOrClose={() => setAnchor(null)}
          anchor={anchor}
        />
      )}
    </Stack>
  );
};

export default VWProjectRisks;
