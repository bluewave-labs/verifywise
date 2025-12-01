import { useState, useRef } from "react";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Chip, useTheme, Select, MenuItem, Typography, Divider, Popover, TextField, Button, Stack } from "@mui/material";
import { LayoutDashboard, FlaskConical, Database, Award, Settings, Building2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { getSelectStyles } from "../../utils/inputStyles";
import type { DeepEvalProject } from "./types";

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
  // Project selector props
  allProjects?: DeepEvalProject[];
  selectedProjectId?: string;
  onProjectChange?: (projectId: string) => void;
  // Project actions
  onRenameProject?: (projectId: string) => void;
  onCopyProjectId?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
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
  allProjects = [],
  selectedProjectId,
  onProjectChange,
  onRenameProject,
  onCopyProjectId,
  onDeleteProject,
  recentExperiments = [],
  recentProjects = [],
  onExperimentClick,
  onProjectClick,
}: EvalsSidebarProps) {
  const theme = useTheme();
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const [createProjectAnchor, setCreateProjectAnchor] = useState<HTMLElement | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const preventCloseRef = useRef(false);

  const sidebarItems: SidebarItem[] = [
    { label: "Overview", value: "overview", icon: <LayoutDashboard size={16} strokeWidth={1.5} />, disabledWhenNoProject: true },
    { label: "Experiments", value: "experiments", icon: <FlaskConical size={16} strokeWidth={1.5} />, count: experimentsCount, disabledWhenNoProject: true },
    { label: "Datasets", value: "datasets", icon: <Database size={16} strokeWidth={1.5} />, count: datasetsCount, disabledWhenNoProject: true },
    { label: "Scorers", value: "scorers", icon: <Award size={16} strokeWidth={1.5} />, count: scorersCount, disabledWhenNoProject: true },
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
        <Box sx={{ px: 1, mt: 1 }}>
          <Select
            value={selectedProjectId || ""}
            onChange={(e) => onProjectChange(e.target.value)}
            displayEmpty
            open={selectOpen}
            onOpen={() => setSelectOpen(true)}
            onClose={() => {
              // Only close if no popover is open and we're not about to open one
              if (!actionsAnchor && !createProjectAnchor && !preventCloseRef.current) {
                setSelectOpen(false);
              }
              preventCloseRef.current = false;
            }}
            renderValue={(value) => {
              const project = allProjects.find((p) => p.id === value);
              return project?.name || "Select project";
            }}
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
              height: "34px",
              backgroundColor: theme.palette.background.main,
              position: "relative",
              cursor: "pointer",
              "& .MuiOutlinedInput-root": {
                height: "34px",
              },
              "& .MuiSelect-select": {
                padding: "0 32px 0 10px !important",
                height: "34px !important",
                minHeight: "34px !important",
                display: "flex",
                alignItems: "center",
                lineHeight: 1,
                boxSizing: "border-box",
              },
              ...getSelectStyles(theme),
            }}
          >
            {allProjects.map((proj) => {
              const isSelected = proj.id === selectedProjectId;
              const hasActions = onRenameProject || onCopyProjectId || onDeleteProject;
              return (
                <MenuItem
                  key={proj.id}
                  value={proj.id}
                  onClick={(e) => {
                    // If this is the selected project and we have actions, open submenu instead
                    if (isSelected && hasActions) {
                      e.stopPropagation();
                      e.preventDefault();
                      preventCloseRef.current = true;
                      setActionsAnchor(e.currentTarget as HTMLElement);
                    }
                    // Otherwise, let the normal select behavior happen
                  }}
                  sx={{
                    fontSize: 13,
                    color: theme.palette.text.tertiary,
                    borderRadius: "4px",
                    margin: theme.spacing(2),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {proj.name}
                  </span>
                  {isSelected && hasActions && (
                    <ChevronRight
                      size={14}
                      style={{ marginLeft: 8, flexShrink: 0, color: theme.palette.text.tertiary }}
                    />
                  )}
                </MenuItem>
              );
            })}
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              value="create_new"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                preventCloseRef.current = true;
                setCreateProjectAnchor(e.currentTarget as HTMLElement);
              }}
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

          {/* Project actions popover */}
          <Popover
            open={Boolean(actionsAnchor)}
            anchorEl={actionsAnchor}
            onClose={() => {
              setActionsAnchor(null);
              setSelectOpen(false);
            }}
            anchorOrigin={{
              vertical: "center",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "center",
              horizontal: "left",
            }}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: "4px",
                  boxShadow: theme.shadows[3],
                  ml: 0.5,
                  minWidth: 140,
                },
              },
            }}
          >
            <List disablePadding sx={{ py: 0.5 }}>
              {onRenameProject && (
                <ListItemButton
                  onClick={() => {
                    if (selectedProjectId) onRenameProject(selectedProjectId);
                    setActionsAnchor(null);
                  }}
                  sx={{
                    height: 32,
                    px: 1.5,
                    "&:hover": { backgroundColor: theme.palette.background.accent },
                  }}
                >
                  <ListItemText
                    primary="Rename project"
                    primaryTypographyProps={{ fontSize: 13, color: theme.palette.text.primary }}
                  />
                </ListItemButton>
              )}
              {onCopyProjectId && (
                <ListItemButton
                  onClick={() => {
                    if (selectedProjectId) onCopyProjectId(selectedProjectId);
                    setActionsAnchor(null);
                  }}
                  sx={{
                    height: 32,
                    px: 1.5,
                    "&:hover": { backgroundColor: theme.palette.background.accent },
                  }}
                >
                  <ListItemText
                    primary="Copy project ID"
                    primaryTypographyProps={{ fontSize: 13, color: theme.palette.text.primary }}
                  />
                </ListItemButton>
              )}
              {onDeleteProject && (
                <ListItemButton
                  onClick={() => {
                    if (selectedProjectId) onDeleteProject(selectedProjectId);
                    setActionsAnchor(null);
                  }}
                  sx={{
                    height: 32,
                    px: 1.5,
                    "&:hover": { backgroundColor: theme.palette.background.accent },
                  }}
                >
                  <ListItemText
                    primary="Delete project"
                    primaryTypographyProps={{ fontSize: 13, color: "#DC2626" }}
                  />
                </ListItemButton>
              )}
            </List>
          </Popover>

          {/* Create project popover */}
          <Popover
            open={Boolean(createProjectAnchor)}
            anchorEl={createProjectAnchor}
            onClose={() => {
              setCreateProjectAnchor(null);
              setSelectOpen(false);
              setNewProjectName("");
            }}
            anchorOrigin={{
              vertical: "center",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "center",
              horizontal: "left",
            }}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: "4px",
                  boxShadow: theme.shadows[3],
                  ml: 0.5,
                  minWidth: 240,
                  p: 2,
                },
              },
            }}
          >
            <Stack spacing={2}>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.text.primary }}>
                Create new project
              </Typography>
              <TextField
                size="small"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newProjectName.trim()) {
                    onProjectChange?.("create_new:" + newProjectName.trim());
                    setCreateProjectAnchor(null);
                    setSelectOpen(false);
                    setNewProjectName("");
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: 13,
                    height: 34,
                    borderRadius: "4px",
                  },
                }}
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  onClick={() => {
                    setCreateProjectAnchor(null);
                    setSelectOpen(false);
                    setNewProjectName("");
                  }}
                  sx={{
                    fontSize: 12,
                    textTransform: "none",
                    color: theme.palette.text.secondary,
                    height: 28,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!newProjectName.trim()}
                  onClick={() => {
                    if (newProjectName.trim()) {
                      onProjectChange?.("create_new:" + newProjectName.trim());
                      setCreateProjectAnchor(null);
                      setSelectOpen(false);
                      setNewProjectName("");
                    }
                  }}
                  sx={{
                    fontSize: 12,
                    textTransform: "none",
                    backgroundColor: "#13715B",
                    height: 28,
                    "&:hover": { backgroundColor: "#0f5a47" },
                    "&.Mui-disabled": {
                      backgroundColor: "#e0e0e0",
                      color: "#9e9e9e",
                    },
                  }}
                >
                  Create
                </Button>
              </Stack>
            </Stack>
          </Popover>
          </Box>
      )}

      <Box sx={{ height: "8px" }} />

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
