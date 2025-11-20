import React, { useState } from "react";
import { Box, Typography, Stack, TextField, MenuItem, Select, FormControl, SelectChangeEvent } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import { UserPlus, Mail, Shield } from "lucide-react";
import CustomizableButton from "../../Button/CustomizableButton";
import onboardingBanner from "../../../assets/onboarding-banner.svg";

interface TeamMemberInvite {
  email: string;
  role: "admin" | "reviewer" | "editor";
}

const InviteTeamStep: React.FC<OnboardingStepProps> = () => {
  const [invites, setInvites] = useState<TeamMemberInvite[]>([
    { email: "", role: "editor" },
  ]);

  const handleEmailChange = (index: number, value: string) => {
    const newInvites = [...invites];
    newInvites[index].email = value;
    setInvites(newInvites);
  };

  const handleRoleChange = (index: number, event: SelectChangeEvent<string>) => {
    const newInvites = [...invites];
    newInvites[index].role = event.target.value as "admin" | "reviewer" | "editor";
    setInvites(newInvites);
  };

  const handleAddAnother = () => {
    if (invites.length < 5) {
      setInvites([...invites, { email: "", role: "editor" }]);
    }
  };

  const handleRemove = (index: number) => {
    if (invites.length > 1) {
      const newInvites = invites.filter((_, i) => i !== index);
      setInvites(newInvites);
    }
  };

  const handleInvite = () => {
    const validInvites = invites.filter((invite) => invite.email.trim() !== "");
    if (validInvites.length > 0) {
      // TODO: Implement actual invite logic
      console.log("Inviting team members:", validInvites);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "reviewer":
        return "Reviewer";
      case "editor":
        return "Editor";
      default:
        return role;
    }
  };

  return (
    <Stack spacing={4}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
        }}
      >
        <Box
          component="img"
          src={onboardingBanner}
          alt="Onboarding"
          sx={{
            width: "100%",
            height: "auto",
            maxHeight: "200px",
            borderRadius: "4px",
            objectFit: "cover",
            display: "block",
          }}
        />
        <Typography
          variant="h5"
          sx={{
            position: "absolute",
            top: "40px",
            left: "50px",
            fontWeight: 600,
            fontSize: "24px",
            color: "#FFFFFF",
          }}
        >
          Invite team members
        </Typography>
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: "14px",
            color: "#667085",
            marginBottom: 3,
            lineHeight: 1.6,
          }}
        >
          Invite up to 5 people to your organization to collaborate on AI governance and compliance.
        </Typography>
      </Box>

      <Stack spacing={3}>
        {invites.map((invite, index) => (
          <Box
            key={index}
            sx={{
              padding: 3,
              border: "1px solid #E5E7EB",
              borderRadius: "4px",
              backgroundColor: "#FAFAFA",
            }}
          >
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 1 }}>
                <Mail size={16} color="#6B7280" />
                <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#344054" }}>
                  Team member {index + 1}
                </Typography>
              </Box>

              <TextField
                fullWidth
                placeholder="Email address"
                value={invite.email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "13px",
                    backgroundColor: "white",
                    "&:hover fieldset": {
                      borderColor: "#13715B",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#13715B",
                    },
                  },
                }}
              />

              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={invite.role}
                    onChange={(e) => handleRoleChange(index, e)}
                    displayEmpty
                    startAdornment={
                      <Shield size={16} style={{ marginRight: 8, color: "#6B7280" }} />
                    }
                    sx={{
                      fontSize: "13px",
                      backgroundColor: "white",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#13715B",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#13715B",
                      },
                    }}
                  >
                    <MenuItem value="editor" sx={{ fontSize: "13px" }}>
                      {getRoleLabel("editor")}
                    </MenuItem>
                    <MenuItem value="reviewer" sx={{ fontSize: "13px" }}>
                      {getRoleLabel("reviewer")}
                    </MenuItem>
                    <MenuItem value="admin" sx={{ fontSize: "13px" }}>
                      {getRoleLabel("admin")}
                    </MenuItem>
                  </Select>
                </FormControl>

                {invites.length > 1 && (
                  <CustomizableButton
                    variant="text"
                    text="Remove"
                    onClick={() => handleRemove(index)}
                    sx={{
                      color: "#DC2626",
                      fontSize: "13px",
                      padding: "4px 8px",
                      minWidth: "auto",
                      "&:hover": {
                        backgroundColor: "#FEE2E2",
                      },
                    }}
                  />
                )}
              </Box>
            </Stack>
          </Box>
        ))}

        {invites.length < 5 && (
          <CustomizableButton
            variant="outlined"
            text="Add another"
            onClick={handleAddAnother}
            startIcon={<UserPlus size={16} />}
            sx={{
              borderColor: "#D0D5DD",
              color: "#344054",
              fontSize: "13px",
              alignSelf: "flex-start",
              "&:hover": {
                borderColor: "#13715B",
                backgroundColor: "#F0FDF4",
              },
            }}
          />
        )}

        <CustomizableButton
          variant="contained"
          text="Invite teammates"
          onClick={handleInvite}
          startIcon={<UserPlus size={16} />}
          sx={{
            backgroundColor: "#13715B",
            fontSize: "14px",
            padding: "10px 20px",
            alignSelf: "flex-start",
            "&:hover": {
              backgroundColor: "#0F5A47",
            },
          }}
        />

        <Box
          sx={{
            backgroundColor: "#F0FDF4",
            border: "1px solid #D1FAE5",
            borderRadius: "4px",
            padding: 2.5,
          }}
        >
          <Typography sx={{ fontSize: "13px", color: "#13715B", lineHeight: 1.6 }}>
            You can skip this step and invite team members later from the organization settings.
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
};

export default InviteTeamStep;
