import { Stack, Typography } from "@mui/material";
import { infoCardbodyStyle, infoCardStyle, infoCardTitleStyle } from "./style";

const InfoCard = ({ title, body }: { title: string; body: string }) => {
  return (
    <Stack sx={infoCardStyle}>
      <Typography sx={infoCardTitleStyle}>{title}</Typography>
      <Typography sx={infoCardbodyStyle}>{body}</Typography>
    </Stack>
  );
};

export default InfoCard;
