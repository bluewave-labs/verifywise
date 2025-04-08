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
import { Project } from "../../../../domain/Project";
import { formatDate } from "../../../tools/isoDateToString";
import { useContext } from "react";
import React from "react";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import { User } from "../../../../domain/User";
import useNavigateSearch from "../../../../application/hooks/useNavigateSearch";

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
    const navigate = useNavigateSearch();
    const { dashboardValues } = useContext(VerifyWiseContext);
    const { users } = dashboardValues;

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
                progress={`${project.doneSubcontrols}/${project.totalSubcontrols}`}
              />
              <Typography sx={progressStyle}>
                {`Subcontrols completed: ${
                  isNaN(project.doneSubcontrols!) ? 0 : project.doneSubcontrols
                } out of ${
                  isNaN(project.totalSubcontrols!)
                    ? 0
                    : project.totalSubcontrols
                }`}
              </Typography>
            </Stack>
            <Stack className="project-progress" sx={{ gap: 1 }}>
              <ProgressBar
                progress={`${project.answeredAssessments}/${project.totalAssessments}`}
              />
              <Typography sx={progressStyle}>
                {`Assessments completed: ${
                  isNaN(project.answeredAssessments!)
                    ? 0
                    : project.answeredAssessments
                } out of ${
                  isNaN(project.totalAssessments!)
                    ? 0
                    : project.totalAssessments
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
            <VWButton
              variant="outlined"
              onClick={() =>
                navigate("/project-view", { projectId: project.id.toString() })
              }
              size="medium"
              text="View project"
              sx={viewProjectButtonStyle}
            />
          </Tooltip>
        </Stack>
      );
    } catch (error) {
      return <ErrorFallback error={error as Error} />;
    }
  }
);

export default VWProjectCard;
