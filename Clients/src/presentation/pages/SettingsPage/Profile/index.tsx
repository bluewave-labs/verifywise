import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  useMemo,
} from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material";
import Field from "../../../components/Inputs/Field";
import Avatar from "../../../components/Avatar/VWAvatar/index";
import DeleteAccountConfirmation from "../../../components/Modals/DeleteAccount/index";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import validator from "validator";
import { logEngine } from "../../../../application/tools/log.engine";
import localStorage from "redux-persist/es/storage";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";

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
  // State management
  const [firstname, setFirstname] = useState<string>("");
  const [lastname, setLastname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string>(
    "/placeholder.svg?height=80&width=80"
  );

  const [firstnameError, setFirstnameError] = useState<string | null>(null);
  const [lastnameError, setLastnameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] =
    useState<boolean>(false);

  const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        const userId = await localStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found in local storage");
        }

        const API_BASE_URL =
          process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        setFirstname(user.firstname || "");
        setLastname(user.lastname || "");
        setEmail(user.email || "");
        setProfilePhoto(
          user.pathToImage || "/placeholder.svg?height=80&width=80"
        );
      } catch (error) {
        logEngine({
          type: "error",
          message: "Failed to fetch user data.",
          user: {
            id: "N/A",
            email: "N/A",
            firstname: "N/A",
            lastname: "N/A",
          },
        });
        console.error("error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  /**
   * Handle save button click with validation.
   *
   * Validates the input fields and updates the user profile information
   * on the server if there are no validation errors.
   */
  const handleSave = useCallback(async () => {
    try {
      if (firstnameError || lastnameError || emailError) {
        setErrorModalOpen(true);
        setErrorMessage("Please fix validation errors before saving");
      }
      const userId = (await localStorage.getItem("userId")) || "1";
      if (!userId) {
        throw new Error("user id not found in local storage");
      }

      const updatedUser = {
        firstname,
        lastname,
        email,
        pathToImage: profilePhoto,
      };

      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status}`);
      }
      alert("Profile updated successfully");
      setIsConfirmationModalOpen(false);
    } finally {
      setLoading(false);
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
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Handle delete dialog close.
   *
   * Closes the delete account confirmation dialog.
   */
  const handleCloseDeleteDialog = useCallback((): void => {
    setIsDeleteDialogOpen(false);
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
   * Close confirmation modal.
   *
   * Closes the save changes confirmation modal.
   */
  const handleCloseConfirmationModal = useCallback(() => {
    setIsConfirmationModalOpen(false);
  }, []);

  /**
   * Close error modal.
   */
  const handleCloseErrorModal = useCallback(()=>{
    setErrorModalOpen(false)
  },[]);

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
            label="First name"
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
            label="Last name"
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
            <Typography fontWeight="600" variant="subtitle1">
              Your photo
            </Typography>
            <Avatar user={user} size="medium" sx={{ width: 80, height: 80 }} />
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
              sx={{ paddingTop: theme.spacing(19) }}
            >
              <Typography
                sx={{
                  color: "#667085",
                  cursor: "pointer",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
                onClick={handleDeletePhoto}
              >
                Delete
              </Typography>
              <Typography
                sx={{
                  color: "#4C7DE7",
                  cursor: "pointer",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                  paddingLeft: theme.spacing(5),
                }}
                onClick={handleUpdatePhoto}
              >
                Update
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Box>
      <Button
        disableRipple
        variant="contained"
        sx={{
          width: { xs: "100%", sm: theme.spacing(80) },
          mb: theme.spacing(4),
          backgroundColor: "#4c7de7",
          color: "#fff",
          position: { md: "relative" },
          left: { md: theme.spacing(0) },
          mt: theme.spacing(5),
          "&:hover": {
            backgroundColor: "#175CD3 ",
          },
        }}
        onClick={() => setIsConfirmationModalOpen(true)}
      >
        Save
      </Button>
      {/* Confirmation Modal */}
      {isConfirmationModalOpen && (
        <DualButtonModal
          title="Save Changes?"
          body={<Typography>Are you sure you want to save changes?</Typography>}
          cancelText="Cancel"
          proceedText="Save"
          onCancel={handleCloseConfirmationModal}
          onProceed={handleSave}
          proceedButtonColor="primary"
          proceedButtonVariant="contained"
        />
      )}
      {/* error Modal */}
      {errorModalOpen && (
        <DualButtonModal
          title="Error"
          body={
            <Typography>
              {errorMessage || "An error occured while saving"}
            </Typography>
          }
          cancelText="Close"
          proceedText="Retry"
          onCancel={handleCloseErrorModal}
          onProceed={() => {
            setErrorModalOpen(false);
            setIsConfirmationModalOpen(true);
          }}
          proceedButtonColor="error"
          proceedButtonVariant="outlined"
        />
      )}
      <Box>
        <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />
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
          <Button
            disableRipple
            variant="contained"
            onClick={handleOpenDeleteDialog}
            sx={{
              width: { xs: "100%", sm: theme.spacing(80) },
              mb: theme.spacing(4),
              backgroundColor: "#DB504A",
              color: "#fff",
            }}
          >
            Delete account
          </Button>
          <DeleteAccountConfirmation
            open={isDeleteDialogOpen}
            onClose={handleCloseDeleteDialog}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default ProfileForm;
