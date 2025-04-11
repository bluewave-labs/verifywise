import { Divider, Stack, Typography } from "@mui/material";
import { rowStyle } from "./style";
import StatsCard from "../../../../components/Cards/StatsCard";
import { projectRiskSection } from "../style";
import RisksCard from "../../../../components/Cards/RisksCard";
import InfoCard from "../../../../components/Cards/InfoCard";
import DescriptionCard from "../../../../components/Cards/DescriptionCard";
import TeamCard from "../../../../components/Cards/TeamCard";
import { Project } from "../../../../../domain/Project";
import useProjectData from "../../../../../application/hooks/useProjectData";
import { useSearchParams } from "react-router-dom";
import VWSkeleton from "../../../../vw-v2-components/Skeletons";
import { formatDate } from "../../../../tools/isoDateToString";
import { useContext, useEffect, useState } from "react";
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";
import { User } from "../../../../../domain/User";
import { getEntityById } from "../../../../../application/repository/entity.repository";
import useProjectRisks from "../../../../../application/hooks/useProjectRisks";

const VWProjectOverview = ({ project }: { project?: Project}) => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "0";
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { users } = dashboardValues;

  const { projectRisksSummary } = useProjectRisks({ projectId });

  const [complianceProgress, setComplianceProgress] = useState<{
    allDonesubControls: number;
    allsubControls: number;
  }>();
  const [assessmentProgress, setAssessmentProgress] = useState<{
    answeredQuestions: number;
    totalQuestions: number;
  }>();

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const complianceData = await getEntityById({
          routeUrl: `/projects/compliance/progress/${projectId}`,
        });
        setComplianceProgress(complianceData.data);

        const assessmentData = await getEntityById({
          routeUrl: `/projects/assessment/progress/${projectId}`,
        });
        setAssessmentProgress(assessmentData.data);
      } catch (error) {
        console.error("Error fetching progress data:", error);
      }
    };

    fetchProgressData();
  }, [projectId]);

  console.log("complianceProgress: ", complianceProgress);
  console.log("assessmentProgress: ", assessmentProgress);

  const user: User = project
    ? users.find((user: User) => user.id === project.last_updated_by) ??
      ({} as User)
    : ({} as User);

  const { projectOwner } = useProjectData({
    projectId: project?.id.toString() || projectId,
  });

  const projectMembers: string[] = project
    ? users
        .filter((user: { id: any; }) => project.members.includes(user.id || ''))
        .map((user: User) => `${user.name} ${user.surname}`)
    : [];

  return (
    <Stack className="vw-project-overview">
      <Stack className="vw-project-overview-row" sx={rowStyle}>
        {project ? (
          <>
            <InfoCard title="Owner" body={projectOwner || "N/A"} />
            <InfoCard
              title="Last updated"
              body={formatDate(project.last_updated.toString())}
            />
            {user.name !== undefined && user.surname !== undefined ? <>
              <InfoCard
                title="Last updated by"
                body={`${user.name} ${user.surname}`}
              />
            </> : <>
              <InfoCard
                title="Last updated by"
                body="N/A"
              />
            </>}
          </>
        ) : (
          <>
            <VWSkeleton variant="text" width="30%" height={32} />
            <VWSkeleton variant="text" width="30%" height={32} />
            <VWSkeleton variant="text" width="30%" height={32} />
          </>
        )}
      </Stack>
      <Stack className="vw-project-overview-row" sx={rowStyle}>
        {project ? (
          <>
            <DescriptionCard title="Goal" body={project.goal} />
            <TeamCard title="Team members" members={projectMembers} />
          </>
        ) : (
          <>
            <VWSkeleton variant="rectangular" width="60%" height={100} />
            <VWSkeleton variant="rectangular" width="60%" height={100} />
          </>
        )}
      </Stack>
      <Stack className="vw-project-overview-row" sx={rowStyle}>
        {project ? (
          <>
            <StatsCard
              completed={complianceProgress?.allDonesubControls ?? 0}
              total={complianceProgress?.allsubControls ?? 0}
              title="Subcontrols"
              progressbarColor="#13715B"
            />
            <StatsCard
              completed={assessmentProgress?.answeredQuestions ?? 0}
              total={assessmentProgress?.totalQuestions ?? 0}
              title="Assessments"
              progressbarColor="#13715B"
            />
          </>
        ) : (
          <>
            <VWSkeleton variant="rectangular" width="45%" height={100} />
            <VWSkeleton variant="rectangular" width="45%" height={100} />
          </>
        )}
      </Stack>
      <Divider />
      <Stack sx={{ gap: 10 }}>
        {project ? (
          <>
            <Typography sx={projectRiskSection}>Project risks</Typography>
            <RisksCard risksSummary={projectRisksSummary} />
          </>
        ) : (
          <>
            <VWSkeleton variant="text" width="20%" height={32} />
            <VWSkeleton variant="rectangular" width="100%" height={200} />
          </>
        )}
      </Stack>
    </Stack>
  );
};

export default VWProjectOverview;
