import { useContext, useEffect, useState } from "react";
import { Stack, Typography, Modal, Box } from "@mui/material";
import { headerCardPlaceholder, vwhomeHeading } from "./style";
import SmallStatsCard from "../../../components/Cards/SmallStatsCard";
import VWButton from "../../../vw-v2-components/Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import VWProjectCard from "../../../components/Cards/ProjectCard";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import {
  getAllEntities,
  postAutoDrivers,
} from "../../../../application/repository/entity.repository";
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
import { User } from "../../../../domain/User";
import { AlertState } from "../../../../application/interfaces/appStates";

const VWHome = () => {
  const { setDashboardValues } = useContext(VerifyWiseContext);
  const [complianceProgress, setComplianceProgress] =
    useState<ComplianceProgress>();
  const [assessmentProgress, setAssessmentProgress] =
    useState<AssessmentProgress>();
  const [_, setUsers] = useState<any[]>([]);
  const [__, setIsGeneratingDemoData] = useState(false);
  const [alert, setAlert] = useState<AlertState>();
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [shouldFetchProjects, setShouldFetchProjects] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const { projects, loading: projectLoading, fetchProjects } = useProjectData();

  const fetchData = async (routeUrl: string, setData: (data: any) => void) => {
    try {
      const response = await getAllEntities({ routeUrl });
      setData(response.data);
    } catch (error) {
      console.error(`Error fetching data from ${routeUrl}:`, error);
    }
  };

  useEffect(() => {
    const fetchProgressData = async () => {
      await fetchData("/users", (data) => {
        setUsers(data);
        setDashboardValues({ users: data });
      });
      await fetchData(
        "/projects/all/compliance/progress",
        setComplianceProgress
      );
      await fetchData(
        "/projects/all/assessment/progress",
        setAssessmentProgress
      );
      await fetchProjects();
    };

    fetchProgressData();
  }, [setDashboardValues, shouldFetchProjects, fetchProjects]);

  const handleProjectFormClose = () => {
    setIsProjectFormOpen(false);
    setShouldFetchProjects((prev) => !prev);
  };

  async function generateDemoData() {
    setIsGeneratingDemoData(true);
    setShowToast(true);
    const user: User = {
      id: 0, // Replace with actual user ID
      email: "demo-user@example.com", // Replace with actual user email
      name: "Demo",
      surname: "User",
    };
    try {
      const response = await postAutoDrivers();
      if (response.status === 201) {
        logEngine({
          type: "info",
          message: "Demo data generated successfully.",
          user,
        });
        setAlert({
          variant: "success",
          body: "Demo data generated successfully.",
        });
        setTimeout(() => {
          setAlert(undefined);
        }, 3000);

        // Fetch the updated data
        await fetchProjects();
        await fetchData(
          "/projects/all/compliance/progress",
          setComplianceProgress
        );
        await fetchData(
          "/projects/all/assessment/progress",
          setAssessmentProgress
        );
        window.location.reload();
      } else {
        logEngine({
          type: "error",
          message: "Failed to generate demo data.",
          user,
        });
        setAlert({
          variant: "error",
          body: "Failed to generate demo data.",
        });
        setTimeout(() => {
          setAlert(undefined);
        }, 3000);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      logEngine({
        type: "error",
        message: `An error occurred: ${errorMessage}`,
        user,
      });
      setAlert({
        variant: "error",
        body: `An error occurred: ${errorMessage}`,
      });
      setTimeout(() => {
        setAlert(undefined);
      }, 3000);
    } finally {
      setIsGeneratingDemoData(false);
      setShowToast(false);
      setShouldFetchProjects((prev) => !prev);
    }
  }

  console.log("complianceProgress: ", complianceProgress);
  console.log("assessmentProgress: ", assessmentProgress);

  return (
    <Stack className="vwhome">
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(undefined)}
        />
      )}
      {showToast && <VWToast title="Generating demo data. Please wait..." />}
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
                complianceProgress ? complianceProgress.allDonesubControls : 0
              }/${complianceProgress ? complianceProgress.allsubControls : 1}`}
              rate={
                (complianceProgress?.allDonesubControls ?? 0) /
                (complianceProgress?.allsubControls ?? 1)
              }
            />
          )}
          {projectLoading ? (
            <VWSkeleton variant="rectangular" sx={headerCardPlaceholder} />
          ) : (
            <SmallStatsCard
              attributeTitle="Assessment tracker"
              progress={`${assessmentProgress?.answeredQuestions ?? 0}/${
                assessmentProgress?.totalQuestions ?? 1
              }`}
              rate={
                assessmentProgress
                  ? (assessmentProgress.answeredQuestions ?? 0) /
                    (assessmentProgress.totalQuestions ?? 1)
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
                onClick={() => generateDemoData()}
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
              onClick={() => setIsProjectFormOpen(true)}
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
        open={isProjectFormOpen}
        // open={true}
        onClose={handleProjectFormClose}
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
          <VWProjectForm onClose={handleProjectFormClose} />
        </Box>
      </Modal>
    </Stack>
  );
};

export default VWHome;
