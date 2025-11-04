import React, { useState } from "react";
import { Box, Popover, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  FolderTree,
  Building,
  ListIcon,
  AlertTriangle,
  Shield,
  GraduationCap,
  AlertCircle,
  Plus,
} from "lucide-react";

/**
 * Represents a single item in the mega dropdown menu
 */
interface MegaDropdownItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Display label shown to the user */
  label: string;
  /** Icon component displayed above the label */
  icon: React.ReactNode;
  /** Navigation path where clicking the item will navigate */
  path: string;
  /** Optional state passed to the navigation (e.g., to open a modal) */
  state?: { openCreateModal?: boolean; tab?: string };
  /** CSS gradient background for the menu item */
  gradient: string;
}

const items: MegaDropdownItem[] = [
  {
    id: "use-case",
    label: "Use case",
    icon: <FolderTree size={22} strokeWidth={1.25} color="#81C784" />,
    path: "/overview",
    state: { openCreateModal: true },
    gradient: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
  },
  {
    id: "vendor",
    label: "Vendor",
    icon: <Building size={22} strokeWidth={1.25} color="#64B5F6" />,
    path: "/vendors",
    state: { openCreateModal: true },
    gradient: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
  },
  {
    id: "model",
    label: "Model",
    icon: <ListIcon size={22} strokeWidth={1.25} color="#BA68C8" />,
    path: "/model-inventory",
    state: { openCreateModal: true },
    gradient: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
  },
  {
    id: "risk",
    label: "Risk",
    icon: <AlertTriangle size={22} strokeWidth={1.25} color="#FFB74D" />,
    path: "/risk-management",
    state: { openCreateModal: true },
    gradient: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
  },
  {
    id: "policy",
    label: "Policy",
    icon: <Shield size={22} strokeWidth={1.25} color="#7986CB" />,
    path: "/policies",
    state: { openCreateModal: true },
    gradient: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
  },
  {
    id: "vendor-risk",
    label: "Vendor risk",
    icon: <Building size={22} strokeWidth={1.25} color="#E57373" />,
    path: "/vendors/risks",
    state: { openCreateModal: true },
    gradient: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
  },
  {
    id: "model-risk",
    label: "Model risk",
    icon: <AlertTriangle size={22} strokeWidth={1.25} color="#F06292" />,
    path: "/model-inventory/model-risks",
    state: { openCreateModal: true },
    gradient: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
  },
  {
    id: "training",
    label: "Training",
    icon: <GraduationCap size={22} strokeWidth={1.25} color="#4DD0E1" />,
    path: "/training",
    state: { openCreateModal: true },
    gradient: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
  },
  {
    id: "ai-incident",
    label: "AI Incident",
    icon: <AlertCircle size={22} strokeWidth={1.25} color="#FF8A65" />,
    path: "/ai-incident-managements",
    state: { openCreateModal: true },
    gradient: "linear-gradient(135deg, rgba(252, 252, 252, 1) 0%, rgba(248, 248, 248, 1) 100%)",
  },
];

/**
 * Props for the AddNewMegaDropdown component
 */
interface AddNewMegaDropdownProps {
  /** Custom label for the dropdown button (defaults to "Add new") */
  buttonLabel?: string;
}

const AddNewMegaDropdown: React.FC<AddNewMegaDropdownProps> = ({
  buttonLabel = "Add new",
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (item: MegaDropdownItem) => {
    if (item.state) {
      navigate(item.path, { state: item.state });
    } else {
      navigate(item.path);
    }
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? "add-new-mega-dropdown" : undefined;

  return (
    <>
      <Button
        variant="contained"
        size="small"
        startIcon={<Plus size={14} />}
        onClick={handleClick}
        sx={{
          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          color: "white",
          fontWeight: 500,
          fontSize: "13px",
          height: "32px",
          minHeight: "32px",
          padding: "8px 16px",
          borderRadius: "4px",
          textTransform: "none",
          boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
          "&:hover": {
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            boxShadow: "0 2px 4px rgba(16, 185, 129, 0.25)",
          },
          transition: "all 0.2s ease",
        }}
      >
        {buttonLabel}
      </Button>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{
          mt: 1,
          "& .MuiPopover-paper": {
            borderRadius: "4px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            overflow: "visible",
            backgroundColor: "#fff",
          },
        }}
      >
        <Box
          role="menu"
          aria-label="Add new item menu"
          sx={{
            p: 2,
            width: "540px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
          }}
        >
          {items.map((item) => (
            <Box
              key={item.id}
              role="menuitem"
              tabIndex={0}
              aria-label={`Create new ${item.label}`}
              onClick={() => handleItemClick(item)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemClick(item);
                }
              }}
              sx={{
                background: item.gradient,
                borderRadius: "4px",
                padding: "20px 16px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                border: "1px solid rgba(0, 0, 0, 0.04)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
                minHeight: "100px",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(255, 255, 255, 0)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  zIndex: 0,
                },
                "&:hover": {
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(250, 250, 250, 1) 100%)",
                  "& .mega-dropdown-icon": {
                    animation: "rotateIconHover 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                  },
                },
                "&:active": {
                  transform: "scale(0.98)",
                },
                "@keyframes rotateIconHover": {
                  "0%": { transform: "rotate(0deg)" },
                  "50%": { transform: "rotate(-10deg)" },
                  "100%": { transform: "rotate(10deg)" },
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                className="mega-dropdown-icon"
              >
                {item.icon}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  position: "relative",
                  zIndex: 1,
                  fontWeight: 500,
                  fontSize: "13px",
                  color: "rgba(0, 0, 0, 0.75)",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
};

export default AddNewMegaDropdown;
