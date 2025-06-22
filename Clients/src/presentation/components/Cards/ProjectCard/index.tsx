import { Stack, Typography, Tooltip, Button } from "@mui/material";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import ProgressBar from "../../ProjectCard/ProgressBar";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import {
  progressStyle,
  projectCardSpecKeyStyle,
  projectCardSpecsStyle,
  projectCardSpecValueyStyle,
  projectCardStyle,
  projectCardTitleStyle,
  viewProjectButtonStyle,
  euAiActChipStyle,
  iso42001ChipStyle,
} from "./style";
import { Project } from "../../../../domain/types/Project";
import { formatDate } from "../../../tools/isoDateToString";
import { useContext, useEffect, useState, useMemo, FC } from "react";
import React from "react";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import { User } from "../../../../domain/types/User";
import useNavigateSearch from "../../../../application/hooks/useNavigateSearch";
import {
  AssessmentProgress,
  ComplianceProgress,
} from "../../../../application/interfaces/iprogress";
import { fetchData } from "../../../../application/hooks/fetchDataHook";

// Loading skeleton component
const ProjectCardSkeleton: FC = () => (
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

interface AnnexesProgress {
  totalAnnexcategories: number;
  doneAnnexcategories: number;
}

interface ClausesProgress {
  totalSubclauses: number;
  doneSubclauses: number;
}

interface ProjectCardProps {
  project: Project;
  isLoading?: boolean;
}

// Helper to fetch progress data
const useProjectProgress = (
  projectFrameworkId?: number,
  projectFrameworkId2?: number
) => {
  const [complianceProgressData, setComplianceProgressData] =
    useState<ComplianceProgress>();
  const [assessmentProgressData, setAssessmentProgressData] =
    useState<AssessmentProgress>();
  const [annexesProgressData, setAnnexesProgressData] =
    useState<AnnexesProgress>();
  const [clausesProgressData, setClausesProgressData] =
    useState<ClausesProgress>();

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        if (projectFrameworkId) {
          await fetchData(
            `/eu-ai-act/compliances/progress/${projectFrameworkId}`,
            setComplianceProgressData
          );
          await fetchData(
            `/eu-ai-act/assessments/progress/${projectFrameworkId}`,
            setAssessmentProgressData
          );
        }
        if (projectFrameworkId2) {
          await fetchData(
            `/iso-42001/clauses/progress/${projectFrameworkId2}`,
            setClausesProgressData
          );
          await fetchData(
            `/iso-42001/annexes/progress/${projectFrameworkId2}`,
            setAnnexesProgressData
          );
        }
      } catch (error) {
        // Optionally handle error globally
      }
    };
    fetchProgressData();
  }, [projectFrameworkId, projectFrameworkId2]);

  return {
    complianceProgressData,
    assessmentProgressData,
    annexesProgressData,
    clausesProgressData,
  };
};

// Reusable FrameworkButton component
const FrameworkButton = ({
  label,
  type,
  onClick,
}: {
  label: string;
  type: "eu" | "iso";
  onClick: () => void;
}) => {
  const tooltipText = type === "eu" 
    ? "EU AI Act: View and complete requirements for EU's AI Act. Answer compliance questions and track your progress."
    : "ISO 42001: Work through ISO/IEC 42001 requirements. Fill out clauses, annexes, and assessments to build your AI management system";

  return (
    <Tooltip title={tooltipText} arrow placement="top">
      <Button
        variant="contained"
        onClick={onClick}
        sx={{
          ...(type === "eu" ? euAiActChipStyle : iso42001ChipStyle),
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.9,
          },
        }}
        size="small"
        endIcon={<NorthEastIcon />}
      >
        {label}
      </Button>
    </Tooltip>
  );
};

/**
 * ProjectCard component displays project information in a card format
 */
