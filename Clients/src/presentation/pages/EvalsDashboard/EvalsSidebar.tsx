import { Box, List, ListItemButton, ListItemIcon, ListItemText, Chip, useTheme, Select, MenuItem, Divider } from "@mui/material";
import { LayoutDashboard, FlaskConical, Database, Award, Settings, Building2, ChevronDown, Plus } from "lucide-react";
import { getSelectStyles } from "../../utils/inputStyles";
import type { DeepEvalProject } from "./types";

interface SidebarItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  count?: number;
  disabledWhenNoProject?: boolean;
}

interface EvalsSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  experimentsCount?: number;
  datasetsCount?: number;
  disabled?: boolean;
  // Project selector props
  allProjects?: DeepEvalProject[];
  selectedProjectId?: string;
  onProjectChange?: (projectId: string) => void;
}

export default function EvalsSidebar({
  activeTab,
  onTabChange,
  experimentsCount = 0,
  datasetsCount = 0,
  disabled = false,
  allProjects = [],
  selectedProjectId,
  onProjectChange,
}: EvalsSidebarProps) {
  const theme = useTheme();

  const sidebarItems: SidebarItem[] = [
    { label: "Overview", value: "overview", icon: <LayoutDashboard size={16} strokeWidth={1.5} />, disabledWhenNoProject: true },
    { label: "Experiments", value: "experiments", icon: <FlaskConical size={16} strokeWidth={1.5} />, count: experimentsCount, disabledWhenNoProject: true },
    { label: "Datasets", value: "datasets", icon: <Database size={16} strokeWidth={1.5} />, count: datasetsCount, disabledWhenNoProject: true },
    { label: "Scorers", value: "scorers", icon: <Award size={16} strokeWidth={1.5} />, disabledWhenNoProject: true },
    { label: "Configuration", value: "configuration", icon: <Settings size={16} strokeWidth={1.5} />, disabledWhenNoProject: true },
    { label: "Organizations", value: "organizations", icon: <Building2 size={16} strokeWidth={1.5} />, disabledWhenNoProject: false },
  ];

  return (
    <Box
      sx={{
        width: "200px",
        minWidth: "200px",
        height: "fit-content",
        border: "1px solid #d0d5dd",
        borderRadius: "4px",
        backgroundColor: theme.palette.background.main,
        py: 1,
        pr: 1, // 8px right padding
      }}
    >
      {/* Project selector at top of sidebar */}
      {allProjects.length > 0 && onProjectChange && (
        <Box sx={{ px: 1 }}>
          <Select
            value={selectedProjectId || ""}
            onChange={(e) => onProjectChange(e.target.value)}
            displayEmpty
            IconComponent={() => (
              <ChevronDown
                size={16}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: theme.palette.text.tertiary,
                }}
              />
            )}
            MenuProps={{
              disableScrollLock: true,
              PaperProps: {
                sx: {
                  borderRadius: "4px",
                  boxShadow: theme.shadows[3],
                  mt: 1,
                  "& .MuiMenuItem-root": {
                    fontSize: 13,
                    color: theme.palette.text.primary,
                    "&:hover": {
                      backgroundColor: theme.palette.background.accent,
                    },
                    "&.Mui-selected": {
                      backgroundColor: theme.palette.background.accent,
                      "&:hover": {
                        backgroundColor: theme.palette.background.accent,
                      },
                    },
                    "& .MuiTouchRipple-root": {
                      display: "none",
                    },
                  },
                },
              },
            }}
            sx={{
              fontSize: 13,
              width: "100%",
              backgroundColor: theme.palette.background.main,
              position: "relative",
              cursor: "pointer",
              "& .MuiSelect-select": {
                padding: "0 32px 0 10px !important",
                height: "34px",
                display: "flex",
                alignItems: "center",
                lineHeight: 2,
              },
              ...getSelectStyles(theme),
            }}
          >
            {allProjects.map((proj) => (
              <MenuItem
                key={proj.id}
                value={proj.id}
                sx={{
                  fontSize: 13,
                  color: theme.palette.text.tertiary,
                  borderRadius: "4px",
                  margin: theme.spacing(2),
                }}
              >
                {proj.name}
              </MenuItem>
            ))}
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              value="create_new"
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: "#13715B",
                borderRadius: "4px",
                margin: theme.spacing(2),
              }}
            >
              <Plus size={14} style={{ marginRight: 8 }} />
              Create project
            </MenuItem>
          </Select>
          <Divider sx={{ my: 1 }} />
        </Box>
      )}

      <List component="nav" disablePadding sx={{ px: 1 }}>
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.value;
          const isItemDisabled = disabled && item.disabledWhenNoProject;

          return (
            <ListItemButton
              key={item.value}
              onClick={() => !isItemDisabled && onTabChange(item.value)}
              disableRipple
              disabled={isItemDisabled}
              sx={{
                height: "34px",
                gap: theme.spacing(3),
                borderRadius: "4px",
                px: theme.spacing(3),
                mb: 0.5,
                opacity: isItemDisabled ? 0.5 : 1,
                cursor: isItemDisabled ? "not-allowed" : "pointer",
                background: isActive && !isItemDisabled
                  ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                  : "transparent",
                border: isActive && !isItemDisabled
                  ? "1px solid #D8D8D8"
                  : "1px solid transparent",
                "&:hover": {
                  background: isItemDisabled
                    ? "transparent"
                    : isActive
                    ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                    : "#F9F9F9",
                  border: isItemDisabled
                    ? "1px solid transparent"
                    : isActive
                    ? "1px solid #D8D8D8"
                    : "1px solid transparent",
                },
                "&:hover svg": isItemDisabled ? {} : {
                  color: "#13715B !important",
                  stroke: "#13715B !important",
                },
                "&:hover svg path": isItemDisabled ? {} : {
                  stroke: "#13715B !important",
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  width: "16px",
                  mr: 0,
                  "& svg": {
                    color: isItemDisabled
                      ? `${theme.palette.text.disabled} !important`
                      : isActive
                      ? "#13715B !important"
                      : `${theme.palette.text.tertiary} !important`,
                    stroke: isItemDisabled
                      ? `${theme.palette.text.disabled} !important`
                      : isActive
                      ? "#13715B !important"
                      : `${theme.palette.text.tertiary} !important`,
                    transition: "color 0.2s ease, stroke 0.2s ease",
                  },
                  "& svg path": {
                    stroke: isItemDisabled
                      ? `${theme.palette.text.disabled} !important`
                      : isActive
                      ? "#13715B !important"
                      : `${theme.palette.text.tertiary} !important`,
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                sx={{
                  "& .MuiListItemText-primary": {
                    fontSize: "13px",
                    color: isItemDisabled
                      ? theme.palette.text.disabled
                      : isActive
                      ? theme.palette.text.primary
                      : theme.palette.text.secondary,
                  },
                }}
              >
                {item.label}
              </ListItemText>
              {item.count !== undefined && item.count > 0 && !isItemDisabled && (
                <Chip
                  label={item.count > 99 ? "99+" : item.count}
                  size="small"
                  sx={{
                    height: "18px",
                    fontSize: "10px",
                    fontWeight: 500,
                    backgroundColor: isActive ? "#f8fafc" : "#e2e8f0",
                    color: "#475569",
                    borderRadius: "9px",
                    minWidth: "18px",
                    maxWidth: "36px",
                    "& .MuiChip-label": {
                      px: "6px",
                      py: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                    ml: "auto",
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
