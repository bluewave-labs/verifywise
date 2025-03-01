import { Divider, Stack, Typography } from "@mui/material";
import {
  descCardbodyStyle,
  infoCardbodyStyle,
  infoCardStyle,
  infoCardTitleStyle,
  projectRisksCard,
  projectRisksTileCard,
  projectRisksTileCardKey,
  projectRisksTileCardvalue,
  rowStyle,
} from "./style";
import StatsCard from "../../../../components/Cards/StatsCard";
import { projectRiskSection } from "../style";

const InfoCard = ({ title, body }: { title: string; body: string }) => {
  return (
    <Stack sx={infoCardStyle}>
      <Typography sx={infoCardTitleStyle}>{title}</Typography>
      <Typography sx={infoCardbodyStyle}>{body}</Typography>
    </Stack>
  );
};

const DescriptionCard = ({ title, body }: { title: string; body: string }) => {
  return (
    <Stack sx={infoCardStyle}>
      <Typography sx={infoCardTitleStyle}>{title}</Typography>
      <Typography sx={descCardbodyStyle}>{body}</Typography>
    </Stack>
  );
};

const TeamCard = ({
  title,
  members = ["Mohammad Khalilzadeh", "Gorkem Cetin", "Eiei mon"],
}: {
  title: string;
  members?: any[];
}) => {
  return (
    <Stack sx={infoCardStyle}>
      <Typography sx={infoCardTitleStyle}>{title}</Typography>
      <ul>
        {members.map((member, index) => (
          <li
            key={index}
            style={{
              fontSize: 11,
              color: "#2D3748",
            }}
          >
            {member}
          </li>
        ))}
      </ul>
    </Stack>
  );
};

const ProjectRisks = () => {
  return (
    <Stack className="vw-project-risks" sx={projectRisksCard}>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#C63622" }}
      >
        <Typography sx={projectRisksTileCardKey}>Very High</Typography>
        <Typography sx={projectRisksTileCardvalue}>0</Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#D68B61" }}
      >
        <Typography sx={projectRisksTileCardKey}>High</Typography>
        <Typography sx={projectRisksTileCardvalue}>0</Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#D6B971" }}
      >
        <Typography sx={projectRisksTileCardKey}>Medium</Typography>
        <Typography sx={projectRisksTileCardvalue}>0</Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#B8D39C" }}
      >
        <Typography sx={projectRisksTileCardKey}>Low</Typography>
        <Typography sx={projectRisksTileCardvalue}>0</Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#52AB43" }}
      >
        <Typography sx={projectRisksTileCardKey}>Very Low</Typography>
        <Typography sx={projectRisksTileCardvalue}>0</Typography>
      </Stack>
    </Stack>
  );
};

const VWProjectOverview = () => {
  return (
    <Stack className="vw-project-overview">
      <Stack className="vw-project-overview-row" sx={rowStyle}>
        <InfoCard title="Owner" body="Mohammad Khalilzadeh" />
        <InfoCard title="Last updated" body="23 February 2025" />
        <InfoCard title="Last updated by" body="Mohammad Khalilzadeh" />
      </Stack>
      <Stack className="vw-project-overview-row" sx={rowStyle}>
        <DescriptionCard
          title="Goal"
          body="Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in"
        />
        <TeamCard title="Team members" />
      </Stack>
      <Stack className="vw-project-overview-row" sx={rowStyle}>
        <StatsCard
          completed={30}
          total={100}
          title="Subcontrols"
          progressbarColor="#13715B"
        />
        <StatsCard
          completed={70}
          total={100}
          title="assessments"
          progressbarColor="#13715B"
        />
      </Stack>
      <Divider />
      <Stack sx={{ gap: 10 }}>
        <Typography sx={projectRiskSection}>Project risks</Typography>
        <ProjectRisks />
      </Stack>
    </Stack>
  );
};

export default VWProjectOverview;
