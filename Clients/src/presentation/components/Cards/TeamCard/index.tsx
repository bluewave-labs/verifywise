import { Stack, Typography } from "@mui/material";
import { descCardbodyStyle, infoCardStyle, infoCardTitleStyle } from "./style";

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
      {members.length !== 0 ? 
        <Typography sx={descCardbodyStyle}>{members.join(", ")}</Typography>
      : 
        <Typography sx={descCardbodyStyle}>No member has been asigned to the project</Typography>
      }
    </Stack>
  );
};

export default TeamCard;
