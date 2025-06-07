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
import CustomizableSkeleton from "../../../../vw-v2-components/Skeletons";
import { formatDate } from "../../../../tools/isoDateToString";
import { useContext, useEffect, useState } from "react";
import { VerifyWiseContext } from "../../../../../application/contexts/VerifyWise.context";
import { User } from "../../../../../domain/types/User";
import { getEntityById } from "../../../../../application/repository/entity.repository";
import useProjectRisks from "../../../../../application/hooks/useProjectRisks";

const VWProjectOverview = ({ project }: { project?: Project }) => {
  const [projectFrameworkId, setProjectFrameworkId] = useState<number | null>(
    null
  );
  const [projectFrameworkId2, setProjectFrameworkId2] = useState<number | null>(
    null
  );
  const { users } = useContext(VerifyWiseContext);

  // Update framework IDs when project changes
  useEffect(() => {
    if (project?.framework) {
      // Only set framework ID 1 if the project has EU AI Act framework
      const framework1 = project.framework.find((p) => p.framework_id === 1);
      if (
        framework1?.project_framework_id &&
        !isNaN(Number(framework1.project_framework_id))
      ) {
        setProjectFrameworkId(Number(framework1.project_framework_id));
      } else {
        setProjectFrameworkId(null);
      }

      // Only set framework ID 2 if the project has ISO 42001 framework
      const framework2 = project.framework.find((p) => p.framework_id === 2);
      if (
        framework2?.project_framework_id &&
        !isNaN(Number(framework2.project_framework_id))
      ) {
        setProjectFrameworkId2(Number(framework2.project_framework_id));
      } else {
        setProjectFrameworkId2(null);
      }
    } else {
      setProjectFrameworkId(null);
      setProjectFrameworkId2(null);
    }
  }, [project]);

  const projectId = project?.id;
  const { projectRisksSummary } = useProjectRisks({
    projectId: projectId ?? 0,
  });

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
      if (!project) return; // Don't fetch if no project

      try {
        // Only fetch EU AI Act data if the project has framework ID 1
        const hasEuAiActFramework = project.framework.some(
          (f) => f.framework_id === 1
        );
        if (
          hasEuAiActFramework &&
          projectFrameworkId &&
          !isNaN(projectFrameworkId)
        ) {
          try {
            const complianceData = await getEntityById({
              routeUrl: `/eu-ai-act/compliances/progress/${projectFrameworkId}`,
            });
            if (complianceData?.data) {
              setComplianceProgress(complianceData.data);
            }

            const assessmentData = await getEntityById({
              routeUrl: `/eu-ai-act/assessments/progress/${projectFrameworkId}`,
            });
            if (assessmentData?.data) {
              setAssessmentProgress(assessmentData.data);
            }
          } catch (error) {
            console.error("Error fetching EU AI Act data:", error);
            setComplianceProgress(undefined);
            setAssessmentProgress(undefined);
          }
        } else {
          // Reset EU AI Act progress data if the project doesn't have framework ID 1
          setComplianceProgress(undefined);
          setAssessmentProgress(undefined);
        }

        // Only fetch ISO 42001 data if the project has framework ID 2
        const hasIso42001Framework = project.framework.some(
          (f) => f.framework_id === 2
        );
        if (
          hasIso42001Framework &&
          projectFrameworkId2 &&
          !isNaN(projectFrameworkId2)
        ) {
          try {
            const annexesData = await getEntityById({
              routeUrl: `/iso-42001/annexes/progress/${projectFrameworkId2}`,
            });
            if (annexesData?.data) {
              setAnnexesProgress(annexesData.data);
            }

            const clausesData = await getEntityById({
              routeUrl: `/iso-42001/clauses/progress/${projectFrameworkId2}`,
            });
            if (clausesData?.data) {
              setClausesProgress(clausesData.data);
            }
          } catch (error) {
            console.error("Error fetching ISO 42001 data:", error);
            setAnnexesProgress(undefined);
            setClausesProgress(undefined);
          }
        } else {
          // Reset ISO 42001 progress data if the project doesn't have framework ID 2
          setAnnexesProgress(undefined);
          setClausesProgress(undefined);
        }
      } catch (error) {
        console.error("Error in fetchProgressData:", error);
      }
    };

    fetchProgressData();
  }, [project, projectFrameworkId, projectFrameworkId2]);

  if (!project) {
    return <div>No project selected</div>;
  }

  const user: User =
    users.find((user: User) => user.id === project.last_updated_by) ??
    ({} as User);

  const { projectOwner } = useProjectData({
    projectId: String(projectId),
  });

  const projectMembers: string[] = users
    .filter((user: { id: any }) => project.members.includes(user.id || ""))
    .map((user: User) => `${user.name} ${user.surname}`);

  const completedEuActNumbers = [
    complianceProgress?.allDonesubControls ?? 0,
    assessmentProgress?.answeredQuestions ?? 0,
  ];

  const totalEuActNumbers = [
    complianceProgress?.allsubControls ?? 0,
    assessmentProgress?.totalQuestions ?? 0,
  ];

  const titleEuAct = ["Subcontrols", "Assessments"];

  const completedIso42001Numbers = [
    clausesProgress?.doneSubclauses ?? 0,
    annexesProgress?.doneAnnexcategories ?? 0,
  ];

  const totalIso42001Numbers = [
    clausesProgress?.totalSubclauses ?? 0,
    annexesProgress?.totalAnnexcategories ?? 0,
  ];

  const titleIso42001 = ["Clauses", "Annexes"];

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
            <CustomizableSkeleton variant="text" width="30%" height={32} />
            <CustomizableSkeleton variant="text" width="30%" height={32} />
            <CustomizableSkeleton variant="text" width="30%" height={32} />
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
            <CustomizableSkeleton
              variant="rectangular"
              width="60%"
              height={100}
            />
            <CustomizableSkeleton
              variant="rectangular"
              width="60%"
              height={100}
            />
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
            <CustomizableSkeleton
              variant="rectangular"
              width="45%"
              height={100}
            />
            <CustomizableSkeleton
              variant="rectangular"
              width="45%"
              height={100}
            />
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
            <CustomizableSkeleton variant="text" width="20%" height={32} />
            <CustomizableSkeleton
              variant="rectangular"
              width="100%"
              height={200}
            />
          </>
        )}
      </Stack>
    </Stack>
  );
};

export default VWProjectOverview;
