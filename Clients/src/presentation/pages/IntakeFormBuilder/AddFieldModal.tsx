import { useState } from "react";
import { Box, Popover, Typography } from "@mui/material";
import {
  Type,
  FileText,
  Mail,
  Link,
  Hash,
  Calendar,
  ChevronDown,
  ListChecks,
  CheckSquare,
} from "lucide-react";
import { FieldType, PALETTE_ITEMS } from "./types";

/**
 * Icon mapping for field types with colors matching AddNewMegaDropdown style
 */
const ICON_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  TextFields: { icon: Type, color: "#64B5F6" },
  Notes: { icon: FileText, color: "#81C784" },
  Email: { icon: Mail, color: "#BA68C8" },
  Link: { icon: Link, color: "#4DD0E1" },
  Numbers: { icon: Hash, color: "#FFB74D" },
  CalendarMonth: { icon: Calendar, color: "#7986CB" },
  ArrowDropDownCircle: { icon: ChevronDown, color: "#F06292" },
  Checklist: { icon: ListChecks, color: "#FF8A65" },
  CheckBox: { icon: CheckSquare, color: "#E57373" },
};

/**
 * Props for AddFieldModal
 */
interface AddFieldModalProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onAddField: (type: FieldType) => void;
}

/**
 * Popover for adding new form fields - displays a 3x3 grid of field types
 * Styled to match the AddNewMegaDropdown pattern
 */
export function AddFieldModal({ anchorEl, onClose, onAddField }: AddFieldModalProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const open = Boolean(anchorEl);

  const handleSelect = (type: FieldType) => {
    onAddField(type);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      sx={{
        mt: 1,
        "& .MuiPopover-paper": {
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
          backgroundColor: "#fff",
        },
      }}
    >
      <Box
        role="menu"
        aria-label="Add question type menu"
        sx={{
          p: 1.5,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
        }}
      >
        {PALETTE_ITEMS.map((item) => {
          const config = ICON_CONFIG[item.icon] || { icon: Type, color: "#6b7280" };
          const IconComponent = config.icon;
          const iconColor = config.color;

          return (
            <Box
              key={item.type}
              role="menuitem"
              tabIndex={0}
              aria-label={`Add ${item.label} question`}
              onClick={() => handleSelect(item.type)}
              onMouseEnter={() => setHoveredItem(item.type)}
              onMouseLeave={() => setHoveredItem(null)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(item.type);
                }
              }}
              sx={{
                borderRadius: "8px",
                padding: "12px 8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                backgroundColor: hoveredItem === item.type ? "#f5f5f5" : "transparent",
                border: hoveredItem === item.type ? "1px solid #e0e0e0" : "1px solid transparent",
                transition: "all 0.15s ease",
                minWidth: "90px",
                position: "relative",
                "&:active": {
                  transform: "scale(0.97)",
                },
              }}
            >
              {/* Icon container with rounded background */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <IconComponent size={20} strokeWidth={1.5} color={iconColor} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#1a1a1a",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Popover>
  );
}

export default AddFieldModal;
