import { useState } from "react";
import { Card, CardContent, Box, Typography, useTheme } from "@mui/material";
import { cardStyles } from "../../../themes";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  Icon: LucideIcon;
  highlight?: boolean;
  onClick?: () => void;
}

export function StatCard({ title, value, Icon, highlight, onClick }: StatCardProps) {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      elevation={0}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        ...(cardStyles.base(theme) as Record<string, unknown>),
        background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
        border: "1px solid #E5E7EB",
        height: "100%",
        minHeight: "80px",
        position: "relative",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        borderRadius: "8px",
        overflow: "hidden",
        ...(onClick && { cursor: "pointer" }),
        "&:hover": {
          background: "linear-gradient(135deg, #F9FAFB 0%, #F1F5F9 100%)",
          borderColor: "#D1D5DB",
        },
      }}
    >
      <CardContent
        sx={{
          p: "14px 16px",
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          "&:last-child": { pb: "14px" },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            bottom: "-20px",
            right: "-20px",
            opacity: isHovered ? 0.06 : 0.03,
            transform: isHovered ? "translateY(-4px)" : "translateY(0px)",
            zIndex: 0,
            pointerEvents: "none",
            transition: "opacity 0.2s ease, transform 0.3s ease",
          }}
        >
          <Icon size={64} />
        </Box>
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            sx={{
              color: "#6B7280",
              fontSize: "11px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 600,
              color: highlight ? "#B42318" : "#111827",
              lineHeight: 1.3,
            }}
          >
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
