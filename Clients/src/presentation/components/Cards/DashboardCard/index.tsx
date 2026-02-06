import { ReactNode, useState } from "react";

import { Card, CardContent, Stack, Typography } from "@mui/material";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  actionPosition?: "right" | "center";
  navigateTo?: string;
}

export function DashboardCard({
  title,
  children,
  action,
  actionPosition = "right",
  navigateTo,
}: DashboardCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #d0d5dd",
        borderRadius: "4px",
        height: "100%",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        cursor: navigateTo ? "pointer" : "default",
        transition: "all 0.2s ease",
        "&:hover": navigateTo
          ? {
              background: "linear-gradient(135deg, #f9fafb 0%, #f1f5f9 100%)",
              borderColor: "#98A2B3",
            }
          : {},
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigateTo && navigate(navigateTo)}
    >
      <CardContent sx={{ p: "16px", "&:last-child": { pb: "16px" } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb="16px"
        >
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1F2937", flex: actionPosition === "center" ? 1 : undefined }}>
            {title}
          </Typography>
          {actionPosition === "center" && action && (
            <Stack direction="row" alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
              {action}
            </Stack>
          )}
          <Stack direction="row" alignItems="center" gap={1} sx={{ flex: actionPosition === "center" ? 1 : undefined, justifyContent: actionPosition === "center" ? "flex-end" : undefined }}>
            {actionPosition === "right" && action}
            {navigateTo && (
              <ChevronRight
                size={16}
                style={{
                  opacity: isHovered ? 1 : 0.3,
                  transition: "opacity 0.2s ease",
                  color: "#667085",
                }}
              />
            )}
          </Stack>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}
