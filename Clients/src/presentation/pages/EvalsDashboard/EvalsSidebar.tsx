import { Box, List, ListItemButton, ListItemIcon, ListItemText, Chip, useTheme, Typography } from "@mui/material";
import { LayoutDashboard, FlaskConical, Database, Award, Settings, Building2 } from "lucide-react";

interface RecentExperiment {
  id: string;
  name: string;
  projectId: string;
}

interface RecentProject {
  id: string;
  name: string;
}

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
  scorersCount?: number;
  disabled?: boolean;
  // Recent items
  recentExperiments?: RecentExperiment[];
  recentProjects?: RecentProject[];
  onExperimentClick?: (experimentId: string, projectId: string) => void;
  onProjectClick?: (projectId: string) => void;
}

export default function EvalsSidebar({
  activeTab,
  onTabChange,
  experimentsCount = 0,
  datasetsCount = 0,
  scorersCount = 0,
  disabled = false,
  recentExperiments = [],
  recentProjects = [],
  onExperimentClick,
  onProjectClick,
}: EvalsSidebarProps) {
  const theme = useTheme();

  const sidebarItems: SidebarItem[] = [
    { label: "Overview", value: "overview", icon: <LayoutDashboard size={16} strokeWidth={1.5} />, disabledWhenNoProject: true },
    { label: "Experiments", value: "experiments", icon: <FlaskConical size={16} strokeWidth={1.5} />, count: experimentsCount, disabledWhenNoProject: true },
    { label: "Datasets", value: "datasets", icon: <Database size={16} strokeWidth={1.5} />, count: datasetsCount, disabledWhenNoProject: true },
    { label: "Scorers", value: "scorers", icon: <Award size={16} strokeWidth={1.5} />, count: scorersCount, disabledWhenNoProject: true },
    { label: "Configuration", value: "configuration", icon: <Settings size={16} strokeWidth={1.5} />, disabledWhenNoProject: true },
    { label: "Organization", value: "organizations", icon: <Building2 size={16} strokeWidth={1.5} />, disabledWhenNoProject: false },
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

      {/* Recent experiments section */}
      {recentExperiments.length > 0 && (
        <Box sx={{ px: 1, marginTop: "16px" }}>
          <Typography
            sx={{
              fontSize: "10px",
              fontWeight: 500,
              color: theme.palette.text.disabled,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              px: theme.spacing(3),
              mb: 0.5,
            }}
          >
            Recent experiments
          </Typography>
          <List component="nav" disablePadding>
            {recentExperiments.slice(0, 3).map((exp) => (
              <ListItemButton
                key={exp.id}
                onClick={() => onExperimentClick?.(exp.id, exp.projectId)}
                disableRipple
                sx={{
                  height: "30px",
                  borderRadius: "4px",
                  px: theme.spacing(3),
                  mb: 0.25,
                  "&:hover": {
                    backgroundColor: "#F9F9F9",
                  },
                }}
              >
                <ListItemText
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: "12px",
                      color: theme.palette.text.secondary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                >
                  {exp.name}
                </ListItemText>
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}

      {/* Recent projects section */}
      {recentProjects.length > 0 && (
        <Box sx={{ px: 1, marginTop: "16px", marginBottom: "16px" }}>
          <Typography
            sx={{
              fontSize: "10px",
              fontWeight: 500,
              color: theme.palette.text.disabled,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              px: theme.spacing(3),
              mb: 0.5,
            }}
          >
            Recent projects
          </Typography>
          <List component="nav" disablePadding>
            {recentProjects.slice(0, 3).map((proj) => (
              <ListItemButton
                key={proj.id}
                onClick={() => onProjectClick?.(proj.id)}
                disableRipple
                sx={{
                  height: "30px",
                  borderRadius: "4px",
                  px: theme.spacing(3),
                  mb: 0.25,
                  "&:hover": {
                    backgroundColor: "#F9F9F9",
                  },
                }}
              >
                <ListItemText
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: "12px",
                      color: theme.palette.text.secondary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                >
                  {proj.name}
                </ListItemText>
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
