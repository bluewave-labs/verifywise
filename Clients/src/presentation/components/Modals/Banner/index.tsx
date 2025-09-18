import { Box, Paper, Typography } from "@mui/material";
import { ReactComponent as CloseGreyIcon } from "../../../assets/icons/close-grey.svg";
import { IBannerProps } from "../../../../domain/interfaces/iWidget";
import {
  bannerBoxStyle,
  bannerPaperStyle,
  bannerTextStyle,
  closeIconStyle,
} from "./style";

const index = ({ onClose, bannerText, bannerWidth }: IBannerProps) => {
  return (
    <Box sx={bannerBoxStyle}>
      <Paper
        sx={{
          width: { bannerWidth },
          ...bannerPaperStyle,
        }}
      >
        <Typography sx={bannerTextStyle}>
          {bannerText}
          <CloseGreyIcon onClick={onClose} style={closeIconStyle} />
        </Typography>
      </Paper>
    </Box>
  );
};

export default index;
