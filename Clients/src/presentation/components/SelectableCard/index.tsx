import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Check } from "lucide-react";

export interface SelectableCardProps {
  /** Whether this card is currently selected */
  isSelected: boolean;
  /** Click handler */
  onClick: () => void;
  /** Icon element to display on the left */
  icon: React.ReactNode;
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Optional chip/badge to display */
  chip?: React.ReactNode;
  /** Accent color for selection state (defaults to theme primary) */
  accentColor?: string;
  /** Whether the card is disabled */
  disabled?: boolean;
}

/**
 * A reusable selectable card component for option selection UIs.
 * Shows a checkmark when selected and highlights with the accent color.
 *
 * @example
 * <SelectableCard
 *   isSelected={selectedOption === "option1"}
 *   onClick={() => setSelectedOption("option1")}
 *   icon={<Database size={14} color={selectedOption === "option1" ? theme.palette.primary.main : theme.palette.text.muted} />}
 *   title="Option 1"
 *   description="Description for option 1"
 * />
 */
const SelectableCard = ({
  isSelected,
  onClick,
  icon,
  title,
  description,
  chip,
  accentColor,
  disabled = false,
}: SelectableCardProps) => {
  const theme = useTheme();
  const resolvedAccent = accentColor || theme.palette.primary.main;

  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        p: "8px",
        border: "1px solid",
        borderColor: disabled ? theme.palette.border.input : isSelected ? resolvedAccent : theme.palette.border.input,
        borderRadius: "4px",
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: disabled ? theme.palette.background.accent : isSelected ? (accentColor === "#6366F1" ? "#EEF2FF" : "#F0FDF4") : theme.palette.background.main,
        opacity: disabled ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.15s ease",
        "&:hover": disabled ? {} : {
          borderColor: resolvedAccent,
          backgroundColor: isSelected ? (accentColor === "#6366F1" ? "#EEF2FF" : "#F0FDF4") : theme.palette.background.accent,
        },
      }}
    >
      {icon}
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: disabled ? theme.palette.text.muted : theme.palette.text.dark }}>{title}</Typography>
        <Typography sx={{ fontSize: "11px", color: disabled ? theme.palette.border.medium : theme.palette.text.muted }}>{description}</Typography>
      </Box>
      {chip}
      {isSelected && !disabled && <Check size={14} color={resolvedAccent} />}
    </Box>
  );
};

export default SelectableCard;