const ProjectCard: FC<ProjectCardProps> = React.memo(
  ({ project, isLoading = false }) => {
    const navigate = useNavigateSearch();
    const { users } = useContext(VerifyWiseContext);

    // Memoize framework IDs
    const projectFrameworkId = useMemo(
      () =>
        project.framework.find((p) => p.framework_id === 1)
          ?.project_framework_id,
      [project.framework]
    );
    const projectFrameworkId2 = useMemo(
      () =>
        project.framework.find((p) => p.framework_id === 2)
          ?.project_framework_id,
      [project.framework]
    );

    // Fetch progress data
    const {
      complianceProgressData,
      assessmentProgressData,
      annexesProgressData,
      clausesProgressData,
    } = useProjectProgress(projectFrameworkId, projectFrameworkId2);

    // Find project owner
    const ownerUser: User | null = useMemo(
      () => users?.find((user: User) => user.id === project.owner) ?? null,
      [users, project.owner]
    );

    // Navigation handlers for framework buttons
    const handleFrameworkClick = (frameworkId: number) => {
      navigate("/project-view", {
        projectId: project.id.toString(),
        tab: "frameworks",
        framework: frameworkId.toString(),
      });
    };

    if (isLoading) {
      return <ProjectCardSkeleton />;
    }

    return (
      <Stack
        className="project-card"
        sx={{ ...projectCardStyle, display: "flex", flexDirection: "column" }}
        role="article"
        aria-label={`Project card for ${project.project_title}`}
      >
        {/* Header */}
        <Stack className="project-card-header" sx={{ gap: 2 }}>
          <Typography className="project-card-title" sx={projectCardTitleStyle}>
            {project.project_title}
          </Typography>
          <Stack
            direction="row"
            spacing={5}
            className="project-card-frameworks"
          >
            {projectFrameworkId && (
              <FrameworkButton 
                label="EU AI Act" 
                type="eu" 
                onClick={() => handleFrameworkClick(1)}
              />
            )}
            {projectFrameworkId2 && (
              <FrameworkButton 
                label="ISO 42001" 
                type="iso" 
                onClick={() => handleFrameworkClick(2)}
              />
            )}
          </Stack>
        </Stack>
        {projectFrameworkId && projectFrameworkId2 ? (
          <Stack
            direction="row"
            spacing={10}
            className="project-card-stats"
            sx={{}}
          >
            <Stack sx={{ flex: 1, gap: 1 }}>
              <Stack className="project-progress" sx={{ gap: 1 }}>
                <ProgressBar
                  progress={`${
                    complianceProgressData?.allDonesubControls ?? 0
                  }/${complianceProgressData?.allsubControls ?? 0}`}
                />
                <Typography sx={progressStyle}>
                  {`Subcontrols: ${
                    complianceProgressData?.allDonesubControls ?? 0
                  } out of ${complianceProgressData?.allsubControls ?? 0}`}
                </Typography>
              </Stack>
              <Stack className="project-progress" sx={{ gap: 1 }}>
                <ProgressBar
                  progress={`${
                    assessmentProgressData?.answeredQuestions ?? 0
                  }/${assessmentProgressData?.totalQuestions ?? 0}`}
                />
                <Typography sx={progressStyle}>
                  {`Assessments: ${
                    assessmentProgressData?.answeredQuestions ?? 0
                  } out of ${assessmentProgressData?.totalQuestions ?? 0}`}
                </Typography>
              </Stack>
            </Stack>
            <Stack sx={{ flex: 1, gap: 1 }}>
              <Stack className="project-progress" sx={{ gap: 1 }}>
                <ProgressBar
                  progress={`${clausesProgressData?.doneSubclauses ?? 0}/${
                    clausesProgressData?.totalSubclauses ?? 0
                  }`}
                />
                <Typography sx={progressStyle}>
                  {`Clauses: ${
                    clausesProgressData?.doneSubclauses ?? 0
                  } out of ${clausesProgressData?.totalSubclauses ?? 0}`}
                </Typography>
              </Stack>
              <Stack className="project-progress" sx={{ gap: 1 }}>
                <ProgressBar
                  progress={`${annexesProgressData?.doneAnnexcategories ?? 0}/${
                    annexesProgressData?.totalAnnexcategories ?? 0
                  }`}
                />
                <Typography sx={progressStyle}>
                  {`Annexes: ${
                    annexesProgressData?.doneAnnexcategories ?? 0
                  } out of ${annexesProgressData?.totalAnnexcategories ?? 0}`}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack className="project-card-stats" sx={{ gap: 2 }}>
            {projectFrameworkId && (
              <>
                <Stack className="project-progress" sx={{ gap: 1 }}>
                  <ProgressBar
                    progress={`${
                      complianceProgressData?.allDonesubControls ?? 0
                    }/${complianceProgressData?.allsubControls ?? 0}`}
                  />
                  <Typography sx={progressStyle}>
                    {`Subcontrols: ${
                      complianceProgressData?.allDonesubControls ?? 0
                    } out of ${complianceProgressData?.allsubControls ?? 0}`}
                  </Typography>
                </Stack>
                <Stack className="project-progress" sx={{ gap: 1 }}>
                  <ProgressBar
                    progress={`${
                      assessmentProgressData?.answeredQuestions ?? 0
                    }/${assessmentProgressData?.totalQuestions ?? 0}`}
                  />
                  <Typography sx={progressStyle}>
                    {`Assessments: ${
                      assessmentProgressData?.answeredQuestions ?? 0
                    } out of ${assessmentProgressData?.totalQuestions ?? 0}`}
                  </Typography>
                </Stack>
              </>
            )}
            {projectFrameworkId2 && (
              <>
                <Stack className="project-progress" sx={{ gap: 1 }}>
                  <ProgressBar
                    progress={`${clausesProgressData?.doneSubclauses ?? 0}/${
                      clausesProgressData?.totalSubclauses ?? 0
                    }`}
                  />
                  <Typography sx={progressStyle}>
                    {`Clauses: ${
                      clausesProgressData?.doneSubclauses ?? 0
                    } out of ${clausesProgressData?.totalSubclauses ?? 0}`}
                  </Typography>
                </Stack>
                <Stack className="project-progress" sx={{ gap: 1 }}>
                  <ProgressBar
                    progress={`${
                      annexesProgressData?.doneAnnexcategories ?? 0
                    }/${annexesProgressData?.totalAnnexcategories ?? 0}`}
                  />
                  <Typography sx={progressStyle}>
                    {`Annexes: ${
                      annexesProgressData?.doneAnnexcategories ?? 0
                    } out of ${annexesProgressData?.totalAnnexcategories ?? 0}`}
                  </Typography>
                </Stack>
              </>
            )}
          </Stack>
        )}
        {/* Project Specs */}
        <Stack className="project-card-spec" sx={projectCardSpecsStyle}>
          <Stack className="project-card-spec-tile">
            <Typography sx={projectCardSpecKeyStyle}>Project owner</Typography>
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
        {/* View Project Button */}
        <Stack sx={{ mt: "auto" }}>
          <Tooltip title="View project details" sx={{ fontSize: 13 }}>
            <CustomizableButton
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
          </Tooltip>
        </Stack>
      </Stack>
    );
  }
);

export default ProjectCard;
