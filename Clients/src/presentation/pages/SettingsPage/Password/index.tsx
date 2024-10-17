import { useTheme } from "@mui/material";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import Field from "../../../components/Inputs/Field";
import { useState } from "react";

const index = () => {
    const theme = useTheme();
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    
  return (
    <Box sx={{ mt: 3 }}>
    <Box sx={{ width: "100%", maxWidth: 600 }}>
      <Stack spacing={3}>
      <Field
            id="Current password"
            label="Current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 5 }}
          />
          <Field
            id="Password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 5 }}
          />
          <Field
            id="Confirm new password"
            label="Confirm new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 5 }}
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
