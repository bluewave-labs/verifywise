import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useRef, useState } from "react";
import Field from "../../../components/Inputs/Field";
import Avatar from "../../../components/Avatar";
import { useTheme } from "@mui/material";
import DeleteAccountConfirmation from "../../../components/Modals/DeleteAccount/index";

/**
 * A functional component that renders a user profile form with fields for the first name, last name, email,
 * and profile photo, allowing users to update their information or delete their profile photo.
 *
 * @component
 * @returns {JSX.Element} The rendered user profile form component.
 */
const index = () => {
  // State hooks for managing form inputs and profile photo.
  const [firstname, setFirstname] = useState(""); // State for the first name field.
  const [lastname, setLastname] = useState(""); // State for the last name field.
  const [password, setPassword] = useState(""); // State for the email/password field (misnamed, should represent email).
  const [profilePhoto, setProfilePhoto] = useState(
    "/placeholder.svg?height=80&width=80"
  ); // State for the profile photo URL.
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  // Retrieves the current theme settings from Material-UI for styling consistency.
  const theme = useTheme();

  // Reference to the hidden file input element for photo uploads.
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Opens the file picker dialog to update the profile photo.
   */
  const handleUpdatePhoto = () => {
    if (fileInputRef.current !== null) {
      fileInputRef.current.click();
    }
  };

  /**
   * Handles the file input change event and updates the profile photo URL.
   *
   * @param {Object} event - The event object from the file input change.
   */
  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const newPhotoUrl = URL.createObjectURL(file);
      setProfilePhoto(newPhotoUrl);
    }
  };

  /**
   * Resets the profile photo to the placeholder image.
   */
  const handleDeletePhoto = () => {
    setProfilePhoto("/placeholder.svg?height=80&width=80");
    console.log("Photo deleted");
  };

  return (
    <Box sx={{ mt: 3, width: "70%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          width: "90%",
          mt: 20,
        }}
      >
        <Box sx={{ width: "40%" }}>
          {/* First Name Field */}
          <Field
            id="First name"
            label="First name"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          {/* Last Name Field */}
          <Field
            id="last name"
            label="Last name"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          {/* Email Field */}
          <Field
            id="Email"
            label="Email"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          <Typography
            variant="caption"
            sx={{ mt: 1, display: "block", color: "#667085" }}
          >
            This is your current email address — it cannot be changed.
          </Typography>
        </Box>
        <Box sx={{ width: "40%", textAlign: "center" }}>
          <Stack direction="row" alignItems="center" spacing={6}>
            {/* Avatar and photo update section */}
            <Stack alignItems="center" spacing={1}>
              <Typography fontWeight="600" variant="subtitle1" gutterBottom>
                Your photo
              </Typography>
              <Avatar src={profilePhoto} sx={{ width: 80, height: 80 }} />
              {/* Hidden file input for photo upload */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </Stack>
            {/* Delete and Update photo actions */}
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
      {/* Save button */}
      <Button
        disableRipple
        variant="contained"
        sx={{
          width: theme.spacing(80),
          mb: theme.spacing(4),
          backgroundColor: "#4c7de7",
          color: "#fff",
          position: "relative",
          left: theme.spacing(400),
          marginTop: theme.spacing(5),
          marginBottom: theme.spacing(10),
        }}
      >
        Save
      </Button>
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
              width: theme.spacing(80),
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

export default index;
