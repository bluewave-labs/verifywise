import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import { UserPlus, Settings, Shield } from "lucide-react";
import Alert from "../../Alert";
import onboardingBanner from "../../../assets/onboarding-banner.svg";

const AdminSetupStep: React.FC<OnboardingStepProps> = () => {
  const setupTasks = [
    {
      icon: <UserPlus size={24} />,
      title: "Invite Team Members",
      description: "Add colleagues to collaborate on compliance and risk management tasks.",
      action: "Go to Settings → Team to send invitations",
      color: "#3B82F6",
    },
    {
      icon: <Shield size={24} />,
      title: "Enable Frameworks",
      description: "Activate the compliance frameworks relevant to your organization.",
      action: "Visit Framework Settings to enable EU AI Act, ISO standards, and more",
      color: "#8B5CF6",
    },
    {
      icon: <Settings size={24} />,
      title: "Configure Organization Settings",
      description: "Customize branding, notifications, and organizational preferences.",
      action: "Access these options in Settings → Organization",
      color: "#10B981",
    },
  ];

  return (
    <Stack spacing={4}>
      <Box
        component="img"
        src={onboardingBanner}
        alt="Onboarding"
        sx={{
          width: "100%",
          height: "auto",
          maxHeight: "200px",
          borderRadius: "8px",
          objectFit: "cover",
        }}
      />

      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            fontSize: "24px",
            color: "#111827",
            marginBottom: 1,
          }}
        >
          Set Up Your Organization
        </Typography>
        <Typography
          sx={{
            fontSize: "14px",
            color: "#667085",
            marginBottom: 3,
            lineHeight: 1.6,
          }}
        >
          Configure your organization settings, invite team members, and enable the frameworks you need.
        </Typography>
      </Box>

      <Stack spacing={3}>
        {setupTasks.map((task, index) => (
          <Box
            key={index}
            sx={{
              padding: 3,
              backgroundColor: "white",
              border: "2px solid #E5E7EB",
              borderRadius: "8px",
              transition: "all 0.2s",
              "&:hover": {
                borderColor: task.color,
                boxShadow: `0 4px 12px ${task.color}20`,
              },
            }}
          >
            <Stack direction="row" spacing={2} marginBottom={2}>
              <Box
                sx={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  backgroundColor: `${task.color}15`,
                  color: task.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {task.icon}
              </Box>
              <Box flex={1}>
                <Typography
                  sx={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: 0.5,
                  }}
                >
                  {task.title}
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>
                  {task.description}
                </Typography>
              </Box>
            </Stack>
            <Box
              sx={{
                padding: 1.5,
                backgroundColor: "#F9FAFB",
                borderRadius: "6px",
                borderLeft: `3px solid ${task.color}`,
              }}
            >
              <Typography sx={{ fontSize: "12px", color: "#374151", fontStyle: "italic" }}>
                💡 {task.action}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>

      <Alert
        variant="info"
        body="You can complete these setup tasks at any time after onboarding. They're available in your Settings menu."
        hasIcon={false}
        sx={{
          position: "static",
          padding: "12px 16px",
        }}
      />
    </Stack>
  );
};

export default AdminSetupStep;
