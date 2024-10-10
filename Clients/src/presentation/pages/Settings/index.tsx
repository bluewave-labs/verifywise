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
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 3,
              width: "60%",
              border: "solid 3px red",
            }}
          >
            <Box sx={{ width: "40%" }}>
              <Field
                id="Firstname"
                label="Firstname:"
                value={firstname}
                onChange={(e) => console.log("object")}
              />
              <Field
                id="lastname"
                label="Lastname:"
                value={lastname}
                onChange={(e) => console.log("object")}
              />
              <Field
                id="password"
                label="Password:"
                value={password}
                onChange={(e) => console.log("object")}
              />
              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                This is your current email address — it cannot be changed.
              </Typography>
            </Box>
            <Box sx={{ width: "40%", textAlign: "center" }}>
              <Typography variant="subtitle1" gutterBottom>
                Your photo
              </Typography>
              <Avatar
                src="/placeholder.svg?height=80&width=80"
                sx={{ width: 80, height: 80, margin: "auto" }}
              />
              <Box sx={{ mt: 1 }}>
                <Link href="#" sx={{ mr: 2 }}>
                  Delete
                </Link>
                <Link href="#">Update</Link>
              </Box>
            </Box>
          </Box>
          <Box>
            <Paper
              elevation={0}
              sx={{ mt: 4, p: 3, bgcolor: "background.default" }}
            >
              <Typography variant="h6" gutterBottom>
                Delete Account
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Deleting your account is permanent and cannot be undone.
              </Typography>
              <Button variant="contained" color="error">
                Delete account
              </Button>
            </Paper>
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
