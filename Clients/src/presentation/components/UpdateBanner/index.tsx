import { Box, Button, Typography } from "@mui/material";

export default function UpdateBanner() {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "border.dark",
        borderRadius: 2,
        boxShadow: 6,
        px: 3,
        py: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        maxWidth: 360,
      }}
    >
      <Typography variant="body2" sx={{ color: "text.primary" }}>
        A new version of VerifyWise is available
      </Typography>
      <Button
        variant="contained"
        size="small"
        onClick={() => window.location.reload()}
        sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
      >
        Update now
      </Button>
    </Box>
  );
}
