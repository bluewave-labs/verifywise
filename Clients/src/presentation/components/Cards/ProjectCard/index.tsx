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
import { useContext } from "react";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import { User } from "../../Inputs/Dropdowns";

const VWProjectCard = ({ project }: { project: Project }) => {
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { users } = dashboardValues;

  const ownerUser: User =
    users.find((user: User) => user.id === project.owner) ?? "";

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
            {`Subcontrols completed: ${
              isNaN(project.doneSubcontrols!) ? 0 : project.doneSubcontrols
            } out of ${
              isNaN(project.totalSubcontrols!) ? 0 : project.totalSubcontrols
            }`}
          </Typography>
        </Stack>
        <Stack className="project-progress" sx={{ gap: 1 }}>
          <ProgressBar
            progress={`${project.asnweredAssessments}/${project.totalAssessments}`}
          />
          <Typography sx={progressStyle}>
            {`Assesments completed: ${
              isNaN(project.asnweredAssessments!)
                ? 0
                : project.asnweredAssessments
            } out of ${
              isNaN(project.totalAssessments!) ? 0 : project.totalAssessments
            }`}
          </Typography>
        </Stack>
      </Stack>
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
