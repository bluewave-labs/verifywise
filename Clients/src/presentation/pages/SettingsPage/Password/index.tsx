import { useTheme } from "@mui/material";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";

const index = () => {
    const theme = useTheme();
  return (
    <Box sx={{ mt: 3 }}>
    <Box sx={{ width: "100%", maxWidth: 600 }}>
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Current Password"
          type="password"
          variant="outlined"
        />
        <TextField
          fullWidth
          label="New Password"
          type="password"
          variant="outlined"
        />
        <TextField
          fullWidth
          label="Confirm New Password"
          type="password"
          variant="outlined"
        />
        <Alert severity="warning">
          New password must contain at least eight characters and must
          include an uppercase letter, a number, and a symbol.
        </Alert>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            disableRipple
            variant="contained"
            sx={{
              width: theme.spacing(80),
              mb: theme.spacing(4),
              backgroundColor: "Save",
              color: "#fff",
              position: "relative",
              left: theme.spacing(200),
            }}
          >
            Save
          </Button>
        </Box>
      </Stack>
    </Box>
  </Box>
  )
};

export default index;
