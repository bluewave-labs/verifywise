import { useState } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TaskRadarCardProps {
  overdue: number;
  due: number;
  upcoming: number;
}

export function TaskRadarCard({
  overdue,
  due,
  upcoming,
}: TaskRadarCardProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const max = Math.max(overdue, due, upcoming, 1);
  const barHeight = 80;

  const items = [
    { label: "Overdue", value: overdue, color: "#EF4444" },
    { label: "Due soon", value: due, color: "#F59E0B" },
    { label: "Upcoming", value: upcoming, color: "#10B981" },
  ];

  return (
    <Stack
      sx={{
        border: `1px solid ${theme.palette.border.dark}`,
        borderRadius: "4px",
        background: `linear-gradient(135deg, ${theme.palette.background.main} 0%, ${theme.palette.background.subtle} 100%)`,
        width: "100%",
        padding: "16px",
        height: "100%",
        boxSizing: "border-box",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          background: `linear-gradient(135deg, ${theme.palette.background.accent} 0%, ${theme.palette.background.hover} 100%)`,
          borderColor: theme.palette.text.muted,
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate("/tasks")}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb="16px"
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Task radar
        </Typography>
        <ChevronRight
          size={16}
          style={{
            opacity: isHovered ? 1 : 0.3,
            transition: "opacity 0.2s ease",
            color: theme.palette.other.icon,
          }}
        />
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-around"
        alignItems="flex-end"
        sx={{ height: barHeight + 40, flex: 1 }}
      >
        {items.map((item) => (
          <Stack key={item.label} alignItems="center" gap={0.5}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary }}>
              {item.value}
            </Typography>
            <Box
              sx={{
                width: 40,
                height: (item.value / max) * barHeight || 4,
                backgroundColor: item.color,
                borderRadius: "4px 4px 0 0",
                minHeight: 4,
              }}
            />
            <Typography sx={{ fontSize: 11, color: theme.palette.other.icon, textAlign: "center" }}>
              {item.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
