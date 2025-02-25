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

const VWProjectCard = () => {
  return (
    <Stack className="project-card" sx={projectCardStyle}>
      <Stack className="project-card-header" sx={{ gap: 2 }}>
        <Typography className="project-card-title" sx={projectCardTitleStyle}>
          Marketing AI service
        </Typography>
        <Stack className="project-card-frameworks">
          <img src={euimg} alt="EU-AI-ACT" style={framewrokLogo} />
        </Stack>
      </Stack>
      <Stack className="project-card-stats" sx={{ gap: 5 }}>
        <Stack className="project-progress" sx={{ gap: 1 }}>
          <ProgressBar progress={"90/100"} />
          <Typography sx={progressStyle}>
            Controls completed: 8 out of 100
          </Typography>
        </Stack>
        <Stack className="project-progress" sx={{ gap: 1 }}>
          <ProgressBar progress={"90/100"} />
          <Typography sx={progressStyle}>
            Questions completed: 30 out of 100
          </Typography>
        </Stack>
      </Stack>
      <Stack className="project-card-spec" sx={projectCardSpecsStyle}>
        <Stack className="project-card-spec-tile">
          <Typography sx={projectCardSpecKeyStyle}>Project owner</Typography>
          <Typography sx={projectCardSpecValueyStyle}>Mohammad Kh.</Typography>
        </Stack>
        <Stack className="project-card-spec-tile">
          <Typography sx={projectCardSpecKeyStyle}>Last updated</Typography>
          <Typography sx={projectCardSpecValueyStyle}>
            10 October 2024
          </Typography>
        </Stack>
      </Stack>
      <VWButton
        variant="outlined"
        onClick={() => {}}
        size="medium"
        text="View project"
        sx={{
          border: "1px solid #13715B",
          color: "#13715B",
          "&:hover": {
            backgroundColor: "transparent",
          },
        }}
      />
    </Stack>
  );
};

export default VWProjectCard;
