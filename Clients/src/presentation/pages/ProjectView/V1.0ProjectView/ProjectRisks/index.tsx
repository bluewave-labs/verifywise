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
  const { projectRisksSummary } = useProjectRisks({
    projectId: projectId?.toString(),
  });
  const [projectRisks, setProjectRisks] = useState<ProjectRisk[]>([]);
  const [selectedRow, setSelectedRow] = useState<ProjectRisk>();
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Add refreshKey state

  const fetchProjectRisks = useCallback(async () => {
    try {
      const response = await getEntityById({
        routeUrl: `/projectRisks/by-projid/${projectId}`,
      });
      setProjectRisks(response.data);
    } catch (error) {
      console.error("Error fetching project risks:", error);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectRisks();
    }
  }, [projectId, fetchProjectRisks, refreshKey]); // Add refreshKey to dependencies

  const handleClosePopup = () => {
    setAnchorEl(null); // Close the popup
    setSelectedRow(undefined);
  };

  const handleUpdate = () => {
    console.log("update is success!");
    handleAlert({
      variant: "success",
      body: "Risk updated successfully",
      setAlert,
    });

    fetchProjectRisks();
    setRefreshKey((prevKey) => prevKey + 1); // Update refreshKey to trigger re-render
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
            icon={<AddCircleOutlineIcon />}
          />
        </Stack>
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
          setSelectedRow={(row: ProjectRisk) => setSelectedRow(row)}
          setAnchorEl={setAnchorEl}
        />
      </Stack>
    </Stack>
  );
};

export default VWProjectRisks;
