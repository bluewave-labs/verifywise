import { Stack, Typography } from "@mui/material";
import euimg from "../../../assets/imgs/eu-ai-act.jpg";
import ProgressBar from "../../ProjectCard/ProgressBar";
import VWButton from "../../../vw-v2-components/Buttons";
import {
  framewrokLogo,
  progressStyle,
  projectCardSpecKeyStyle,
  projectCardSpecsStyle,
  projectCardSpecValueyStyle,
  projectCardStyle,
  projectCardTitleStyle,
} from "./style";
import { Project } from "../../../../domain/Project";
import { formatDate } from "../../../tools/isoDateToString";

const VWProjectCard = ({ project }: { project: Project }) => {
  return (
    <Stack className="project-card" sx={projectCardStyle}>
      <Stack className="project-card-header" sx={{ gap: 2 }}>
        <Typography className="project-card-title" sx={projectCardTitleStyle}>
          {project.project_title}
        </Typography>
        <Stack className="project-card-frameworks">
          <img src={euimg} alt="EU-AI-ACT" style={framewrokLogo} />
        </Stack>
      </Stack>
      <Stack className="project-card-stats" sx={{ gap: 5 }}>
        <Stack className="project-progress" sx={{ gap: 1 }}>
          <ProgressBar
            progress={`${project.doneSubcontrols}/${project.totalSubcontrols}`}
          />
          <Typography sx={progressStyle}>
            {`Compliances completed: ${project.doneSubcontrols} out of ${project.totalSubcontrols}`}
          </Typography>
        </Stack>
        <Stack className="project-progress" sx={{ gap: 1 }}>
          <ProgressBar
            progress={`${project.asnweredAssessments}/${project.totalAssessments}`}
          />
          <Typography sx={progressStyle}>
            {`Questions completed: ${project.asnweredAssessments} out of ${project.totalAssessments}`}
          </Typography>
        </Stack>
      </Stack>
      <Stack className="project-card-spec" sx={projectCardSpecsStyle}>
        <Stack className="project-card-spec-tile">
          <Typography sx={projectCardSpecKeyStyle}>Project owner</Typography>
          <Typography sx={projectCardSpecValueyStyle}>
            {project.owner}
          </Typography>
        </Stack>
        <Stack className="project-card-spec-tile">
          <Typography sx={projectCardSpecKeyStyle}>Last updated</Typography>
          <Typography sx={projectCardSpecValueyStyle}>
            {formatDate(project.last_updated.toString())}
          </Typography>
        </Stack>
      </Stack>
      <VWButton
        variant="outlined"
        onClick={() => {}}
        size="medium"
        text="View project"
        sx={{
          border: "1px solid #D0D5DD",
          color: "#344054",
          "&:hover": {
            backgroundColor: "transparent",
          },
        }}
      />
    </Stack>
  );
};

export default VWProjectCard;
