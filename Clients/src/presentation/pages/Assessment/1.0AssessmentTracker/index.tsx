import { Stack, Typography, useTheme } from "@mui/material";
import { pageHeadingStyle } from "./index.style";

const AssessmentTracker = () => {
  const theme = useTheme();
  return (
    <Stack className="assessment-tracker">
      <Stack
        className="assessment-tracker-holder"
        sx={{
          gap: theme.spacing(2),
          backgroundColor: theme.palette.background.alt,
        }}
      >
        <Typography sx={pageHeadingStyle}>Assessment tracker</Typography>
      </Stack>
    </Stack>
  );
};

export default AssessmentTracker;
