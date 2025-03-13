import { Suspense, useCallback, useContext, useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Project } from "../../../../../domain/Project";
import { useSearchParams } from "react-router-dom";
import useProjectRisks from "../../../../../application/hooks/useProjectRisks";
import RisksCard from "../../../../components/Cards/RisksCard";
import { rowStyle } from "./style";
import VWButton from "../../../../vw-v2-components/Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { getEntityById } from "../../../../../application/repository/entity.repository";
import VWProjectRisksTable from "../../../../vw-v2-components/Table";
import { ProjectRisk } from "../../../../../domain/ProjectRisk";
import AddNewRiskForm from "../../../../components/AddNewRiskForm";
import Popup from "../../../../components/Popup";
import { handleAlert } from "../../../../../application/tools/alertUtils";
import Alert from "../../../../components/Alert";
import { deleteEntityById } from "../../../../../application/repository/entity.repository";
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";

const TITLE_OF_COLUMNS = [
  "RISK NAME",
  "IMPACT",
  "OWNER",
  "SEVERITY",
  "LIKELIHOOD",
  "RISK LEVEL",
  "MITIGATION",
  "FINAL RISK LEVEL",
  "",
];

const VWProjectRisks = ({ project }: { project?: Project }) => {
  const [searchParams] = useSearchParams();
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { selectedProjectId } = dashboardValues;
  const { projectRisksSummary } = useProjectRisks({
    projectId: selectedProjectId?.toString(),
  });
  const [projectRisks, setProjectRisks] = useState<ProjectRisk[]>([]);
  const [selectedRow, setSelectedRow] = useState<ProjectRisk>();
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchProjectRisks = useCallback(async () => {
    try {
      const response = await getEntityById({
        routeUrl: `/projectRisks/by-projid/${selectedProjectId}`,
      });
      setProjectRisks(response.data);
    } catch (error) {
      console.error("Error fetching project risks:", error);
      handleAlert({
        variant: "error",
        body: "Error fetching project risks",
        setAlert,
      });
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectRisks();
    }
  }, [selectedProjectId, fetchProjectRisks]); 

  /**
   * Handle actions for project risk modal
   * Set an anchor to open/close the add-new-risk-popup
   * Display tostify for create and update project risk
   *
   */

  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const handleOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : event.currentTarget);
  };

  const handleClosePopup = () => {
    setAnchorEl(null); // Close the popup
    setSelectedRow(undefined);
  };

  const handleSuccess = () => {
    handleAlert({
      variant: "success",
      body: "Project risk created successfully",
      setAlert,
    });

    // set pagination for FIFO risk listing after adding a new risk
    let rowsPerPage = 5;
    let pageCount = Math.floor(projectRisks.length / rowsPerPage);
    setCurrentPage(pageCount);

    fetchProjectRisks();
  };

  const handleUpdate = () => {
    handleAlert({
      variant: "success",
      body: "Risk updated successfully",
      setAlert,
    });
    fetchProjectRisks();
  };

  const handleDelete = async (riskId: number) => {
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

        fetchProjectRisks();
      }
    } catch (error) {
      console.error("Error sending request", error);
      handleAlert({
        variant: "error",
        body: "Risk delete fails",
        setAlert,
      });
    }
  };

  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Stack className="vw-project-risks" >
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
      <Stack className="vw-project-risks-row" sx={rowStyle}>
        <RisksCard risksSummary={projectRisksSummary} />
      </Stack>
      <br />
      <Stack
        className="vw-project-risks-row"
        sx={{
          gap: 10,
          mb: 10,
        }}
      >
        <Stack
          sx={{
            width: "100%",
            maxWidth: 1400,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#1A1919" }}>
            Project risks
          </Typography>

          <VWButton
            variant="contained"
            text="Add new risk"
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
            }}
            onClick={handleOpenOrClose}
            icon={<AddCircleOutlineIcon />}
          />
        </Stack>

        {anchor && (
          <Popup
            popupId="add-new-risk-popup"
            popupContent={
              <AddNewRiskForm
                closePopup={() => setAnchor(null)}
                popupStatus="new"
                onSuccess={handleSuccess}
              />
            }
            openPopupButtonName="Add new risk"
            popupTitle="Add a new risk"
            popupSubtitle="Create a detailed breakdown of risks and their mitigation strategies to assist in documenting your risk management activities effectively."
            handleOpenOrClose={handleOpenOrClose}
            anchor={anchor}
          />
        )}

        {Object.keys(selectedRow || {}).length > 0 && anchorEl && (
          <Popup
            popupId="edit-new-risk-popup"
            popupContent={
              <AddNewRiskForm
                closePopup={() => setAnchorEl(null)}
                popupStatus="edit"
                onSuccess={handleUpdate}
              />
            }
            openPopupButtonName="Edit risk"
            popupTitle="Edit project risk"
            handleOpenOrClose={handleClosePopup}
            anchor={anchorEl}
          />
        )}
        <VWProjectRisksTable
          columns={TITLE_OF_COLUMNS}
          rows={projectRisks}
          setPage={setCurrentPagingation}
          page={currentPage}
          setSelectedRow={(row: ProjectRisk) => setSelectedRow(row)}
          setAnchorEl={setAnchorEl}
          deleteRisk={handleDelete}
        />
      </Stack>
    </Stack>
  );
};

export default VWProjectRisks;
