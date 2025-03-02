import { Stack, Typography } from "@mui/material";
import { descCardbodyStyle, infoCardStyle, infoCardTitleStyle } from "./style";

const DescriptionCard = ({ title, body }: { title: string; body: string }) => {
  return (
    <Stack sx={infoCardStyle}>
      <Typography sx={infoCardTitleStyle}>{title}</Typography>
      <Typography sx={descCardbodyStyle}>{body}</Typography>
    </Stack>
  );
};

export default DescriptionCard;
