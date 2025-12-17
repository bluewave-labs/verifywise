import { FC, useState, useEffect, useRef, useContext } from "react";
import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import { useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import { Link as MuiLink } from "@mui/material";
import { PanelLeftClose, PanelLeftOpen, Heart, ChevronDown, FolderKanban, Plus } from "lucide-react";
import { toggleSidebar } from "../../../application/redux/ui/uiSlice";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import Logo from "../../assets/imgs/logo.png";
import SidebarFooter from "./SidebarFooter";
import FlyingHearts from "../FlyingHearts";

declare const __APP_VERSION__: string;

// Types for menu items
export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  value?: string;
  count?: number;
  disabled?: boolean;
  highlightPaths?: string[];
  onClick?: () => void;
}

export interface SidebarMenuGroup {
  name: string;
  items: SidebarMenuItem[];
}

export interface RecentSection {
  title: string;
  items: { id: string; name: string; onClick: () => void }[];
}

export interface ProjectSelectorConfig {
  currentProject: { id: string; name: string } | null;
  allProjects: { id: string; name: string }[];
  onProjectChange: (projectId: string) => void;
}

export interface SidebarShellProps {
  // Menu configuration
  topItems?: SidebarMenuItem[];
  menuGroups?: SidebarMenuGroup[];
  flatItems?: SidebarMenuItem[];
  recentSections?: RecentSection[];

  // Project selector (for Evals sidebar)
  projectSelector?: ProjectSelectorConfig;

  // Active state
  activeItemId?: string;
  isItemActive?: (item: SidebarMenuItem) => boolean;

  // Callbacks
  onItemClick?: (item: SidebarMenuItem) => void;

  // Footer props
  hasDemoData?: boolean;
  onOpenCreateDemoData?: () => void;
  onOpenDeleteDemoData?: () => void;
  showReadyToSubscribe?: boolean;
  openUserGuide?: () => void;

  // Enable flying hearts Easter egg (only for main sidebar)
  enableFlyingHearts?: boolean;
}

