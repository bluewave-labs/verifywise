import React, { useState, useCallback } from "react";
import { useTheme, Alert, Box, Button, Stack, Typography } from "@mui/material";
import Field from "../../../components/Inputs/Field";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import { updateEntityById } from "../../../../application/repository/entity.repository";
import { logEngine } from "../../../../application/tools/log.engine";
import localStorage from "redux-persist/es/storage";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";

const PasswordForm: React.FC = () => {
  const theme = useTheme();

  // State management
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [currentPasswordError, setCurrentPasswordError] = useState<
    string | null
  >(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] =
    useState<boolean>(false);
  const [loading, _] = useState(false);

  // Handle current password validation
  const handleCurrentPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCurrentPassword(value);

      const validation = checkStringValidation(
        "Current password",
        value,
        8,
        128,
        true, // hasUpperCase
        true, // hasLowerCase
        true, // hasNumber
        true // hasSpecialCharacter
      );
      setCurrentPasswordError(validation.accepted ? null : validation.message);
    },
    []
  );

  // Handle new password validation
  const handleNewPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setNewPassword(value);

      const validation = checkStringValidation(
        "New password",
        value,
        8,
        128,
        true,
        true,
        true,
        true
      );
      setNewPasswordError(validation.accepted ? null : validation.message);
    },
    []
  );

  // Handle confirm password validation
  const handleConfirmPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setConfirmPassword(value);

      if (value !== newPassword) {
        setConfirmPasswordError("Passwords do not match");
      } else {
        setConfirmPasswordError(null);
      }
    },
    [newPassword]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      if (currentPasswordError || newPasswordError || confirmPasswordError) {
        logEngine({
          type: "error",
          message: "Validation errors occurred while updating password.",
          user: {
            id: String(localStorage.getItem("userId")) || "N/A",
            email: "N/A",
            firstname: "N/A",
            lastname: "N/A",
          },
        });
        return;
      }

      const userId = localStorage.getItem("userId") || "1";
      const updatedPassword = {
        currentPassword,
        newPassword,
        confirmPassword,
      };

      await updateEntityById({
        routeUrl: `/users/${userId}/password`,
        body: updatedPassword,
      });
      alert("Password updated successfully");
      setIsConfirmationModalOpen(false);
    } catch (error) {
      logEngine({
        type: "error",
        message: "An error occurred while updating the password.",
        user: {
          id: String(localStorage.getItem("userId")) || "N/A",
          email: "N/A",
          firstname: "N/A",
          lastname: "N/A",
        },
      });
      alert("Failed to update password. Please try again.");
    }
  }, [
    currentPassword,
    newPassword,
    confirmPassword,
    currentPasswordError,
    newPasswordError,
    confirmPasswordError,
  ]);

  const handleCloseConfirmationModal = useCallback(() => {
    setIsConfirmationModalOpen(false);
  }, []);

  const handleConfirmSave = useCallback(() => {
    handleSave();
  }, [handleSave]);

  return (
    <Box sx={{ mt: 3, width: { xs: "90%", md: "70%" }, position: "relative" }}>
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.8)",
            zIndex: 10,
          }}
        >
          <Typography>Loading...</Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", maxWidth: 600 }}>
        <Stack sx={{ marginTop: theme.spacing(15) }}>
          <Field
            id="Current password"
            label="Current password"
            value={currentPassword}
            onChange={handleCurrentPasswordChange}
            type="password"
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          {currentPasswordError && (
            <Typography color="error" variant="caption">
              {currentPasswordError}
            </Typography>
          )}

          <Field
            id="New password"
            label="New password"
            value={newPassword}
            onChange={handleNewPasswordChange}
            type="password"
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          {newPasswordError && (
            <Typography color="error" variant="caption">
              {newPasswordError}
            </Typography>
          )}

          <Field
            id="Confirm new password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            type="password"
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          {confirmPasswordError && (
            <Typography color="error" variant="caption">
              {confirmPasswordError}
            </Typography>
          )}

          <Alert severity="warning" sx={{ my: theme.spacing(5) }}>
            Password must contain at least eight characters and must include an
            uppercase letter, a lowercase letter, a number, and a symbol.
          </Alert>

          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              paddingTop: theme.spacing(5),
            }}
          >
            <Button
              disableRipple
              variant="contained"
              sx={{
                width: { xs: "100%", sm: theme.spacing(80) },
                mb: theme.spacing(4),
                backgroundColor: "#4c7de7",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#175CD3",
                },
              }}
              onClick={() => setIsConfirmationModalOpen(true)}
            >
              Save
            </Button>
          </Stack>
        </Stack>
      </Box>

      {isConfirmationModalOpen && (
        <DualButtonModal
          title="Confirm Save"
          body={
            <Typography fontSize={13}>
              Are you sure you want to save the changes?
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Save"
          onCancel={handleCloseConfirmationModal}
          onProceed={handleConfirmSave}
          proceedButtonColor="primary"
          proceedButtonVariant="contained"
        />
      )}
    </Box>
  );
};

export default PasswordForm;
