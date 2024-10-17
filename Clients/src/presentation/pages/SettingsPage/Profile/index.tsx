import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useRef, useState } from "react";
import Field from "../../../components/Inputs/Field";
import Avatar from "../../../components/Avatar";
import { useTheme } from "@mui/material";

const index = () => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [password, setPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("/placeholder.svg?height=80&width=80");
  const theme = useTheme();
  const fileInputRef = useRef(null);

  const handleUpdatePhoto = () => {
    // Trigger the file input to open the file picker dialog
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Update the profile photo URL (for simplicity, using a local URL for demonstration purposes)
      const newPhotoUrl = URL.createObjectURL(file);
      setProfilePhoto(newPhotoUrl);
    }
  };

  const handleDeletePhoto = () => {
    // Reset to placeholder image or handle as needed
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
          <Field
            id="Firstname"
            label="Firstname"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            sx={{ mb: 5 }}
          />
          <Field
            id="lastname"
            label="Lastname"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            sx={{ mb: 5 }}
          />
          <Field
            id="Email"
            label="Email"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 5 }}
          />
          <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
            This is your current email address — it cannot be changed.
          </Typography>
        </Box>
        <Box
          sx={{
            width: "40%",
            textAlign: "center",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={6}>
            {/* Stack for Avatar and "Your photo" */}
            <Stack alignItems="center" spacing={1}>
              <Typography fontWeight="600" variant="subtitle1" gutterBottom>
                Your photo
              </Typography>
              <Avatar
                src={profilePhoto}
                sx={{ width: 80, height: 80 }}
              />
              {/* Hidden file input for selecting a new photo */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </Stack>

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
                  "&:hover": {
                    textDecoration: "underline",
                  },
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
                  "&:hover": {
                    textDecoration: "underline",
                  },
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
            Delete Account
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
            sx={{
              width: theme.spacing(80),
              mb: theme.spacing(4),
              backgroundColor: "#DB504A",
              color: "#fff",
            }}
          >
            Delete account
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default index;