const SidebarShell: FC<SidebarShellProps> = ({
  topItems = [],
  menuGroups = [],
  flatItems = [],
  recentSections = [],
  projectSelector,
  activeItemId,
  isItemActive,
  onItemClick,
  hasDemoData = false,
  onOpenCreateDemoData,
  onOpenDeleteDemoData,
  showReadyToSubscribe = false,
  openUserGuide,
  enableFlyingHearts = false,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // Heart icon state (Easter egg)
  const [showHeartIcon, setShowHeartIcon] = useState(false);
  const [showFlyingHearts, setShowFlyingHearts] = useState(false);
  const [heartReturning, setHeartReturning] = useState(false);
  const heartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // VerifyWiseContext available for future use
  useContext(VerifyWiseContext);

  const collapsed = useSelector((state: any) => state.ui?.sidebar?.collapsed);

  // Delayed collapsed state for smooth animation
  const [delayedCollapsed, setDelayedCollapsed] = useState(collapsed);

  // Project selector menu state
  const [projectMenuAnchor, setProjectMenuAnchor] = useState<null | HTMLElement>(null);
  const projectMenuOpen = Boolean(projectMenuAnchor);

  useEffect(() => {
    if (collapsed) {
      setDelayedCollapsed(true);
      return;
    } else {
      const timer = setTimeout(() => {
        setDelayedCollapsed(false);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [collapsed]);

  // Heart hover handler
  const handleLogoHover = () => {
    if (!enableFlyingHearts) return;
    setShowHeartIcon(true);
    setHeartReturning(false);

    if (heartTimerRef.current) {
      clearTimeout(heartTimerRef.current);
    }

    heartTimerRef.current = setTimeout(() => {
      setHeartReturning(true);
      setTimeout(() => {
        setShowHeartIcon(false);
        setHeartReturning(false);
      }, 500);
    }, 5000);
  };

  const handleHeartClick = () => {
    setShowFlyingHearts(true);
    setTimeout(() => {
      setHeartReturning(true);
      setTimeout(() => {
        setShowHeartIcon(false);
        setHeartReturning(false);
      }, 500);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (heartTimerRef.current) {
        clearTimeout(heartTimerRef.current);
      }
    };
  }, []);

  // Check if item is active
  const checkIsActive = (item: SidebarMenuItem): boolean => {
    if (isItemActive) {
      return isItemActive(item);
    }
    if (activeItemId) {
      return item.id === activeItemId || item.value === activeItemId || item.path === activeItemId;
    }
    return false;
  };

  // Handle item click
  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.disabled) return;
    if (item.onClick) {
      item.onClick();
    }
    if (onItemClick) {
      onItemClick(item);
    }
  };

  // Render a single menu item
  const renderMenuItem = (item: SidebarMenuItem, showTooltip = true) => {
    const isActive = checkIsActive(item);
    const isDisabled = item.disabled;

    return (
      <Tooltip
        key={item.id}
        placement="right"
        title={collapsed && showTooltip ? item.label : ""}
        slotProps={{
          popper: {
            modifiers: [{ name: "offset", options: { offset: [0, -16] } }],
          },
        }}
        disableInteractive
      >
        <ListItemButton
          disableRipple={theme.components?.MuiListItemButton?.defaultProps?.disableRipple}
          className={isActive ? "selected-path" : "unselected"}
          onClick={() => handleItemClick(item)}
          disabled={isDisabled}
          sx={{
            height: "32px",
            gap: collapsed ? 0 : theme.spacing(4),
            borderRadius: theme.shape.borderRadius,
            px: theme.spacing(4),
            justifyContent: collapsed ? "center" : "flex-start",
            opacity: isDisabled ? 0.5 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
            "& .MuiListItemText-root": {
              display: collapsed ? "none" : "block",
            },
            background: isActive && !isDisabled
              ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
              : "transparent",
            border: isActive && !isDisabled
              ? "1px solid #D8D8D8"
              : "1px solid transparent",
            "&:hover": {
              background: isDisabled
                ? "transparent"
                : isActive
                ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                : "#F9F9F9",
              border: isDisabled
                ? "1px solid transparent"
                : isActive
                ? "1px solid #D8D8D8"
                : "1px solid transparent",
            },
            "&:hover svg": isDisabled ? {} : {
              color: "#13715B !important",
              stroke: "#13715B !important",
            },
            "&:hover svg path": isDisabled ? {} : {
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
              justifyContent: "center",
              width: "16px",
              mr: 0,
              "& svg": {
                color: isDisabled
                  ? `${theme.palette.text.disabled} !important`
                  : isActive
                  ? "#13715B !important"
                  : `${theme.palette.text.tertiary} !important`,
                stroke: isDisabled
                  ? `${theme.palette.text.disabled} !important`
                  : isActive
                  ? "#13715B !important"
                  : `${theme.palette.text.tertiary} !important`,
                transition: "color 0.2s ease, stroke 0.2s ease",
              },
              "& svg path": {
                stroke: isDisabled
                  ? `${theme.palette.text.disabled} !important`
                  : isActive
                  ? "#13715B !important"
                  : `${theme.palette.text.tertiary} !important`,
              },
            }}
          >
            {item.icon}
          </ListItemIcon>
          {!delayedCollapsed && (
            <ListItemText
              sx={{
                "& .MuiListItemText-primary": {
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isDisabled
                    ? theme.palette.text.disabled
                    : isActive
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                },
              }}
            >
              {item.label}
            </ListItemText>
          )}
          {!collapsed && item.count !== undefined && item.count > 0 && !isDisabled && (
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
      </Tooltip>
    );
  };

  return (
    <Stack
      component="aside"
      className={`sidebar-menu ${collapsed ? "collapsed" : "expanded"}`}
      py={theme.spacing(6)}
      gap={theme.spacing(2)}
      sx={{
        width: collapsed ? "78px" : "260px",
        minWidth: collapsed ? "78px" : "260px",
        maxWidth: collapsed ? "78px" : "260px",
        flexShrink: 0,
        height: "100vh",
        border: "none",
        borderRight: `1px solid ${theme.palette.border?.dark || "#d0d5dd"}`,
        borderRadius: 0,
        backgroundColor: theme.palette.background.main,
        transition: "width 650ms cubic-bezier(0.36, -0.01, 0, 0.77), min-width 650ms cubic-bezier(0.36, -0.01, 0, 0.77), max-width 650ms cubic-bezier(0.36, -0.01, 0, 0.77)",
      }}
    >
      {/* Logo Header */}
      <Stack
        pt={theme.spacing(6)}
        pb={theme.spacing(12)}
        sx={{
          position: "relative",
          pl: delayedCollapsed ? theme.spacing(8) : `calc(${theme.spacing(8)} + ${theme.spacing(4)})`,
          pr: theme.spacing(8),
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent={delayedCollapsed ? "center" : "flex-start"}
          gap={theme.spacing(2)}
          className="app-title"
          sx={{ position: "relative", height: "20px" }}
        >
          {!delayedCollapsed && (
            <Box
              onMouseEnter={handleLogoHover}
              sx={{ position: "relative", display: "flex", alignItems: "center" }}
            >
              {/* Heart Icon Easter Egg */}
              {enableFlyingHearts && showHeartIcon && (
                <Tooltip title="Spread some love!">
                  <IconButton
                    onClick={handleHeartClick}
                    sx={{
                      position: "absolute",
                      top: "-16px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: 0,
                      zIndex: 10,
                      "&:hover": { backgroundColor: "transparent" },
                      animation: heartReturning
                        ? "slideDownBehind 0.5s ease-in forwards"
                        : "slideUpFromBehind 0.5s ease-out",
                      "@keyframes slideUpFromBehind": {
                        "0%": { opacity: 0, transform: "translateX(-50%) translateY(28px)", zIndex: -1 },
                        "60%": { zIndex: -1 },
                        "70%": { opacity: 1, zIndex: 10 },
                        "100%": { opacity: 1, transform: "translateX(-50%) translateY(0)", zIndex: 10 },
                      },
                      "@keyframes slideDownBehind": {
                        "0%": { opacity: 1, transform: "translateX(-50%) translateY(0)", zIndex: 10 },
                        "30%": { opacity: 0.7, zIndex: 10 },
                        "40%": { zIndex: -1 },
                        "100%": { opacity: 0, transform: "translateX(-50%) translateY(28px)", zIndex: -1 },
                      },
                    }}
                  >
                    <Heart size={14} color="#FF1493" strokeWidth={1.5} fill="#FF1493" />
                  </IconButton>
                </Tooltip>
              )}
              <RouterLink to="/" style={{ display: "flex", alignItems: "center" }}>
                <img
                  src={Logo}
                  alt="Logo"
                  width={20}
                  height={20}
                  style={{ position: "relative", zIndex: 1, display: "block" }}
                />
              </RouterLink>
            </Box>
          )}
          {!delayedCollapsed && (
            <MuiLink
              component={RouterLink}
              to="/"
              sx={{ textDecoration: "none", display: "flex", alignItems: "center" }}
            >
              <Typography
                component="span"
                sx={{ opacity: 0.8, fontWeight: 500, fontSize: "13px", lineHeight: 1 }}
                className="app-title"
              >
                Verify
                <span style={{ color: "#0f604d" }}>Wise</span>
                <span style={{ fontSize: "8px", marginLeft: "4px", opacity: 0.6, fontWeight: 400 }}>
                  {__APP_VERSION__}
                </span>
              </Typography>
            </MuiLink>
          )}
          {/* Sidebar Toggle Button */}
          <IconButton
            disableRipple={theme.components?.MuiListItemButton?.defaultProps?.disableRipple}
            sx={{
              position: "absolute",
              right: delayedCollapsed ? "50%" : 0,
              transform: delayedCollapsed ? "translateX(50%)" : "none",
              top: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              p: theme.spacing(2),
              borderRadius: theme.shape.borderRadius,
              transition: "right 0.65s cubic-bezier(0.36, -0.01, 0, 0.77), transform 0.65s cubic-bezier(0.36, -0.01, 0, 0.77)",
              "& svg": {
                opacity: 0.9,
                "& path": { stroke: theme.palette.text.tertiary },
              },
              "&:focus": { outline: "none" },
              "&:hover": { backgroundColor: "#F9F9F9" },
              "&:hover svg path": { stroke: "#13715B" },
            }}
            onClick={() => dispatch(toggleSidebar())}
          >
            {delayedCollapsed ? (
              <PanelLeftOpen size={16} strokeWidth={1.5} />
            ) : (
              <PanelLeftClose size={16} strokeWidth={1.5} />
            )}
          </IconButton>
        </Stack>
      </Stack>

      {/* Menu */}
      <List
        component="nav"
        disablePadding
        sx={{
          px: theme.spacing(8),
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: theme.palette.border?.light || "#e0e0e0", borderRadius: "2px" },
          "&::-webkit-scrollbar-thumb:hover": { background: theme.palette.border?.dark || "#d0d5dd" },
        }}
      >
        {/* Project Selector (for Evals sidebar) */}
        {projectSelector && !delayedCollapsed && (
          <Box sx={{ mb: theme.spacing(4) }}>
            <Box
              onClick={(e) => setProjectMenuAnchor(e.currentTarget)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: theme.spacing(4),
                py: theme.spacing(3),
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor: "#F9FAFB",
                border: "1px solid #E5E7EB",
                transition: "all 0.15s ease",
                "&:hover": {
                  backgroundColor: "#F3F4F6",
                  borderColor: "#D1D5DB",
                },
              }}
            >
              <FolderKanban size={16} color="#6B7280" strokeWidth={1.5} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#374151",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {projectSelector.currentProject?.name || "Select project"}
                </Typography>
              </Box>
              <ChevronDown size={14} color="#9CA3AF" />
            </Box>
            <Menu
              anchorEl={projectMenuAnchor}
              open={projectMenuOpen}
              onClose={() => setProjectMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 0.5,
                    minWidth: 200,
                    maxHeight: 300,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "1px solid #E5E7EB",
                    borderRadius: "6px",
                  },
                },
              }}
            >
              {projectSelector.allProjects.map((project) => (
                <MenuItem
                  key={project.id}
                  selected={project.id === projectSelector.currentProject?.id}
                  onClick={() => {
                    projectSelector.onProjectChange(project.id);
                    setProjectMenuAnchor(null);
                  }}
                  sx={{
                    fontSize: "13px",
                    py: 1,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor: "#F0FDF4",
                      color: "#13715B",
                      fontWeight: 500,
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: "#DCFCE7",
                    },
                  }}
                >
                  {project.name}
                </MenuItem>
              ))}
              {projectSelector.allProjects.length > 0 && (
                <Box sx={{ borderTop: "1px solid #E5E7EB", mt: 0.5, pt: 0.5 }}>
                  <MenuItem
                    onClick={() => {
                      projectSelector.onProjectChange("create_new");
                      setProjectMenuAnchor(null);
                    }}
                    sx={{
                      fontSize: "13px",
                      py: 1,
                      px: 2,
                      color: "#13715B",
                      "&:hover": {
                        backgroundColor: "#F0FDF4",
                      },
                    }}
                  >
                    <Plus size={14} style={{ marginRight: 8 }} />
                    New project
                  </MenuItem>
                </Box>
              )}
            </Menu>
          </Box>
        )}

        {/* Top Items */}
        {topItems.map((item) => renderMenuItem(item))}

        {/* Flat Items (no groups) */}
        {flatItems.map((item) => renderMenuItem(item))}

        {/* Grouped Items */}
        {menuGroups.map((group) => (
          <Box key={group.name}>
            <Typography
              variant="overline"
              className="sidebar-group-header"
              sx={{
                px: theme.spacing(4),
                pt: theme.spacing(4.5),
                pb: theme.spacing(1.5),
                mt: theme.spacing(3),
                color: "#a0a0a0 !important",
                fontSize: "11px !important",
                fontWeight: 400,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                display: collapsed ? "none" : "block",
              }}
            >
              {group.name}
            </Typography>
            {group.items.map((item) => renderMenuItem(item))}
          </Box>
        ))}

        {/* Recent Sections - right after menu items */}
        {recentSections.map((section) => (
          !delayedCollapsed && section.items.length > 0 && (
            <Box key={section.title} sx={{ mt: theme.spacing(4) }}>
              <Typography
                sx={{
                  fontSize: "10px",
                  fontWeight: 500,
                  color: theme.palette.text.disabled,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  mb: 0.5,
                  px: theme.spacing(4),
                }}
              >
                {section.title}
              </Typography>
              {section.items.slice(0, 3).map((item) => (
                <ListItemButton
                  key={item.id}
                  onClick={item.onClick}
                  disableRipple
                  sx={{
                    height: "30px",
                    borderRadius: "4px",
                    px: theme.spacing(4),
                    mb: 0.25,
                    "&:hover": { backgroundColor: "#F9F9F9" },
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
                    {item.name}
                  </ListItemText>
                </ListItemButton>
              ))}
            </Box>
          )
        ))}
      </List>

      {/* Shared Footer */}
      <SidebarFooter
        collapsed={collapsed}
        delayedCollapsed={delayedCollapsed}
        hasDemoData={hasDemoData}
        onOpenCreateDemoData={onOpenCreateDemoData}
        onOpenDeleteDemoData={onOpenDeleteDemoData}
        showReadyToSubscribe={showReadyToSubscribe}
        openUserGuide={openUserGuide}
      />

      {/* Flying Hearts Animation */}
      {enableFlyingHearts && showFlyingHearts && (
        <FlyingHearts onComplete={() => setShowFlyingHearts(false)} />
      )}
    </Stack>
  );
};

export default SidebarShell;
