import React from "react";
import { Stack, Typography } from "@mui/material";
import { CheckCircle2 } from "lucide-react";

interface EmptyStateMessageProps {
  message?: string;
  icon?: React.ReactNode;
}

const EmptyStateMessage: React.FC<EmptyStateMessageProps> = ({
  message = "You're all caught up!",
  icon,
}) => (
  <Stack alignItems="center" justifyContent="center" py={3} gap={1}>
    {icon || <CheckCircle2 size={24} color="#13715B" />}
    <Typography sx={{ fontSize: 13, color: "#667085" }}>{message}</Typography>
  </Stack>
);

export default EmptyStateMessage;
