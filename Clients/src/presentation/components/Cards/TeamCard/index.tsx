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
      <Typography sx={descCardbodyStyle}>{members.join(", ")}</Typography>
    </Stack>
  );
};

export default TeamCard;
