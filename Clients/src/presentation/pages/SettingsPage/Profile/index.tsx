import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useRef, useState, ChangeEvent } from "react";
import Field from "../../../components/Inputs/Field";
import Avatar from "../../../components/Avatar/VWAvatar/index";
import { useTheme } from "@mui/material";
import DeleteAccountConfirmation from "../../../components/Modals/DeleteAccount/index";

interface User {
  firstname: string;
  lastname: string;
  pathToImage: string;
}

const ProfileForm: React.FC = () => {
  const [firstname, setFirstname] = useState<string>("");
  const [lastname, setLastname] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string>(
    "/placeholder.svg?height=80&width=80"
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenDeleteDialog = (): void => {
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = (): void => {
    setIsDeleteDialogOpen(false);
  };

  const handleUpdatePhoto = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      const newPhotoUrl = URL.createObjectURL(file);
      setProfilePhoto(newPhotoUrl);
    }
  };

  const handleDeletePhoto = (): void => {
    setProfilePhoto("/placeholder.svg?height=80&width=80");
  };

  const handleSave = (): void => {
    const saveObj = {
      firstname,
      lastname,
      password,
    };
    console.log("🚀 ~ handleSave ~ saveObj:", saveObj);
  };

  const user: User = {
    firstname,
    lastname,
    pathToImage: profilePhoto,
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
            onChange={(e) => setFirstname(e.target.value)}
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
          <Field
            id="last name"
            label="Last name"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            sx={{ mb: 5, backgroundColor: "#FFFFFF" }}
          />
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
          // mb: theme.spacing(10),
        }}
        onClick={handleSave}
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
