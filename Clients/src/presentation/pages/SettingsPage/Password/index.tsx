import React, { useState, useCallback } from "react";
import { useTheme, Alert, Box, Button, Stack } from "@mui/material";
import Field from "../../../components/Inputs/Field";

/**
 * A functional component that renders a password update form using Material-UI components.
 *
 * @component
 * @returns {JSX.Element} The rendered component containing password fields, an alert, and a save button.
 */
const Index: React.FC = (): JSX.Element => {
  // Retrieves the current theme settings from Material-UI.
  const theme = useTheme();

  // State hooks for managing password inputs.
  const [password, setPassword] = useState<string>(""); // State for the current password field.
  const [newPassword, setNewPassword] = useState<string>(""); // State for the new password field.
  const [confirmPassword, setConfirmPassword] = useState<string>(""); // State for the confirm new password field.

  // Handle save button click
  const handleSave = useCallback(() => {
    const passObj = {
      password,
      newPassword,
      confirmPassword,
    };
    console.log("🚀 ~ handleSave ~ passObj:", passObj);
  }, [password, newPassword, confirmPassword]);

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ width: "100%", maxWidth: 600 }}>
        <Stack sx={{ marginTop: theme.spacing(15) }}>
          {/* Current Password Field */}
          <Field
            id="Current password"
            label="Current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          {/* New Password Field */}
          <Field
            id="Password"
            label="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          {/* Confirm New Password Field */}
          <Field
            id="Confirm new password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          {/* Warning Alert */}
          <Alert severity="warning">
            New password must contain at least eight characters and must include
            an uppercase letter, a number, and a symbol.
          </Alert>
          {/* Save Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              disableRipple
              variant="contained"
              sx={{
                width: theme.spacing(80),
                mb: theme.spacing(4),
                backgroundColor: "#4c7de7",
                color: "#fff",
                position: "relative",
                left: theme.spacing(200),
                "&:hover": {
                  backgroundColor: "#175CD3 ",
                },
              }}
              onClick={handleSave}
            >
              Save
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default Index;
