import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
} from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material";
import Field from "../../../components/Inputs/Field";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import validator from "validator";
import { logEngine } from "../../../../application/tools/log.engine";
import localStorage from "redux-persist/es/storage";
import DualButtonModal from "../../../components/Dialogs/DualButtonModal";
import Alert from "../../../components/Alert";
import { store } from "../../../../application/redux/store";
import { extractUserToken } from "../../../../application/tools/extractToken";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { ReactComponent as SaveIconSVGWhite } from "../../../assets/icons/save-white.svg";
import { ReactComponent as DeleteIconWhite } from "../../../assets/icons/trash-filled-white.svg";
import CustomizableSkeleton from "../../../components/Skeletons";
import CustomizableToast from "../../../components/Toast";
import useLogout from "../../../../application/hooks/useLogout";
import {
  deleteUserById,
  getUserById,
  updateUserById,
} from "../../../../application/repository/user.repository";
import { useAuth } from "../../../../application/hooks/useAuth";

/**
 * ProfileForm component for managing user profile information.
 *
 * This component allows users to view and update their profile information,
 * including their first name, last name, email, and profile photo. It also
 * provides functionality to delete the user's account.
 *
 * @component
 * @returns {JSX.Element} The rendered component.
 */
const ProfileForm: React.FC = () => {
  const state = store.getState();
  const userData = extractUserToken(state.auth.authToken);
  const { id } = userData || {};
  const { userRoleName } = useAuth();
  const isAdmin = userRoleName === "Admin";

  // State management
  const [firstname, setFirstname] = useState<string>("");
  const [lastname, setLastname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [firstnameError, setFirstnameError] = useState<string | null>(null);
  const [lastnameError, setLastnameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // Separate saving state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title: string;
    body: string;
    isToast: boolean;
    visible: boolean;
  }>({
    variant: "info",
    title: "",
    body: "",
    isToast: true,
    visible: false,
  });

  const theme = useTheme();
  const initialStateRef = useRef({ firstname: "", lastname: "", email: "" });

  const isModified =
    firstname !== initialStateRef.current.firstname ||
    lastname !== initialStateRef.current.lastname ||
    email !== initialStateRef.current.email;

  const isSaveDisabled =
    !!firstnameError ||
    !!lastnameError ||
    !!emailError ||
    !isModified ||
    saving;

  const logout = useLogout();

  /**
   * Update initial state reference when data changes
   */
  const updateInitialState = useCallback(
    (name: string, surname: string, emailAddr: string) => {
      initialStateRef.current = {
        firstname: name,
        lastname: surname,
        email: emailAddr,
      };
    },
    []
  );

  /**
   * Fetch user data on component mount.
   */
  const fetchUserData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const userData = await getUserById({ userId: id });

      // Try both direct access and .data access to see which works
      const actualUserData = userData?.data || userData;

      setFirstname(actualUserData?.name || "");
      setLastname(actualUserData?.surname || "");
      setEmail(actualUserData?.email || "");

      updateInitialState(
        actualUserData?.name || "",
        actualUserData?.surname || "",
        actualUserData?.email || ""
      );
    } catch (error) {
      console.log(error);
      logEngine({
        type: "error",
        message: "Failed to fetch user data.",
      });
    } finally {
      setLoading(false);
    }
  }, [id, updateInitialState]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  /**
   * Show alert with auto-hide functionality
   */
  const showAlert = useCallback(
    (
      variant: "success" | "info" | "warning" | "error",
      title: string,
      body: string
    ) => {
      setAlert({
        variant,
        title,
        body,
        isToast: true,
        visible: true,
      });

      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 3000);
    },
    []
  );

  /**
   * Handle save button click with validation.
   */
  const handleSave = useCallback(async () => {
    // Early validation check
    if (firstnameError || lastnameError || emailError) {
      logEngine({
        type: "error",
        message: "Validation errors occurred while saving the profile.",
      });
      showAlert(
        "error",
        "Error",
        "Validation errors occurred while saving the profile."
      );
      return;
    }

    setSaving(true);
    setShowToast(true);

    try {
      const updatedUser = {
        name: firstname,
        surname: lastname,
        email,
      };

      const response = await updateUserById({
        userId: id,
        userData: updatedUser,
      });

      console.log("Update response:", response);

      // Validate response before proceeding with success path
      if (response && response.status >= 200 && response.status < 300) {
        // Update the initial state to reflect the new saved values
        // This prevents the form from thinking it's still modified
        updateInitialState(firstname, lastname, email);

        showAlert("success", "Success", "Profile updated successfully.");
      } else {
        // Handle failure response
        logEngine({
          type: "error",
          message: `Failed to update profile. Status: ${
            response?.status || "undefined"
          }, Response: ${JSON.stringify(response)}`,
        });
        showAlert(
          "error",
          "Error",
          "Failed to update profile. Please try again."
        );
      }
    } catch (error) {
      console.error("Update error:", error);
      logEngine({
        type: "error",
        message: `An error occurred while updating the profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
      showAlert(
        "error",
        "Error",
        "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
      setShowToast(false);
    }
  }, [
    firstname,
    lastname,
    email,
    firstnameError,
    lastnameError,
    emailError,
    id,
    updateInitialState,
    showAlert,
  ]);

  /**
   * Handle delete dialog open.
   */
  const handleOpenDeleteDialog = useCallback((): void => {
    setIsDeleteModalOpen(true);
  }, []);

  /**
   * Handle delete dialog close.
   */
  const handleCloseDeleteDialog = useCallback((): void => {
    setIsDeleteModalOpen(false);
  }, []);

  /**
   * Handle firstname input change with validation.
   */
  const handleFirstnameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newFirstname = e.target.value;
      setFirstname(newFirstname);

      const validation = checkStringValidation(
        "First name",
        newFirstname,
        2,
        50,
        false,
        false
      );
      setFirstnameError(validation.accepted ? null : validation.message);
    },
    []
  );

  /**
   * Handle lastname input change with validation.
   */
  const handleLastnameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newLastname = e.target.value;
      setLastname(newLastname);

      const validation = checkStringValidation(
        "Last name",
        newLastname,
        2,
        50,
        false,
        false
      );
      setLastnameError(validation.accepted ? null : validation.message);
    },
    []
  );

  /**
   * Handle email input change with validation.
   */
  const handleEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (!validator.isEmail(newEmail)) {
      setEmailError("Invalid email address");
    } else {
      setEmailError(null);
    }
  }, []);

  /**
   * Handle delete confirmation.
   */
  const handleDeleteAccount = useCallback(async () => {
    setShowToast(true);
    try {
      const response = await deleteUserById({ userId: Number(id) });

      if (response?.status === 202) {
        // Clear storage only on success
        await localStorage.removeItem("userId");
        await localStorage.removeItem("authToken");

        logout();

        showAlert("success", "Success", "Account deleted successfully.");
      } else {
        // Handle failure case
        logEngine({
          type: "error",
          message: `Failed to delete account. Status: ${
            response?.status || "undefined"
          }, Response: ${JSON.stringify(response)}`,
        });
        showAlert(
          "error",
          "Error",
          "Failed to delete account. Please try again."
        );
      }
    } catch (error) {
      logEngine({
        type: "error",
        message: `An error occurred while deleting the account: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
      showAlert(
        "error",
        "Error",
        "Failed to delete account. Please try again."
      );
    } finally {
      setIsDeleteModalOpen(false);
      setShowToast(false);
    }
  }, [id, logout, showAlert]);

  return (
    <Box
      sx={{
        position: "relative",
        mt: 3,
        width: { xs: "90%", md: "70%" },
        maxWidth: "600px",
      }}
    >
      {showToast && <CustomizableToast />}

      {loading && (
        <CustomizableSkeleton
          variant="rectangular"
          width="100%"
          height="300px"
          minWidth={"100%"}
          minHeight={300}
          sx={{ borderRadius: 2 }}
        />
      )}

      {alert.visible && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={alert.isToast}
          onClick={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {!loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            mb: 3,
            width: "100%",
            mt: 20,
          }}
        >
          <Box sx={{ width: { xs: "100%", md: "100%" } }}>
            <Field
              id="First name"
              label="Name"
              value={firstname}
              onChange={handleFirstnameChange}
              sx={{ mb: 5, backgroundColor: "#FFFFFF", maxWidth: "600px" }}
              disabled={saving}
            />
            {firstnameError && (
              <Typography color="error" variant="caption">
                {firstnameError}
              </Typography>
            )}

            <Field
              id="Last name"
              label="Surname"
              value={lastname}
              onChange={handleLastnameChange}
              sx={{ mb: 5, backgroundColor: "#FFFFFF", maxWidth: "600px" }}
              disabled={saving}
            />
            {lastnameError && (
              <Typography color="error" variant="caption">
                {lastnameError}
              </Typography>
            )}

            <Field
              id="Email"
              label="Email"
              value={email}
              onChange={handleEmailChange}
              sx={{ mb: 5, backgroundColor: "#FFFFFF", maxWidth: "600px" }}
              disabled // Email is always disabled as mentioned in the original code
            />
            {emailError && (
              <Typography color="error" variant="caption">
                {emailError}
              </Typography>
            )}

            <Typography
              variant="caption"
              sx={{
                mt: 1,
                mb: { xs: 5, md: 0 },
                display: "block",
                color: "#667085",
              }}
            >
              This is your current email address — it cannot be changed.
            </Typography>
          </Box>
        </Box>
      )}

      {!loading && (
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <CustomizableButton
            variant="contained"
            text={saving ? "Saving..." : "Save"}
            sx={{
              backgroundColor: "#13715B",
              border: isSaveDisabled
                ? "1px solid rgba(0, 0, 0, 0.26)"
                : "1px solid #13715B",
              gap: 2,
            }}
            icon={<SaveIconSVGWhite />}
            onClick={handleSave}
            isDisabled={isSaveDisabled}
          />
        </Stack>
      )}

      <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />

      {loading && (
        <CustomizableSkeleton
          variant="rectangular"
          width="100%"
          height="200px"
          minWidth={"100%"}
          minHeight={200}
          sx={{ borderRadius: 2 }}
        />
      )}

      {!loading && (
        <Box>
          <Stack>
            <Typography fontWeight={"600"} gutterBottom sx={{ mb: 2, mt: 10 }}>
              Delete account
            </Typography>
            <Typography
              fontWeight={"400"}
              variant="body2"
              sx={{ mb: 8, mt: 4, color: "#667085" }}
            >
              Note that deleting your account will remove all data from our
              system. This is permanent and non-recoverable.
            </Typography>
            <Stack
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <CustomizableButton
                sx={{
                  width: { xs: "100%", sm: theme.spacing(80) },
                  mb: theme.spacing(4),
                  backgroundColor: "#DB504A",
                  color: "#fff",
                  border: `1px solid ${isAdmin ? "#C2C2C2" : "#DB504A"}`,
                  gap: 2,
                }}
                icon={<DeleteIconWhite />}
                variant="contained"
                onClick={handleOpenDeleteDialog}
                text="Delete account"
                isDisabled={isAdmin}
              />
            </Stack>
          </Stack>
        </Box>
      )}

      {isDeleteModalOpen && (
        <DualButtonModal
          title="Confirm Delete"
          body={
            <Typography fontSize={13}>
              Are you sure you want to delete your account? This action is
              permanent and cannot be undone.
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Delete"
          onCancel={handleCloseDeleteDialog}
          onProceed={handleDeleteAccount}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
        />
      )}
    </Box>
  );
};

export default ProfileForm;
