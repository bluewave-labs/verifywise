import { Suspense, useCallback, useEffect, useState } from "react";
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
  const projectId = searchParams.get("projectId") || project?.id;
  const [refreshKey, setRefreshKey] = useState(0); // Add refreshKey state
  const { projectRisksSummary } = useProjectRisks({
    projectId: projectId?.toString(), refreshKey
  });
  const [projectRisks, setProjectRisks] = useState<ProjectRisk[]>([]);
  const [selectedRow, setSelectedRow] = useState<ProjectRisk[]>([]);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  const fetchProjectRisks = useCallback(async () => {
    try {
      const response = await getEntityById({
        routeUrl: `/projectRisks/by-projid/${projectId}`,
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
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectRisks();
    }
  }, [projectId, fetchProjectRisks, refreshKey]); // Add refreshKey to dependencies

  /**
   * Handle actions for project risk modal 
   * Set an anchor to open/close the add-new-risk-popup
   * Display tostify for create and update project risk
   * 
  */  

  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const handleOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : event.currentTarget);
    setSelectedRow([]);
  };

  const handleSuccess = () => {
    handleAlert({
      variant: "success",
      body: "Project risk created successfully",
      setAlert,
    });

    // set pagination for FIFO risk listing after adding a new risk
    let rowsPerPage = 5;
    let pageCount = Math.floor(projectRisks.length/rowsPerPage);
    setCurrentPage(pageCount)
    
    fetchProjectRisks();
    setRefreshKey((prevKey) => prevKey + 1);    
  };

  const handleUpdate = () => {
    handleAlert({
      variant: "success",
      body: "Risk updated successfully",
      setAlert,
    });
    fetchProjectRisks();
    setRefreshKey((prevKey) => prevKey + 1); // Update refreshKey to trigger re-render
  };

  const handleError = (error: any) => {    
    handleAlert({
      variant: "error",
      body: (error.message !== undefined) ? error.message : error,
      setAlert,
    });
  }

  const handleDelete = async(riskId: number) => {
    try {
      const response = await deleteEntityById({
        routeUrl: `/projectRisks/${riskId}`,
      });          
      if (response.status === 200) { 
        // Set current pagination number after deleting the risk
        let rowsPerPage = 5;
        let rowCount = projectRisks.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);
    
        if(currentPage !== 0 && rowCount.length === 1){
          setCurrentPage(currentPage - 1)
        }else{
          setCurrentPage(currentPage)
        }   

        fetchProjectRisks(); 
        setRefreshKey((prevKey) => prevKey + 1);
      }
    } catch (error) {
      console.error("Error sending request", error);
      handleAlert({
        variant: "error",
        body: "Risk delete fails",
        setAlert,
      });
    }
  }

  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page)
  }

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
      <Stack className="vw-project-risks-row" sx={rowStyle}>
        <RisksCard projectRisksSummary={projectRisksSummary} />
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
        
        {selectedRow.length > 0 && anchor ? (
          <Popup
            popupId="edit-new-risk-popup"
            popupContent={
              <AddNewRiskForm
                closePopup={() => setAnchor(null)}
                popupStatus="edit"
                onSuccess={handleUpdate}
                onError={handleError}
              />
            }
            openPopupButtonName="Edit risk"
            popupTitle="Edit project risk"
            handleOpenOrClose={handleOpenOrClose}
            anchor={anchor}
          />
          )
          : (
            <Popup
            popupId="add-new-risk-popup"
            popupContent={
              <AddNewRiskForm
                closePopup={() => setAnchor(null)}
                popupStatus="new"
                onSuccess={handleSuccess}
                onError={handleError}
              />
            }
            openPopupButtonName="Add new risk"
            popupTitle="Add a new risk"
            popupSubtitle="Create a detailed breakdown of risks and their mitigation strategies to assist in documenting your risk management activities effectively."
            handleOpenOrClose={handleOpenOrClose}
            anchor={anchor}
          />
          )
        }
        <VWProjectRisksTable
          columns={TITLE_OF_COLUMNS}
          rows={projectRisks}
          setPage={setCurrentPagingation}
          page={currentPage}
          setSelectedRow={(row: ProjectRisk) => setSelectedRow([row])}
          setAnchor={setAnchor}
          deleteRisk={handleDelete}
        />
      </Stack>
    </Stack>
  );
};

export default VWProjectRisks;
