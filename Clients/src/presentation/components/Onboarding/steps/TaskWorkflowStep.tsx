import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { OnboardingStepProps } from "../../../../domain/interfaces/i.onboarding";
import Illustration from "../Illustrations";
import { IllustrationType } from "../../../../domain/enums/onboarding.enum";
import { CheckSquare, MessageSquare, BarChart3, Bell } from "lucide-react";

const TaskWorkflowStep: React.FC<OnboardingStepProps> = () => {
  const workflowSteps = [
    {
      icon: <Bell size={20} />,
      title: "Receive Notifications",
      description: "Get alerted when tasks are assigned to you or when updates are made to your projects.",
    },
    {
      icon: <CheckSquare size={20} />,
      title: "Complete Tasks",
      description: "Review assigned compliance and risk mitigation tasks from your dashboard.",
    },
    {
      icon: <MessageSquare size={20} />,
      title: "Collaborate",
      description: "Comment on risks, tag team members, and share updates across projects.",
    },
    {
      icon: <BarChart3 size={20} />,
      title: "Track Progress",
      description: "Monitor your task completion and contribution to organizational compliance.",
    },
  ];

  return (
    <Stack spacing={4}>
      <Illustration type={IllustrationType.FLOW_DIAGRAM} />

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
          Your Daily Workflow
        </Typography>
        <Typography
          sx={{
            fontSize: "14px",
            color: "#667085",
            marginBottom: 3,
            lineHeight: 1.6,
          }}
        >
          Complete compliance tasks, update risk status, and collaborate with your team efficiently.
        </Typography>
      </Box>

      <Stack spacing={2}>
        {workflowSteps.map((step, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              gap: 2,
              padding: 2,
              backgroundColor: index % 2 === 0 ? "#F9FAFB" : "white",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
            }}
          >
            <Box
              sx={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#13715B",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {index + 1}
            </Box>
            <Box
              sx={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                color: "#13715B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {step.icon}
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 0.5,
                }}
              >
                {step.title}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>
                {step.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          padding: 3,
          backgroundColor: "#F0FDF4",
          border: "1px solid #D1FAE5",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor: "#13715B",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "14px",
          }}
        >
          💡
        </Box>
        <Typography sx={{ fontSize: "12px", color: "#13715B", lineHeight: 1.6 }}>
          <strong>Pro tip:</strong> Use the dashboard to get a quick overview of all your pending tasks, upcoming deadlines, and recent activity across your projects.
        </Typography>
      </Box>
    </Stack>
  );
};

export default TaskWorkflowStep;
