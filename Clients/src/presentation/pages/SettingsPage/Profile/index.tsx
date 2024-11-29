//make get request to backend

import {
  Box,
  Button,
  Divider,
  Stack,
  Typography,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import { useRef, useState, ChangeEvent, useEffect } from "react";
import Field from "../../../components/Inputs/Field";
import Avatar from "../../../components/Avatar/VWAvatar/index";
import { useTheme } from "@mui/material";
import DeleteAccountConfirmation from "../../../components/Modals/DeleteAccount/index";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import validator from "validator";
import {
  getEntityById,
  updateEntityById,
} from "../../../../application/repository/entity.repository";

interface User {
  firstname: string;
  lastname: string;
  email: string;
  pathToImage: string;
}

const ProfileForm: React.FC = () => {
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
  //confirmation modal
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] =
    useState<boolean>(false);

  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  //fetching first user from users
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId") || "1";
        const user = await getEntityById({ routeUrl: `/users/${userId}` });

        setFirstname(user.firstname || "");
        setLastname(user.lastname || "");
        setEmail(user.email || "");
        setProfilePhoto(
          user.pathToImage || "/placeholder.svg?height=80&width=80"
        );
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  //save button with validation
  const handleSave = async () => {
    try {
      if (firstnameError || lastnameError || emailError) {
        console.log("Please correct the errors before saving.");
        return;
      }
      const userId = localStorage.getItem("userId") || "1";
      const updatedUser = {
        firstname,
        lastname,
        email,
        pathToImage: profilePhoto,
      };

      await updateEntityById({
        routeUrl: `/users/${userId}`,
        body: updatedUser,
      });
      alert("profile updated successfully");
      setIsConfirmationModalOpen(false);
    } catch (error) {
      console.error("error updating profile:", error);
      alert("failed to update profile. please try again.");
    }
    // const saveObj = {
    //   firstname,
    //   lastname,
    //   email,
    // };
    // console.log("🚀 ~ handleSave ~ saveObj:", saveObj);
  };
const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
  const file = event.target.files?.[0];
  if (file) {
    const newPhotoUrl = URL.createObjectURL(file);
    setProfilePhoto(newPhotoUrl);
  }
};

  const handleOpenDeleteDialog = (): void => {
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = (): void => {
    setIsDeleteDialogOpen(false);
  };

  const handleUpdatePhoto = (): void => {
    fileInputRef.current?.click();
  };

  
  const handleDeletePhoto = (): void => {
    setProfilePhoto("/placeholder.svg?height=80&width=80");
  };

  const handleFirstnameChange = (e: ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleLastnameChange = (e: ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (!validator.isEmail(newEmail)) {
      setEmailError("Invalid email address");
    } else {
      setEmailError(null);
    }
  };

  const user: User = {
    firstname,
    lastname,
    pathToImage: profilePhoto,
    email,
  };

  //close confirmation
  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
  };

  return (
    <Box sx={{ mt: 3, width: { xs: "90%", md: "70%" } }}>
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
        onClick={()=> setIsConfirmationModalOpen(true)}
      >
        Save
      </Button>

      {/* confirmation modal */}
      <Dialog
        open={isConfirmationModalOpen}
        onClose={handleCloseConfirmationModal}
      >
        <DialogTitle>Save Changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to save the changes?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmationModal}>Cancel</Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
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
