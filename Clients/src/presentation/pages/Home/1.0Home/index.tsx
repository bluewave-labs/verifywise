import { useContext, useEffect, useState } from "react";
import { Stack, Typography, Modal, Box } from "@mui/material";
import { headerCardPlaceholder, vwhomeHeading } from "./style";
import SmallStatsCard from "../../../components/Cards/SmallStatsCard";
import VWButton from "../../../vw-v2-components/Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import VWProjectCard from "../../../components/Cards/ProjectCard";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import { postAutoDrivers } from "../../../../application/repository/entity.repository";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import NoProject from "../../../components/NoProject/NoProject";
import VWToast from "../../../vw-v2-components/Toast";
import Alert from "../../../components/Alert";
import { logEngine } from "../../../../application/tools/log.engine";
import VWProjectForm from "../../../vw-v2-components/Forms/ProjectForm";
import {
  AssessmentProgress,
  ComplianceProgress,
} from "../../../../application/interfaces/iprogress";
import { useProjectData } from "../../../../application/hooks/useFetchProjects";
import { AlertState } from "../../../../application/interfaces/appStates";
import { User } from "../../../../domain/User";
import { fetchData } from "../../../../application/hooks/fetchDataHook";

const VWHome = () => {
  const { setDashboardValues } = useContext(VerifyWiseContext);

  const [complianceProgressData, setComplianceProgressData] =
    useState<ComplianceProgress>();
  const [assessmentProgressData, setAssessmentProgressData] =
    useState<AssessmentProgress>();
  const [_, setUserList] = useState<User[]>([]);
  const [__, setIsDemoDataGenerating] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<AlertState>();
  const [isProjectFormModalOpen, setIsProjectFormModalOpen] =
    useState<boolean>(false);
  const [refreshProjectsFlag, setRefreshProjectsFlag] =
    useState<boolean>(false);
  const [showToastNotification, setShowToastNotification] =
    useState<boolean>(false);

  const { projects, loading: projectLoading, fetchProjects } = useProjectData();

  useEffect(() => {
    const fetchProgressData = async () => {
      await fetchData("/users", (data) => {
        setUserList(data);
        setDashboardValues({ users: data });
      });
      await fetchData(
        "/projects/all/compliance/progress",
        setComplianceProgressData
      );
      await fetchData(
        "/projects/all/assessment/progress",
        setAssessmentProgressData
      );
      await fetchProjects();
    };

    fetchProgressData();
  }, [setDashboardValues, refreshProjectsFlag, fetchProjects]);

  const handleProjectFormModalClose = () => {
    setIsProjectFormModalOpen(false);
    setRefreshProjectsFlag((prev) => !prev);
  };

  const handleGenerateDemoDataClick = async () => {
    setIsDemoDataGenerating(true);
    setShowToastNotification(true);
    try {
      const response = await postAutoDrivers();
      if (response.status === 201) {
        logEngine({
          type: "info",
          message: "Demo data generated successfully.",
        });
        setAlertState({
          variant: "success",
          body: "Demo data generated successfully.",
        });
        setTimeout(() => {
          setAlertState(undefined);
        }, 3000);

        // Fetch the updated data
        await fetchProjects();
        await fetchData(
          "/projects/all/compliance/progress",
          setComplianceProgressData
        );
        await fetchData(
          "/projects/all/assessment/progress",
          setAssessmentProgressData
        );
        window.location.reload();
      } else {
        logEngine({
          type: "error",
          message: "Failed to generate demo data.",
        });
        setAlertState({
          variant: "error",
          body: "Failed to generate demo data.",
        });
        setTimeout(() => {
          setAlertState(undefined);
        }, 3000);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      logEngine({
        type: "error",
        message: `An error occurred: ${errorMessage}`,
      });
      setAlertState({
        variant: "error",
        body: `An error occurred: ${errorMessage}`,
      });
      setTimeout(() => {
        setAlertState(undefined);
      }, 3000);
    } finally {
      setIsDemoDataGenerating(false);
      setShowToastNotification(false);
      setRefreshProjectsFlag((prev) => !prev);
    }
  };

  return (
    <Stack className="vwhome">
      {alertState && (
        <Alert
          variant={alertState.variant}
          title={alertState.title}
          body={alertState.body}
          isToast={true}
          onClick={() => setAlertState(undefined)}
        />
      )}
      {showToastNotification && (
        <VWToast title="Generating demo data. Please wait..." />
      )}
      <Stack className="vwhome-header" sx={{ mb: 15 }}>
        <Typography sx={vwhomeHeading}>
          All projects compliance status
        </Typography>
        <Stack
          className="vwhome-header-cards"
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          {projectLoading ? (
            <VWSkeleton variant="rectangular" sx={headerCardPlaceholder} />
          ) : (
            <SmallStatsCard
              attributeTitle="Compliance tracker"
              progress={`${
                complianceProgressData
                  ? complianceProgressData.allDonesubControls
                  : 0
              }/${
                complianceProgressData
                  ? complianceProgressData.allsubControls
                  : 1
              }`}
              rate={
                (complianceProgressData?.allDonesubControls ?? 0) /
                (complianceProgressData?.allsubControls ?? 1)
              }
            />
          )}
          {projectLoading ? (
            <VWSkeleton variant="rectangular" sx={headerCardPlaceholder} />
          ) : (
            <SmallStatsCard
              attributeTitle="Assessment tracker"
              progress={`${assessmentProgressData?.answeredQuestions ?? 0}/${
                assessmentProgressData?.totalQuestions ?? 1
              }`}
              rate={
                assessmentProgressData
                  ? (assessmentProgressData.answeredQuestions ?? 0) /
                    (assessmentProgressData.totalQuestions ?? 1)
                  : 0
              }
            />
          )}
        </Stack>
      </Stack>
      <Stack className="vwhome-body">
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 9,
          }}
        >
          <Typography sx={vwhomeHeading}>Projects overview</Typography>
          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            {projects.length === 0 && (
              <VWButton
                variant="contained"
                text="Insert demo data"
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                }}
                icon={<CloudDownloadIcon />}
                onClick={() => handleGenerateDemoDataClick()}
              />
            )}

            <VWButton
              variant="contained"
              text="New project"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
              }}
              icon={<AddCircleOutlineIcon />}
              onClick={() => setIsProjectFormModalOpen(true)}
            />
          </Stack>
        </Stack>
        <Stack
          className="vwhome-body-projects"
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {projects?.length === 0 || !projects ? (
            <NoProject message="There no projects available." />
          ) : projects?.length <= 3 ? (
            <>
              <Box
                sx={{
                  width: projects.length === 1 ? "50%" : "100%",
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: projects.length < 4 ? "" : "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                {projects.map((project) => (
                  <VWProjectCard key={project.id} project={project} />
                ))}
              </Box>
            </>
          ) : (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: { xs: 10, md: 10 },
                  width: "100%",
                }}
              >
                {projects &&
                  projects.map((project) => (
                    <Box key={project.id} sx={{ gridColumn: "span 1" }}>
                      <VWProjectCard key={project.id} project={project} />
                    </Box>
                  ))}
              </Box>
            </>
          )}
        </Stack>
      </Stack>
      <Modal
        open={isProjectFormModalOpen}
        onClose={handleProjectFormModalClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 1,
          }}
        >
          <VWProjectForm onClose={handleProjectFormModalClose} />
        </Box>
      </Modal>
    </Stack>
  );
};

export default VWHome;
