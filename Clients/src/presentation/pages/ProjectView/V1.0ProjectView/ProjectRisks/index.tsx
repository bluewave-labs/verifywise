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
import VWToast from "../../../../vw-v2-components/Toast";
import VWSkeleton from "../../../../vw-v2-components/Skeletons";

const TITLE_OF_COLUMNS = [
  "RISK NAME", // value from risk tab
  "OWNER", // value from risk tab
  "SEVERITY", // value from risk tab
  "LIKELIHOOD", // value from risk tab
  "MITIGATION", // mitigation plan
  "STATUS", // mitigation status
  "RISK LEVEL", // risk auto calculated value from risk tab
  "TARGET DATE", // start date (deadline) value from mitigation tab
  "",
];

/**
 * Set initial loading status for all CRUD process
*/  
interface LoadingStatus {
  loading: boolean;
  message: string;
}

const initialLoadingState : LoadingStatus = {
  loading: false,
  message: ""
}

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
  const [isLoading, setIsLoading] = useState<LoadingStatus>(initialLoadingState);
  const [showVWSkeleton, setShowVWSkeleton] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<number | null>(null);
  
  const fetchProjectRisks = useCallback(async () => {
    try {
      const response = await getEntityById({
        routeUrl: `/projectRisks/by-projid/${projectId}`,
      });
      setShowVWSkeleton(false);
      setProjectRisks(response.data);
    } catch (error) {
      console.error("Error fetching project risks:", error);      
      handleToast("error", "Unexpected error occurs while fetching project risks.");      
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      setShowVWSkeleton(true);
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

  const handleLoading = (message: string) => {  
    setIsLoading((prev) => ({...prev, loading: true, message: message}))
  }

  const handleToast = (type: any, message: string) => {
    handleAlert({
      variant: type,
      body: message,
      setAlert,
    });
    setTimeout(() => {
      setAlert(null);
    }, 3000);
  }

  const handleSuccess = () => {
    setTimeout(()=> {
      setIsLoading(initialLoadingState);
      handleToast("success", "Risk created successfully");
    }, 1000)

    // set pagination for FIFO risk listing after adding a new risk
    let rowsPerPage = 5;
    let pageCount = Math.floor(projectRisks.length/rowsPerPage);
    setCurrentPage(pageCount)
    
    fetchProjectRisks();
    setRefreshKey((prevKey) => prevKey + 1);    
  };

  const handleUpdate = () => {
    setTimeout(()=> {      
      setIsLoading(initialLoadingState);      
      setCurrentRow(selectedRow[0].id); // set current row to trigger flash-feedback
      handleToast("success", "Risk updated successfully")
    }, 1000)

    setTimeout(() => {
      setCurrentRow(null);
    }, 2000)
    fetchProjectRisks();
    setRefreshKey((prevKey) => prevKey + 1); // Update refreshKey to trigger re-render
  };

  const handleError = (errorMessage: any) => {        
    handleToast("error", errorMessage);
  }

  const handleDelete = async(riskId: number) => {
    handleLoading("Deleting the risk. Please wait...");
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
        setTimeout(()=> {
          setIsLoading(initialLoadingState);
          handleToast("success", "Risk deleted successfully.");       
        }, 1000)
        
        
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
      {isLoading.loading && <VWToast title={isLoading.message} />}
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
                onLoading={handleLoading}
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
        {showVWSkeleton ? (
          <VWSkeleton variant="rectangular" width="100%" height={200} />
        ) : (
          <VWProjectRisksTable
            columns={TITLE_OF_COLUMNS}
            rows={projectRisks}
            setPage={setCurrentPagingation}
            page={currentPage}
            setSelectedRow={(row: ProjectRisk) => setSelectedRow([row])}
            setAnchor={setAnchor}
            deleteRisk={handleDelete}
            flashRow={currentRow}
          />
        )}
      </Stack>
    </Stack>
  );
};

export default VWProjectRisks;
