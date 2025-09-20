import { Suspense, useCallback, useEffect, useState, useMemo } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import RisksCard from "../../components/Cards/RisksCard";
import RiskFilters from "../../components/RiskVisualization/RiskFilters";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg"
import VWProjectRisksTable from "../../components/Table/VWProjectRisksTable";
import { ProjectRisk } from "../../../domain/types/ProjectRisk";
import AddNewRiskForm from "../../components/AddNewRiskForm";
import Popup from "../../components/Popup";
import { handleAlert } from "../../../application/tools/alertUtils";
import Alert from "../../components/Alert";
import { deleteEntityById } from "../../../application/repository/entity.repository";
import CustomizableToast from "../../components/Toast";
import CustomizableSkeleton from "../../components/Skeletons";
import allowedRoles from "../../../application/constants/permissions";
import AddNewRiskMITModal from "../../components/AddNewRiskMITForm";
import { getAllProjectRisks } from "../../../application/repository/projectRisk.repository";
import { useAuth } from "../../../application/hooks/useAuth";
import useUsers from "../../../application/hooks/useUsers";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";

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

const rowStyle = {
  display: "flex",
  flexDirection: "row",
  gap: 10,
  mb: 10,
};

const RiskManagement = () => {
  const theme = useTheme();
  const { userRoleName } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const [refreshKey, setRefreshKey] = useState(0); // Add refreshKey state
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
    applicableProjects: number[];
    applicableFrameworks: number[];
  } | null>(null);

  // State for filtering
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
      const response = await getAllProjectRisks();
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

  const handleRiskFilterChange = (filtered: ProjectRisk[], filters: any) => {
    setFilteredRisks(filtered);
    setActiveFilters(filters);
  };

  return (
    <Stack className="vwhome" gap={"20px"}>
      <PageBreadcrumbs />

      <Stack gap={theme.spacing(2)} maxWidth={1400} key={refreshKey}>
        <PageHeader
          title="Risk Management"
          description="Manage and monitor risks across all your projects"
        />

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
      <Stack className="risk-management-row" sx={rowStyle}>
        <RisksCard risksSummary={risksSummary} />
      </Stack>

      <Stack spacing={3}>
        <RiskFilters
          risks={projectRisks}
          onFilterChange={handleRiskFilterChange}
        />
      </Stack>
      <br />
      <Stack
        className="risk-management-row"
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
            All Risks
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
            columns={TITLE_OF_COLUMNS}
            rows={filteredRisks.length > 0 ? filteredRisks : projectRisks}
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
      </Stack>
    </Stack>
  );
};

export default RiskManagement;