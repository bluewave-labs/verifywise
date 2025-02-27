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

const VWHome = () => {
  const { setDashboardValues } = useContext(VerifyWiseContext);
  const [complianceProgress, setComplianceProgress] = useState<any>({});
  const [assessmentProgress, setAssessmentProgress] = useState<any>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [_, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingDemoData, setIsGeneratingDemoData] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

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
      await fetchData("/projects", setProjects);
      setLoading(false);
    };

    fetchProgressData();
  }, [setDashboardValues]);

  async function generateDemoData() {
    setIsGeneratingDemoData(true);
    const user = {
      id: "demo-user-id", // Replace with actual user ID
      email: "demo-user@example.com", // Replace with actual user email
      firstname: "Demo",
      lastname: "User",
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
          setAlert(null);
        }, 3000);

        // Fetch the updated data
        await fetchData("/projects", setProjects);
        await fetchData(
          "/projects/all/compliance/progress",
          setComplianceProgress
        );
        await fetchData(
          "/projects/all/assessment/progress",
          setAssessmentProgress
        );
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
          setAlert(null);
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
        setAlert(null);
      }, 3000);
    } finally {
      setIsGeneratingDemoData(false);
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
          onClick={() => setAlert(null)}
        />
      )}
      {isGeneratingDemoData && (
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
          {loading ? (
            <VWSkeleton variant="rectangular" sx={headerCardPlaceholder} />
          ) : (
            <SmallStatsCard
              attributeTitle="Compliance tracker"
              progress={`${complianceProgress.allDonesubControls ?? 0}/${
                complianceProgress.allsubControls ?? 0
              }`}
              rate={
                (complianceProgress.allDonesubControls ?? 0) /
                (complianceProgress.allsubControls ?? 1)
              }
            />
          )}
          {loading ? (
            <VWSkeleton variant="rectangular" sx={headerCardPlaceholder} />
          ) : (
            <SmallStatsCard
              attributeTitle="Assessment tracker"
              progress={`${assessmentProgress.answeredQuestions ?? 0}/${
                assessmentProgress.totalQuestions ?? 0
              }`}
              rate={
                (assessmentProgress.answeredQuestions ?? 0) /
                (assessmentProgress.totalQuestions ?? 1)
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
            {!projects && (
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
            flexDirection: projects.length < 4 ? "row" : "row",
            flexWrap: projects.length < 4 ? "nowrap" : "wrap",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {projects.length > 0 ? (
            projects.map((project) => (
              <VWProjectCard key={project.id} project={project} />
            ))
          ) : (
            <NoProject
              message='You have no projects, yet. Click on the "New Project" button to
          start one.'
            />
          )}
        </Stack>
      </Stack>
      <Modal
        open={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
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
          <VWProjectForm onClose={() => setIsProjectFormOpen(false)} />
        </Box>
      </Modal>
    </Stack>
  );
};

export default VWHome;
