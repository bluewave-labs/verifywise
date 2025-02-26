import { useContext, useEffect, useState } from "react";
import { Stack, Typography } from "@mui/material";
import { headerCardPlaceholder, vwhomeHeading } from "./style";
import SmallStatsCard from "../../../components/Cards/SmallStatsCard";
import VWButton from "../../../vw-v2-components/Buttons";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import VWProjectCard from "../../../components/Cards/ProjectCard";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import { getAllEntities } from "../../../../application/repository/entity.repository";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";

const VWHome = () => {
  const { setDashboardValues } = useContext(VerifyWiseContext);
  const [complianceProgress, setComplianceProgress] = useState<any>({});
  const [assessmentProgress, setAssessmentProgress] = useState<any>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const usersData = await getAllEntities({
          routeUrl: "/users",
        });
        setUsers(usersData.data);
        setDashboardValues({ users: usersData.data });

        const complianceData = await getAllEntities({
          routeUrl: "/projects/all/compliance/progress",
        });
        setComplianceProgress(complianceData.data);

        const assessmentData = await getAllEntities({
          routeUrl: "/projects/all/assessment/progress",
        });
        setAssessmentProgress(assessmentData.data);

        const projectsData = await getAllEntities({
          routeUrl: "/projects",
        });
        setProjects(projectsData.data);
      } catch (error) {
        console.error("Error fetching progress data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  console.log("users : ", users);
  console.log("complianceProgress : ", complianceProgress);
  console.log("assessmentProgress : ", assessmentProgress);
  console.log("projects : ", projects);

  return (
    <Stack className="vwhome">
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
              progress={`${assessmentProgress.allDonesubControls ?? 0}/${
                assessmentProgress.allsubControls ?? 0
              }`}
              rate={
                (assessmentProgress.allDonesubControls ?? 0) /
                (assessmentProgress.allsubControls ?? 1)
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
                text="Get demo data"
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                }}
                icon={<CloudDownloadIcon />}
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
            gap: "10px",
          }}
        >
          {Array.isArray(projects) &&
            projects.map((project) => (
              <VWProjectCard key={project.id} project={project} />
            ))}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default VWHome;
