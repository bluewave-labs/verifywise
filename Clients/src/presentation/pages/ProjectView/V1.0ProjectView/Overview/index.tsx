import { Divider, Stack, Typography } from "@mui/material";
import { rowStyle } from "./style";
import StatsCard from "../../../../components/Cards/StatsCard";
import { projectRiskSection } from "../style";
import RisksCard from "../../../../components/Cards/RisksCard";
import InfoCard from "../../../../components/Cards/InfoCard";
import DescriptionCard from "../../../../components/Cards/DescriptionCard";
import TeamCard from "../../../../components/Cards/TeamCard";

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
        <RisksCard />
      </Stack>
    </Stack>
  );
};

export default VWProjectOverview;
