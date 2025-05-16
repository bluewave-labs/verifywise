import { Stack, Typography, Tooltip } from "@mui/material";
import euimg from "../../../assets/imgs/eu-ai-act.jpg";
import ProgressBar from "../../ProjectCard/ProgressBar";
import VWButton from "../../../vw-v2-components/Buttons";
import {
  frameworkLogo,
  progressStyle,
  projectCardSpecKeyStyle,
  projectCardSpecsStyle,
  projectCardSpecValueyStyle,
  projectCardStyle,
  projectCardTitleStyle,
  viewProjectButtonStyle,
} from "./style";
import { Project } from "../../../../domain/types/Project";
import { formatDate } from "../../../tools/isoDateToString";
import { useContext, useEffect, useState } from "react";
import React from "react";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import { User } from "../../../../domain/types/User";
import useNavigateSearch from "../../../../application/hooks/useNavigateSearch";
import { AssessmentProgress, ComplianceProgress } from "../../../../application/interfaces/iprogress";
import { fetchData } from "../../../../application/hooks/fetchDataHook";

// Error fallback component
const ErrorFallback = ({ error }: { error: Error }) => (
  <Stack sx={{ p: 2, color: "error.main" }}>
    <Typography variant="h6">Something went wrong</Typography>
    <Typography variant="body2">{error.message}</Typography>
  </Stack>
);

// Loading skeleton component
const ProjectCardSkeleton = () => (
  <Stack className="project-card" sx={projectCardStyle}>
    <Stack className="project-card-header" sx={{ gap: 2 }}>
      <Typography className="project-card-title" sx={projectCardTitleStyle}>
        Loading...
      </Typography>
    </Stack>
    <Stack className="project-card-stats" sx={{ gap: 5 }}>
      <Stack className="project-progress" sx={{ gap: 1 }}>
        <ProgressBar progress="0/0" />
        <Typography sx={progressStyle}>Loading...</Typography>
      </Stack>
      <Stack className="project-progress" sx={{ gap: 1 }}>
        <ProgressBar progress="0/0" />
        <Typography sx={progressStyle}>Loading...</Typography>
      </Stack>
    </Stack>
  </Stack>
);

/**
 * ProjectCard component displays project information in a card format
 * @param {Project} project - The project data to display
 * @param {boolean} isLoading - Whether the component is in a loading state
 * @returns {JSX.Element} A card component displaying project information
 */
const VWProjectCard = React.memo(
  ({
    project,
    isLoading = false,
  }: {
    project: Project;
    isLoading?: boolean;
  }) => {
    const projectFrameworkId = project.framework.filter(
      (p) => p.framework_id === 1
    )[0]?.project_framework_id;
    const navigate = useNavigateSearch();
    const { dashboardValues } = useContext(VerifyWiseContext);
    const { users } = dashboardValues;
    const [complianceProgressData, setComplianceProgressData] = useState<ComplianceProgress>();
    const [assessmentProgressData, setAssessmentProgressData] = useState<AssessmentProgress>();

    useEffect(() => {
      const fetchProgressData = async () => {
        await fetchData(
          `/eu-ai-act/compliances/progress/${projectFrameworkId}`,
          setComplianceProgressData
        );
        await fetchData(
          `/eu-ai-act/assessments/progress/${projectFrameworkId}`,
          setAssessmentProgressData
        );
      };
      fetchProgressData();
    }, [])

    // Improved error handling for owner user
    const ownerUser: User | null =
      users.find((user: User) => user.id === project.owner) || null;

    try {
      if (isLoading) {
        return <ProjectCardSkeleton />;
      }

      return (
        <Stack
          className="project-card"
          sx={projectCardStyle}
          role="article"
          aria-label={`Project card for ${project.project_title}`}
        >
          <Stack className="project-card-header" sx={{ gap: 2 }}>
            <Typography
              className="project-card-title"
              sx={projectCardTitleStyle}
            >
              {project.project_title}
            </Typography>
            <Stack className="project-card-frameworks">
              <img src={euimg} alt="EU-AI-ACT" style={frameworkLogo} />
            </Stack>
          </Stack>
          <Stack className="project-card-stats" sx={{ gap: 5 }}>
            <Stack className="project-progress" sx={{ gap: 1 }}>
              <ProgressBar
                progress={`${complianceProgressData?.allDonesubControls}/${complianceProgressData?.allsubControls}`}
              />
              <Typography sx={progressStyle}>
                {`Subcontrols completed: ${
                  isNaN(complianceProgressData?.allDonesubControls!) ? 0 : complianceProgressData?.allDonesubControls
                } out of ${
                  isNaN(complianceProgressData?.allsubControls!)
                    ? 0
                    : complianceProgressData?.allsubControls
                }`}
              </Typography>
            </Stack>
            <Stack className="project-progress" sx={{ gap: 1 }}>
              <ProgressBar
                progress={`${assessmentProgressData?.answeredQuestions}/${assessmentProgressData?.totalQuestions}`}
              />
              <Typography sx={progressStyle}>
                {`Assessments completed: ${
                  isNaN(assessmentProgressData?.answeredQuestions!)
                    ? 0
                    : assessmentProgressData?.answeredQuestions
                } out of ${
                  isNaN(assessmentProgressData?.totalQuestions!)
                    ? 0
                    : assessmentProgressData?.totalQuestions
                }`}
              </Typography>
            </Stack>
          </Stack>
          <Stack className="project-card-spec" sx={projectCardSpecsStyle}>
            <Stack className="project-card-spec-tile">
              <Typography sx={projectCardSpecKeyStyle}>
                Project owner
              </Typography>
              <Typography sx={projectCardSpecValueyStyle}>
                {ownerUser
                  ? `${ownerUser.name} ${ownerUser.surname}`
                  : "Unknown User"}
              </Typography>
            </Stack>
            <Stack className="project-card-spec-tile">
              <Typography sx={projectCardSpecKeyStyle}>Last updated</Typography>
              <Typography sx={projectCardSpecValueyStyle}>
                {formatDate(project.last_updated.toString())}
              </Typography>
            </Stack>
          </Stack>
          <Tooltip title="View project details">
            <>
              <VWButton
                variant="outlined"
                onClick={() =>
                  navigate("/project-view", {
                    projectId: project.id.toString(),
                  })
                }
                size="medium"
                text="View project"
                sx={viewProjectButtonStyle}
              />
            </>
          </Tooltip>
        </Stack>
      );
    } catch (error) {
      return <ErrorFallback error={error as Error} />;
    }
  }
);

export default VWProjectCard;
