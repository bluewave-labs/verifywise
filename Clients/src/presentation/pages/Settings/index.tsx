import React, { useState } from "react";
import {
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Box,
  Stack,
  Paper,
  Link,
  Alert,
  useTheme,
  Divider,
} from "@mui/material";
import Avatar from "../../components/Avatar";
import Field from "../../components/Inputs/Field";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [password, setPassword] = useState("");
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFileUpload = () => {
    document.getElementById("profile-upload")?.click();
  };

  return (
    <Box sx={{ width: "100%", padding: 2 }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { textTransform: "none" },
          "& .Mui-selected": { color: theme.palette.primary.main },
          "& .MuiTabs-indicator": {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        <Tab label="Profile" />
        <Tab label="Password" />
        <Tab label="Team" />
      </Tabs>

      {activeTab === 0 && (
        <Box sx={{ mt: 3, width: "70%",  }}>
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
                onChange={(e) => console.log("object")}
                sx={{ mb: 5 }}
              />
              <Field
                id="lastname"
                label="Lastname"
                value={lastname}
                onChange={(e) => console.log("object")}
                sx={{ mb: 5 }}
              />
              <Field
                id="password"
                label="Password"
                value={password}
                onChange={(e) => console.log("object")}
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
                    src="/placeholder.svg?height=80&width=80"
                    sx={{ width: 80, height: 80 }}
                  />

                </Stack>

                {/* Stack for Delete and Update buttons */}
                <Stack direction="row" spacing={2} alignItems={"center"} sx={{ paddingTop: theme.spacing(19)}}>
                  <Link href="#">Delete</Link>
                  <Link href="#">Update</Link>
                </Stack>
              </Stack>
            </Box>
          </Box>
          <Button
                variant="contained"
                sx={{
                  width: theme.spacing(80),
                  mb: theme.spacing(4),
                  backgroundColor: "Save",
                  color: "#fff",
                  position: "relative",
                  left: theme.spacing(400)
                }}
              >
                Save
              </Button>
          <Box>
            <Divider sx={{ borderColor: "#C2C2C2", mt: theme.spacing(3) }} />
            <Stack>
              <Typography
                fontWeight={"600"}
                gutterBottom
                sx={{ mb: 2, mt: 10 }}
              >
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
      )}

      {activeTab === 1 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ width: "100%", maxWidth: 600 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="New Password"
                type="password"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                variant="outlined"
              />
              <Alert severity="warning">
                New password must contain at least eight characters and must
                include an uppercase letter, a number, and a symbol.
              </Alert>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{
                    backgroundColor: "#1976d2",
                    "&:hover": {
                      backgroundColor: "#1565c0",
                    },
                  }}
                >
                  Save
                </Button>
              </Box>
            </Stack>
          </Box>
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ mt: 3 }}>
          <Typography>
            Team tab content (not implemented in this example)
          </Typography>
        </Box>
      )}
    </Box>
  );
}
