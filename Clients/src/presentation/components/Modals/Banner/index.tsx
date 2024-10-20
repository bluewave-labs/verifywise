import { Box, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface IBannerProps{
  onClose: ()=> void;
  bannerText: string,
  bannerWidth: string
}

const index = ({onClose, bannerText, bannerWidth}: IBannerProps) => {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <Paper
        sx={{
          width: {bannerWidth},
          height: "52px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#475467",
        }}
      >
        <Typography
          sx={{
            fontSize: "13px",
            color: "#475467",
            whiteSpace: "nowrap",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingLeft: '7px'
          }}
        >
          {bannerText}
          <CloseIcon
            onClick={onClose}
            style={{ cursor: "pointer", marginLeft: '8px' , marginRight: '8px' }}
          />
        </Typography>
      </Paper>
    </Box>
  );
};

export default index;
