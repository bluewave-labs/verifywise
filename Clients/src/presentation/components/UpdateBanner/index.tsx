import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material";
import { Info } from "lucide-react";
import singleTheme from "../../themes/v1SingleTheme";

export default function UpdateBanner() {
  const theme = useTheme();
  const { text, bg } = singleTheme.alertStyles.info;

  return (
    <Stack
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      direction="row"
      alignItems="center"
      gap={theme.spacing(8)}
      sx={{
        position: "fixed",
        top: theme.spacing(5),
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        padding: theme.spacing(8),
        backgroundColor: bg,
        border: `1px solid ${text}`,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <Box sx={{ color: text, maxHeight: "22.28px" }} aria-hidden="true">
        <Info size={20} />
      </Box>
      <Typography sx={{ fontWeight: 700, color: text }}>
        A new version of VerifyWise is available
      </Typography>
      <Button
        variant="contained"
        size="small"
        disableRipple
        onClick={() => window.location.reload()}
        sx={{
          whiteSpace: "nowrap",
          flexShrink: 0,
          backgroundColor: text,
          "&:hover": { backgroundColor: text, opacity: 0.9 },
        }}
      >
        Update now
      </Button>
    </Stack>
  );
}
