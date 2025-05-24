import { Divider, Stack, Typography } from "@mui/material";
import { columnStyle, rowStyle } from "./style";
import GroupStatsCard from "../../../../components/Cards/GroupStatsCard";
import { projectRiskSection } from "../style";
import RisksCard from "../../../../components/Cards/RisksCard";
import InfoCard from "../../../../components/Cards/InfoCard";
import DescriptionCard from "../../../../components/Cards/DescriptionCard";
import TeamCard from "../../../../components/Cards/TeamCard";
import { Project } from "../../../../../domain/types/Project";
import useProjectData from "../../../../../application/hooks/useProjectData";
import VWSkeleton from "../../../../vw-v2-components/Skeletons";
import { formatDate } from "../../../../tools/isoDateToString";
import { useContext, useEffect, useState } from "react";
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";
import { User } from "../../../../../domain/types/User";
import { getEntityById } from "../../../../../application/repository/entity.repository";
import useProjectRisks from "../../../../../application/hooks/useProjectRisks";

const VWProjectOverview = ({ project }: { project?: Project }) => {
  const projectId = project!.id;
  const projectFrameworkId = project?.framework.find((p) => p.framework_id === 1)?.project_framework_id;
  const projectFrameworkId2 = project?.framework.find((p) => p.framework_id === 2)?.project_framework_id;
  const { users } = useContext(VerifyWiseContext); 

  const { projectRisksSummary } = useProjectRisks({ projectId });

  const [complianceProgress, setComplianceProgress] = useState<{
    allDonesubControls: number;
    allsubControls: number;
  }>();
  const [assessmentProgress, setAssessmentProgress] = useState<{
    answeredQuestions: number;
    totalQuestions: number;
  }>();

  const [annexesProgress, setAnnexesProgress] = useState<{
    totalAnnexcategories: number;
    doneAnnexcategories: number;
  }>();
  const [clausesProgress, setClausesProgress] = useState<{
    totalSubclauses: number;
    doneSubclauses: number;
  }>();

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const complianceData = await getEntityById({
          routeUrl: `/eu-ai-act/compliances/progress/${projectFrameworkId}`,
        });
        setComplianceProgress(complianceData.data);

        const assessmentData = await getEntityById({
          routeUrl: `/eu-ai-act/assessments/progress/${projectFrameworkId}`,
        });
        setAssessmentProgress(assessmentData.data);

        const annexesData = await getEntityById({
          routeUrl: `/iso-42001/annexes/progress/${projectFrameworkId2}`,
        });
        setAnnexesProgress(annexesData.data);

        const clausesData = await getEntityById({
          routeUrl: `/iso-42001/clauses/progress/${projectFrameworkId2}`,
        });
        setClausesProgress(clausesData.data);
      } catch (error) {
        console.error("Error fetching progress data:", error);
      }
    };

    fetchProgressData();
  }, [projectFrameworkId, projectFrameworkId2]);

  const user: User = project
    ? users.find((user: User) => user.id === project.last_updated_by) ??
      ({} as User)
    : ({} as User);

  const { projectOwner } = useProjectData({
    projectId: String(projectId),
  });

  const projectMembers: string[] = project
    ? users
        .filter((user: { id: any }) => project.members.includes(user.id || ""))
        .map((user: User) => `${user.name} ${user.surname}`)
    : [];

  const completedEuActNumbers = [
    complianceProgress?.allDonesubControls ?? 0,
    assessmentProgress?.answeredQuestions ?? 0,
  ];

  const totalEuActNumbers = [
    complianceProgress?.allsubControls ?? 0,
    assessmentProgress?.totalQuestions ?? 0,
  ];

  const titleEuAct = [
    "Subcontrols",
    "Assessments",
  ];

  const completedIso42001Numbers = [
    annexesProgress?.doneAnnexcategories ?? 0,
    clausesProgress?.doneSubclauses ?? 0,
  ];

  const totalIso42001Numbers = [
    annexesProgress?.totalAnnexcategories ?? 0,
    clausesProgress?.totalSubclauses ?? 0,
  ];

  const titleIso42001 = [
    "Annexes",
    "Subclauses",
  ];

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
            {user.name !== undefined && user.surname !== undefined ? (
              <>
                <InfoCard
                  title="Last updated by"
                  body={`${user.name} ${user.surname}`}
                />
              </>
            ) : (
              <>
                <InfoCard title="Last updated by" body="N/A" />
              </>
            )}
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
            {projectFrameworkId && (
              <Stack sx={columnStyle}>
                <Typography sx={projectRiskSection}>
                  EU AI Act Completion Status
                </Typography>
                <GroupStatsCard
                  completed={completedEuActNumbers}
                  total={totalEuActNumbers}
                  title={titleEuAct}
                  progressbarColor="#13715B"
                />
              </Stack>
            )}
            {projectFrameworkId2 && (
              <Stack sx={columnStyle}>
                <Typography sx={projectRiskSection}>
                  ISO 42001 Completion Status
                </Typography>
                <GroupStatsCard
                  completed={completedIso42001Numbers}
                  total={totalIso42001Numbers}
                  title={titleIso42001}
                  progressbarColor="#13715B"
                />
              </Stack>
            )}
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
