import React from "react";
import { Box, Typography } from "@mui/material";
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
  /** Accent color for selection state (default: "#13715B") */
  accentColor?: string;
}

/**
 * A reusable selectable card component for option selection UIs.
 * Shows a checkmark when selected and highlights with the accent color.
 *
 * @example
 * <SelectableCard
 *   isSelected={selectedOption === "option1"}
 *   onClick={() => setSelectedOption("option1")}
 *   icon={<Database size={14} color={selectedOption === "option1" ? "#13715B" : "#9CA3AF"} />}
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
  accentColor = "#13715B",
}: SelectableCardProps) => (
  <Box
    onClick={onClick}
    sx={{
      p: "8px",
      border: "1px solid",
      borderColor: isSelected ? accentColor : "#E5E7EB",
      borderRadius: "4px",
      cursor: "pointer",
      backgroundColor: isSelected ? (accentColor === "#6366F1" ? "#EEF2FF" : "#F0FDF4") : "#FFFFFF",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.15s ease",
      "&:hover": {
        borderColor: accentColor,
        backgroundColor: isSelected ? (accentColor === "#6366F1" ? "#EEF2FF" : "#F0FDF4") : "#F9FAFB",
      },
    }}
  >
    {icon}
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>{title}</Typography>
      <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>{description}</Typography>
    </Box>
    {chip}
    {isSelected && <Check size={14} color={accentColor} />}
  </Box>
);

export default SelectableCard;
