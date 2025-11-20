import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import { AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import Alert from "../../Alert";
import onboardingBanner from "../../../assets/onboarding-banner.svg";

const RiskManagementStep: React.FC<OnboardingStepProps> = () => {
  const capabilities = [
    {
      icon: <AlertTriangle size={18} />,
      title: "Identify Risks",
      description: "Catalog potential risks across your AI systems",
      color: "#EF4444",
    },
    {
      icon: <Users size={18} />,
      title: "Assign Ownership",
      description: "Delegate risk mitigation to responsible teams",
      color: "#F59E0B",
    },
    {
      icon: <Clock size={18} />,
      title: "Track Progress",
      description: "Monitor mitigation efforts in real-time",
      color: "#3B82F6",
    },
    {
      icon: <CheckCircle size={18} />,
      title: "Close Risks",
      description: "Mark risks as resolved when mitigation is complete",
      color: "#10B981",
    },
  ];

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
            borderRadius: "8px",
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
          Identify and mitigate risks
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
          Track risks, assign mitigation tasks, and monitor progress to maintain control over your AI systems.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
        }}
      >
        {capabilities.map((capability, index) => (
          <Box
            key={index}
            sx={{
              padding: 5,
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                backgroundColor: `${capability.color}15`,
                color: capability.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {capability.icon}
            </Box>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {capability.title}
            </Typography>
            <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
              {capability.description}
            </Typography>
          </Box>
        ))}
      </Box>

      <Alert
        variant="success"
        title="Risk Classification"
        body="Risks are automatically categorized by severity (Negligible, Minor, Moderate, Major, Catastrophic) and likelihood to help you prioritize mitigation efforts effectively."
        hasIcon={false}
        sx={{
          position: "static",
          padding: "16px",
        }}
      />
    </Stack>
  );
};

export default RiskManagementStep;
