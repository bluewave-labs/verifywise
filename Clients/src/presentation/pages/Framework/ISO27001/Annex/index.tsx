import { Stack, Typography } from "@mui/material";

const ISO27001Annex = () => {
  return (
    <Stack spacing={4}>
      <Typography
        variant="h5"
        sx={{
          color: "#1A1919",
          fontWeight: 600,
          mb: 2,
        }}
      >
        ISO 27001 Annex A Controls
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: "#666666",
          lineHeight: 1.6,
          mb: 4,
        }}
      >
        Annex A of ISO 27001 contains 114 controls organized into 4 categories.
        These controls help organizations implement appropriate information
        security measures based on their risk assessment.
      </Typography>
    </Stack>
  );
};

export default ISO27001Annex;
