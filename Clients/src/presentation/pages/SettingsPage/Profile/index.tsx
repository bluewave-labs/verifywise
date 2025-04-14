import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  useMemo,
} from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material";
import Field from "../../../components/Inputs/Field";
import Avatar from "../../../components/Avatar/VWAvatar/index";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import validator from "validator";
import {
  deleteEntityById,
  getEntityById,
  updateEntityById,
} from "../../../../application/repository/entity.repository";
import { logEngine } from "../../../../application/tools/log.engine";
import localStorage from "redux-persist/es/storage";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";
import Alert from "../../../components/Alert"; // Import Alert component
import { store } from "../../../../application/redux/store";
import { extractUserToken } from "../../../../application/tools/extractToken";
import VWButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import VWToast from "../../../vw-v2-components/Toast"; // Import VWToast component
import useLogout from "../../../../application/hooks/useLogout";

/**
 * Interface representing a user object.
 * @interface
 */
interface User {
  firstname: string;
  lastname: string;
  email: string;
  pathToImage: string;
}

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
  const userData = extractUserToken(state.auth.authToken); // Extract user data from token
  const { id } = userData || {};

  // State management
  const [firstname, setFirstname] = useState<string>("");
  const [lastname, setLastname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string>(
    "/placeholder.svg?height=80&width=80"
  );
  const [showToast, setShowToast] = useState(false);
  const [firstnameError, setFirstnameError] = useState<string | null>(null);
  const [lastnameError, setLastnameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialStateRef = useRef({ firstname: "", lastname: "", email: "" });
  const isModified =
    firstname !== initialStateRef.current.firstname ||
    lastname !== initialStateRef.current.lastname ||
    email !== initialStateRef.current.email;

  const isSaveDisabled =
    !!firstnameError || !!lastnameError || !!emailError || !isModified;

  const logout = useLogout();

  /**
   * Fetch user data on component mount.
   *
   * Retrieves the user data from the server and sets the state with the
   * retrieved information.
   */
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // const userId = localStorage.getItem("userId") || 1;
        const response = await getEntityById({ routeUrl: `/users/${id}` });
        console.log("response : ", response);
        setFirstname(response.data.name || "");
        setLastname(response.data.surname || "");
        setEmail(response.data.email || "");

        initialStateRef.current = {
          firstname: response.data.name,
          lastname: response.data.surname,
          email: response.data.email,
        };

        setProfilePhoto(
          response.data.pathToImage || "/placeholder.svg?height=80&width=80"
        );
        console.log(`user ${user.firstname} ${user.lastname} fetched`);
        console.log(firstname);
      } catch (error) {
        console.log(error);
        logEngine({
          type: "error",
          message: "Failed to fetch user data.",
          user: {
            id: String(localStorage.getItem("userId")) || "N/A",
            email: "N/A",
            firstname: "N/A",
            lastname: "N/A",
          },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
    console.log("fetchUserData");
  }, []);

  /**
   * Handle save button click with validation.
   *
   * Validates the input fields and updates the user profile information
   * on the server if there are no validation errors.
   */
  const handleSave = useCallback(async () => {
    setShowToast(true); // Show toast when request is sent
    try {
      if (firstnameError || lastnameError || emailError) {
        logEngine({
          type: "error",
          message: "Validation errors occured while saving the profile.",
          user: {
            id: "N/A",
            email,
            firstname,
            lastname,
          },
        });
        setAlert({
          variant: "error",
          title: "Error",
          body: "Validation errors occurred while saving the profile.",
          isToast: true,
          visible: true,
        });
        setTimeout(() => {
          setAlert((prev) => ({ ...prev, visible: false }));
        }, 3000); // Alert will disappear after 3 seconds
        return;
      }
      // const userId = localStorage.getItem("userId") || "1";
      const updatedUser = {
        name: firstname,
        surname: lastname,
        email,
        pathToImage: profilePhoto,
      };
      const response = await updateEntityById({
        routeUrl: `/users/${id}`,
        body: updatedUser,
      });
      console.log(response);
      setAlert({
        variant: "success",
        title: "Success",
        body: "Profile updated successfully.",
        isToast: true,
        visible: true,
      });
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 3000); // Alert will disappear after 3 seconds
    } catch (error) {
      logEngine({
        type: "error",
        message: "An error occured while updating the profile.",
        user: {
          id: String(localStorage.getItem("userId")) || "N/A",
          email,
          firstname,
          lastname,
        },
      });
      setAlert({
        variant: "error",
        title: "Error",
        body: "Failed to update profile. Please try again.",
        isToast: true,
        visible: true,
      });
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 3000); // Alert will disappear after 3 seconds
    } finally {
      setShowToast(false); // Hide toast after response
      setTimeout(() => {
        setShowToast(false);
      }, 1000);
    }
  }, [
    firstname,
    lastname,
    email,
    profilePhoto,
    firstnameError,
    lastnameError,
    emailError,
  ]);

  /**
   * Handle file input change.
   *
   * Updates the profile photo with the selected file.
   *
   * @param {ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (file) {
        const newPhotoUrl = URL.createObjectURL(file);
        setProfilePhoto(newPhotoUrl);
      }
    },
    []
  );

  /**
   * Handle delete dialog open.
   *
   * Opens the delete account confirmation dialog.
   */
  const handleOpenDeleteDialog = useCallback((): void => {
    setIsDeleteModalOpen(true);
  }, []);

  /**
   * Handle delete dialog close.
   *
   * Closes the delete account confirmation dialog.
   */
  const handleCloseDeleteDialog = useCallback((): void => {
    setIsDeleteModalOpen(false);
  }, []);

  /**
   * Handle update photo button click.
   *
   * Triggers the file input click to update the profile photo.
   */
  const handleUpdatePhoto = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle delete photo button click.
   *
   * Resets the profile photo to the default placeholder.
   */
  const handleDeletePhoto = useCallback((): void => {
    setProfilePhoto("/placeholder.svg?height=80&width=80");
  }, []);

  /**
   * Handle firstname input change with validation.
   *
   * Validates the first name input and updates the state.
   *
   * @param {ChangeEvent<HTMLInputElement>} e - The change event.
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
   *
   * Validates the last name input and updates the state.
   *
   * @param {ChangeEvent<HTMLInputElement>} e - The change event.
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
   *
   * Validates the email input and updates the state.
   *
   * @param {ChangeEvent<HTMLInputElement>} e - The change event.
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
   *
   * Proceeds with deleting the account.
   */

  const handleDeleteAccount = useCallback(async () => {
    setShowToast(true); // Show toast when request is sent
    try {
      // const userId = localStorage.getItem("userId") || "1";
      await deleteEntityById({ routeUrl: `/users/${id}` });
      //clear all storage
      await localStorage.removeItem("userId");
      await localStorage.removeItem("authToken");
      
      // Use the logout hook instead of directly dispatching
      logout();

      //success alert
      setAlert({
        variant: "success",
        title: "Success",
        body: "Account deleted successfully.",
        isToast: true,
        visible: true,
      });
    } catch (error) {
      logEngine({
        type: "error",
        message: "An error occured while deleting the account.",
        user: {
          id: String(localStorage.getItem("userId")) || "N/A",
          email,
          firstname,
          lastname,
        },
      });
      setAlert({
        variant: "error",
        title: "Error",
        body: "Failed to delete account. Please try again.",
        isToast: true,
        visible: true,
      });
    } finally {
      setIsDeleteModalOpen(false);
      setShowToast(false); // Hide toast after response
      setTimeout(() => {
        setShowToast(false);
      }, 1000);
    }
  }, [email, firstname, lastname, logout]);

  // User object for Avatar component
  const user: User = useMemo(
    () => ({
      firstname,
      lastname,
      pathToImage: profilePhoto,
      email,
    }),
    [firstname, lastname, profilePhoto, email]
  );

  return (
    <Box sx={{ position: "relative", mt: 3, width: { xs: "90%", md: "70%" } }}>
      {showToast && <VWToast />} {/* Show VWToast when showToast is true */}
      {loading && (
        <VWSkeleton
          variant="rectangular"
          width="100%"
          height="300px"
          minWidth={"100%"}
          minHeight={300}
          sx={{ backgroundColor: "gray", borderRadius: 2 }}
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
          <Box sx={{ width: { xs: "100%", md: "40%" } }}>
            <Field
              id="First name"
              label="Name"
              value={firstname}
              onChange={handleFirstnameChange}
              sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
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
              sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
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
              sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
              disabled
            />
            {emailError && (
              <Typography color="error" variant="caption">
                {emailError}
              </Typography>
            )}
            <Typography
              variant="caption"
              sx={{ mt: 1, display: "block", color: "#667085" }}
            >
              This is your current email address — it cannot be changed.
            </Typography>
          </Box>
          <Box sx={{ width: { xs: "100%", md: "40%" }, textAlign: "center" }}>
            <Stack direction="column" alignItems="center" spacing={2}>
              <Typography
                fontWeight="600"
                variant="subtitle1"
                color="#344054"
                pb={theme.spacing(5)}
              >
                Your photo
              </Typography>
              <Avatar
                user={user}
                size="medium"
                sx={{ width: 80, height: 80 }}
              />
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileChange}
              />
              <Stack
                direction="row"
                spacing={2}
                alignItems={"center"}
                sx={{ paddingTop: theme.spacing(10) }}
              >
                <Typography
                  sx={{
                    color: "#667085",
                    cursor: "pointer",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                    fontSize: 13,
                  }}
                  onClick={handleDeletePhoto}
                >
                  Delete
                </Typography>
                <Typography
                  sx={{
                    color: "#13715B",
                    cursor: "pointer",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                    paddingLeft: theme.spacing(5),
                    fontSize: 13,
                  }}
                  onClick={handleUpdatePhoto}
                >
                  Update
                </Typography>
              </Stack>
            </Stack>
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
          <VWButton
            variant="contained"
            text="Save"
            sx={{
              backgroundColor: "#13715B",
              border: isSaveDisabled
                ? "1px solid rgba(0, 0, 0, 0.26)"
                : "1px solid #13715B",
              gap: 2,
            }}
            icon={<SaveIcon />}
            onClick={handleSave}
            isDisabled={isSaveDisabled}
          />
        </Stack>
      )}
      <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />
      {loading && (
        <VWSkeleton
          variant="rectangular"
          width="100%"
          height="200px"
          minWidth={"100%"}
          minHeight={200}
          sx={{ backgroundColor: "gray", borderRadius: 2 }}
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
              <VWButton
                sx={{
                  width: { xs: "100%", sm: theme.spacing(80) },
                  mb: theme.spacing(4),
                  backgroundColor: "#DB504A",
                  color: "#fff",
                  border: "1px solid #DB504A",
                  gap: 2,
                }}
                icon={<DeleteIcon />}
                variant="contained"
                onClick={handleOpenDeleteDialog}
                text="Delete account"
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
