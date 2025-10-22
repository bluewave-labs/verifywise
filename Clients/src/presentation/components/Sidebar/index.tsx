/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  Chip,
  Drawer,
  Menu,
  MenuItem,
} from "@mui/material";
import "./index.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { useTheme } from "@mui/material";
import React, { useContext, useState, useEffect, useRef } from "react";
import { toggleSidebar } from "../../../application/redux/ui/uiSlice";

// Lucide Icons
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Flag,
  MoreVertical,
  LogOut,
  BarChart3,
  AlertTriangle,
  Building,
  Settings,
  FileText,
  Scale,
  MessageCircle,
  MessageSquare,
  Brain,
  Shield,
  GraduationCap,
  Telescope,
  List as ListIcon,
  FolderTree,
  Layers,
  AlertCircle,
  FolderCog,
} from "lucide-react";

import Logo from "../../assets/imgs/logo.png";

import Avatar from "../Avatar/VWAvatar";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { Link as RouterLink } from "react-router-dom";
import { Link as MuiLink } from "@mui/material";
import { ROLES } from "../../../application/constants/roles";
import useLogout from "../../../application/hooks/useLogout";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import ReadyToSubscribeBox from "../ReadyToSubscribeBox/ReadyToSubscribeBox";
import { User } from "../../../domain/types/User";
import { getAllTasks } from "../../../application/repository/task.repository";
import { TaskStatus } from "../../../domain/enums/task.enum";
import { IMenuGroup, IMenuItem } from "../../../domain/interfaces/i.menu";

const getMenuGroups = (): IMenuGroup[] => [
  {
    name: "DISCOVERY",
    items: [
      {
        name: "Use cases",
        icon: <FolderTree size={16} strokeWidth={1.5} />,
        path: "/overview",
        highlightPaths: ["/project-view"],
      },
      {
        name: "Organizational view",
        icon: <Layers size={16} strokeWidth={1.5} />,
        path: "/framework",
      },
      {
        name: "Vendors",
        icon: <Building size={16} strokeWidth={1.5} />,
        path: "/vendors",
      },
      {
        name: "Model Inventory",
        icon: <ListIcon size={16} strokeWidth={1.5} />,
        path: "/model-inventory",
      },
    ],
  },
  {
    name: "ASSURANCE",
    items: [
      {
        name: "Risk Management",
        icon: <AlertTriangle size={16} strokeWidth={1.5} />,
        path: "/risk-management",
      },
      {
        name: "Bias & Fairness",
        icon: <Scale size={16} strokeWidth={1.5} />,
        path: "/fairness-dashboard",
      },
      {
        name: "Training Registry",
        icon: <GraduationCap size={16} strokeWidth={1.5} />,
        path: "/training",
      },
      {
        name: "Evidence",
        icon: <FileText size={16} strokeWidth={1.5} />,
        path: "/file-manager",
      },
      {
        name: "Reporting",
        icon: <BarChart3 size={16} strokeWidth={1.5} />,
        path: "/reporting",
      },
      {
        name: "AI Trust Center",
        icon: <Brain size={16} strokeWidth={1.5} />,
        path: "/ai-trust-center",
      },
    ],
  },
  {
    name: "GOVERNANCE",
    items: [
      {
        name: "Policy Manager",
        icon: <Shield size={16} strokeWidth={1.5} />,
        path: "/policies",
      },
      {
        name: "Incident Management",
        icon: <AlertCircle size={16} strokeWidth={1.5} />,
        path: "/ai-incident-managements",
      },
    ],
  },
];

const topItems = (openTasksCount: number): IMenuItem[] => [
  {
    name: "Dashboard",
    icon: <Home size={16} strokeWidth={1.5} />,
    path: "/",
  },
  {
    name: "Tasks",
    icon: <Flag size={16} strokeWidth={1.5} />,
    path: "/tasks",
    taskCount: openTasksCount,
  },
];

const managementItems: IMenuItem[] = [
  {
    name: "Event Tracker",
    icon: <Telescope size={16} strokeWidth={1.5} />,
    path: "/event-tracker",
  },
  {
    name: "Settings",
    icon: <Settings size={16} strokeWidth={1.5} />,
    path: "/settings",
  },
];

// Reserved for future use
// const other: IMenuItem[] = [];

const DEFAULT_USER: User = {
  id: 1,
  name: "",
  surname: "",
  email: "",
  roleId: 1,
};

interface User_Avatar {
  firstname: string;
  lastname: string;
  email: string;
  pathToImage: string;
}

const Sidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [managementAnchorEl, setManagementAnchorEl] = useState<null | HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  const { userId, changeComponentVisibility, users } =
    useContext(VerifyWiseContext);

  const { refs, allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });

  const user: User = users
    ? users.find((user: User) => user.id === userId) || DEFAULT_USER
    : DEFAULT_USER;

  const userAvator: User_Avatar = {
    firstname: user.name,
    lastname: user.surname,
    email: user.email,
    pathToImage: "",
  };

  const collapsed = useSelector((state: any) => state.ui?.sidebar?.collapsed);

  const [openTasksCount, setOpenTasksCount] = useState(0);

  const menuGroups = getMenuGroups();

  const openPopup = () => {
    setSlideoverOpen(true);
  };

  const closePopup = () => {
    setSlideoverOpen(false);
  };

  const customMenuHandler = () => {
    switch (location.pathname) {
      case "/all-assessments":
        return "/assessment";
      default:
        return null;
    }
  };

  useEffect(() => {
    if (allVisible) {
      changeComponentVisibility("sidebar", true);
    }
  }, [allVisible]);

  // Fetch open tasks count
  useEffect(() => {
    const fetchOpenTasksCount = async () => {
      try {
        const response = await getAllTasks({
          status: [TaskStatus.OPEN],
        });
        setOpenTasksCount(response?.data?.tasks?.length || 0);
      } catch (error) {
        console.error("Error fetching open tasks count:", error);
        setOpenTasksCount(0);
      }
    };

    fetchOpenTasksCount();
    // Refresh count every 5 minutes
    const interval = setInterval(fetchOpenTasksCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        slideoverOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        closePopup();
      }
    };

    if (slideoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [slideoverOpen]);

  return (
    <Stack
      component="aside"
      className={`sidebar-menu ${collapsed ? "collapsed" : "expanded"}`}
      py={theme.spacing(6)}
      gap={theme.spacing(2)}
      sx={{
        height: "100vh",
        border: 1,
        borderColor: theme.palette.border.light,
        borderRadius: theme.shape.borderRadius,
        backgroundColor: theme.palette.background.main,
        "& ,selected-path, & >MuiListItemButton-root:hover": {
          backgroundColor: theme.palette.background.main,
        },
        "& .Muilist-root svg path": {
          stroke: theme.palette.text.tertiary,
        },
        "& p, & span, & .MuiListSubheader-root": {
          color: theme.palette.text.secondary,
        },
      }}
    >
      <Stack
        pt={theme.spacing(6)}
        pb={theme.spacing(12)}
        pl={theme.spacing(12)}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={theme.spacing(4)}
          className="app-title"
        >
          <RouterLink to="/">
            <img src={Logo} alt="Logo" width={32} height={30} />
          </RouterLink>
          <MuiLink
            component={RouterLink}
            to="/"
            sx={{ textDecoration: "none" }}
          >
            <Typography
              component="span"
              mt={theme.spacing(2)}
              sx={{ opacity: 0.8, fontWeight: 500 }}
              className="app-title"
            >
              Verify
              <span
                style={{
                  color: "#0f604d",
                }}
              >
                Wise
              </span>
            </Typography>
          </MuiLink>
        </Stack>
      </Stack>

      <IconButton
        disableRipple={
          theme.components?.MuiListItemButton?.defaultProps?.disableRipple
        }
        sx={{
          position: "absolute",
          top: 60,
          right: 0,
          transform: `translate(50%, 0)`,
          backgroundColor: theme.palette.background.fill,
          border: 1,
          borderColor: theme.palette.border.light,
          p: theme.spacing(2.5),
          "& svg": {
            "& path": {
              stroke: theme.palette.text.secondary,
            },
          },
          "&:focus": { outline: "none" },
          "&:hover": {
            backgroundColor: theme.palette.border,
            borderColor: theme.palette.border,
          },
        }}
        onClick={() => {
          dispatch(toggleSidebar());
        }}
      >
        {collapsed ? (
          <ChevronRight size={16} strokeWidth={1.5} />
        ) : (
          <ChevronLeft size={16} strokeWidth={1.5} />
        )}
      </IconButton>
      {/* menu */}
      <List
        component="nav"
        aria-labelledby="nested-menu-subheader"
        disablePadding
        sx={{
          px: theme.spacing(8),
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme.palette.border.light,
            borderRadius: "2px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: theme.palette.border.dark,
          },
        }}
        data-joyride-id="dashboard-navigation"
        ref={refs[1]}
      >
        {/* Top level items (Dashboard and Tasks) */}
        {topItems(openTasksCount).map((item) => (
          <Tooltip
            sx={{ fontSize: 13 }}
            key={item.path}
            placement="right"
            title={collapsed ? item.name : ""}
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, -16],
                    },
                  },
                ],
              },
            }}
            disableInteractive
          >
            <ListItemButton
              disableRipple={
                theme.components?.MuiListItemButton?.defaultProps?.disableRipple
              }
              className={
                location.pathname === item.path ||
                item.highlightPaths?.some((p: string) =>
                  location.pathname.startsWith(p)
                ) ||
                customMenuHandler() === item.path
                  ? "selected-path"
                  : "unselected"
              }
              onClick={() => navigate(`${item.path}`)}
              sx={{
                height: "32px",
                gap: theme.spacing(4),
                borderRadius: theme.shape.borderRadius,
                px: theme.spacing(4),
                background:
                  location.pathname === item.path ||
                  item.highlightPaths?.some((p: string) =>
                    location.pathname.startsWith(p)
                  ) ||
                  customMenuHandler() === item.path
                    ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                    : "transparent",
                border:
                  location.pathname === item.path ||
                  item.highlightPaths?.some((p: string) =>
                    location.pathname.startsWith(p)
                  ) ||
                  customMenuHandler() === item.path
                    ? "1px solid #D8D8D8"
                    : "1px solid transparent",

                "&:hover": {
                  background:
                    location.pathname === item.path ||
                    item.highlightPaths?.some((p: string) =>
                      location.pathname.startsWith(p)
                    ) ||
                    customMenuHandler() === item.path
                      ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                      : "#F9F9F9",
                  border:
                    location.pathname === item.path ||
                    item.highlightPaths?.some((p: string) =>
                      location.pathname.startsWith(p)
                    ) ||
                    customMenuHandler() === item.path
                      ? "1px solid #D8D8D8"
                      : "1px solid transparent",
                },
                "&:hover svg": {
                  color: "#13715B !important",
                  stroke: "#13715B !important",
                },
                "&:hover svg path": {
                  stroke: "#13715B !important",
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
                    color:
                      location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path
                        ? "#13715B !important"
                        : `${theme.palette.text.tertiary} !important`,
                    stroke:
                      location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path
                        ? "#13715B !important"
                        : `${theme.palette.text.tertiary} !important`,
                    transition: "color 0.2s ease, stroke 0.2s ease",
                  },
                  "& svg path": {
                    stroke:
                      location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path
                        ? "#13715B !important"
                        : `${theme.palette.text.tertiary} !important`,
                  },
                  "&:hover svg": {
                    color: "#13715B !important",
                    stroke: "#13715B !important",
                  },
                  "&:hover svg path": {
                    stroke: "#13715B !important",
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                sx={{
                  "& .MuiListItemText-primary": {
                    fontSize: "13px",
                  },
                }}
              >
                {item.name}
              </ListItemText>
              {item.taskCount && item.taskCount > 0 && (
                <Chip
                  label={item.taskCount > 99 ? "99+" : item.taskCount}
                  size="small"
                  sx={{
                    height: collapsed ? "14px" : "18px",
                    fontSize: collapsed ? "8px" : "10px",
                    fontWeight: 500,
                    backgroundColor:
                      location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path
                        ? "#f8fafc"
                        : "#e2e8f0", // lighter when active, blueish-grayish when inactive
                    color: "#475569", // darker text for contrast
                    borderRadius: collapsed ? "7px" : "9px",
                    minWidth: collapsed ? "14px" : "18px", // ensure minimum width
                    maxWidth: collapsed ? "28px" : "36px", // cap maximum width
                    "& .MuiChip-label": {
                      px: collapsed ? "4px" : "6px",
                      py: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                    ml: "auto",
                    position: collapsed ? "absolute" : "static",
                    top: collapsed ? "6px" : "auto",
                    right: collapsed ? "4px" : "auto",
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        ))}

        {/* Items of the menu */}
        {menuGroups.map((group) => (
          <React.Fragment key={group.name}>
            {/* Group header */}
            <Typography
              variant="overline"
              sx={{
                px: theme.spacing(4),
                pt: theme.spacing(6), // Even more space above (increased from 4 to 6)
                pb: theme.spacing(2),
                mt: theme.spacing(4), // Same extra space for all groups
                color: theme.palette.text.disabled,
                fontSize: "7px", // Further reduced from 8px to 7px
                fontWeight: 400, // Changed from 600 to 400 (lighter)
                letterSpacing: "0.3px", // Reduced from 1px to 0.3px for tighter spacing
                textTransform: "uppercase",
                display: "block",
                opacity: 0.7, // Make it even lighter
              }}
            >
              {group.name}
            </Typography>

            {/* Group items */}
            {group.items.map((item) => (
              <Tooltip
                sx={{ fontSize: 13 }}
                key={item.path}
                placement="right"
                title={collapsed ? item.name : ""}
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: "offset",
                        options: {
                          offset: [0, -16],
                        },
                      },
                    ],
                  },
                }}
                disableInteractive
              >
                <ListItemButton
                  disableRipple={
                    theme.components?.MuiListItemButton?.defaultProps
                      ?.disableRipple
                  }
                  className={
                    location.pathname === item.path ||
                    item.highlightPaths?.some((p: string) =>
                      location.pathname.startsWith(p)
                    ) ||
                    customMenuHandler() === item.path
                      ? "selected-path"
                      : "unselected"
                  }
                  onClick={() => navigate(`${item.path}`)}
                  sx={{
                    height: "32px",
                    gap: theme.spacing(4),
                    borderRadius: theme.shape.borderRadius,
                    px: theme.spacing(4),
                    background:
                      location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path
                        ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                        : "transparent",
                    border:
                      location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path
                        ? "1px solid #D8D8D8"
                        : "1px solid transparent",

                    "&:hover": {
                      background:
                        location.pathname === item.path ||
                        item.highlightPaths?.some((p: string) =>
                          location.pathname.startsWith(p)
                        ) ||
                        customMenuHandler() === item.path
                          ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                          : "#F9F9F9",
                      border:
                        location.pathname === item.path ||
                        item.highlightPaths?.some((p: string) =>
                          location.pathname.startsWith(p)
                        ) ||
                        customMenuHandler() === item.path
                          ? "1px solid #D8D8D8"
                          : "1px solid transparent",
                    },
                    "&:hover svg": {
                      color: "#13715B !important",
                      stroke: "#13715B !important",
                    },
                    "&:hover svg path": {
                      stroke: "#13715B !important",
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
                        color:
                          location.pathname === item.path ||
                          item.highlightPaths?.some((p: string) =>
                            location.pathname.startsWith(p)
                          ) ||
                          customMenuHandler() === item.path
                            ? "#13715B !important"
                            : `${theme.palette.text.tertiary} !important`,
                        stroke:
                          location.pathname === item.path ||
                          item.highlightPaths?.some((p: string) =>
                            location.pathname.startsWith(p)
                          ) ||
                          customMenuHandler() === item.path
                            ? "#13715B !important"
                            : `${theme.palette.text.tertiary} !important`,
                        transition: "color 0.2s ease, stroke 0.2s ease",
                      },
                      "& svg path": {
                        stroke:
                          location.pathname === item.path ||
                          item.highlightPaths?.some((p: string) =>
                            location.pathname.startsWith(p)
                          ) ||
                          customMenuHandler() === item.path
                            ? "#13715B !important"
                            : `${theme.palette.text.tertiary} !important`,
                      },
                      "&:hover svg": {
                        color: "#13715B !important",
                        stroke: "#13715B !important",
                      },
                      "&:hover svg path": {
                        stroke: "#13715B !important",
                      },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    sx={{
                      "& .MuiListItemText-primary": {
                        fontSize: "13px",
                      },
                    }}
                  >
                    {item.name}
                  </ListItemText>
                </ListItemButton>
              </Tooltip>
            ))}
          </React.Fragment>
        ))}
      </List>
      <Divider sx={{ my: theme.spacing(4) }} />
      {/* Management Section */}
      <List
        component={"nav"}
        aria-labelledby="nested-management-subheader"
        sx={{
          px: theme.spacing(8),
          flexShrink: 0,
        }}
      >
        {/* Management Dropdown Button */}
        <Tooltip
          sx={{ fontSize: 13 }}
          placement="right"
          title={collapsed ? "Management" : ""}
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: "offset",
                  options: {
                    offset: [0, -16],
                  },
                },
              ],
            },
          }}
          disableInteractive
        >
          <ListItemButton
            disableRipple={
              theme.components?.MuiListItemButton?.defaultProps?.disableRipple
            }
            onClick={(event) => setManagementAnchorEl(event.currentTarget)}
            sx={{
              height: "32px",
              gap: theme.spacing(4),
              borderRadius: theme.shape.borderRadius,
              px: theme.spacing(4),
              background: managementItems.some(item => location.pathname.includes(item.path))
                ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                : "transparent",
              border: managementItems.some(item => location.pathname.includes(item.path))
                ? "1px solid #D8D8D8"
                : "1px solid transparent",
              "&:hover": {
                background: managementItems.some(item => location.pathname.includes(item.path))
                  ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                  : "#F9F9F9",
                border: managementItems.some(item => location.pathname.includes(item.path))
                  ? "1px solid #D8D8D8"
                  : "1px solid transparent",
              },
              "&:hover svg": {
                color: "#13715B !important",
                stroke: "#13715B !important",
              },
              "&:hover svg path": {
                stroke: "#13715B !important",
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
                  color: managementItems.some(item => location.pathname.includes(item.path))
                    ? "#13715B !important"
                    : `${theme.palette.text.tertiary} !important`,
                  stroke: managementItems.some(item => location.pathname.includes(item.path))
                    ? "#13715B !important"
                    : `${theme.palette.text.tertiary} !important`,
                  transition: "color 0.2s ease, stroke 0.2s ease",
                },
                "& svg path": {
                  stroke: managementItems.some(item => location.pathname.includes(item.path))
                    ? "#13715B !important"
                    : `${theme.palette.text.tertiary} !important`,
                },
                "&:hover svg": {
                  color: "#13715B !important",
                  stroke: "#13715B !important",
                },
                "&:hover svg path": {
                  stroke: "#13715B !important",
                },
              }}
            >
              <FolderCog size={16} strokeWidth={1.5} />
            </ListItemIcon>
            <ListItemText
              sx={{
                "& .MuiListItemText-primary": {
                  fontSize: "13px",
                },
              }}
            >
              Management
            </ListItemText>
            <ChevronDown
              size={16}
              strokeWidth={1.5}
              style={{
                transform: managementAnchorEl ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </ListItemButton>
        </Tooltip>

        {/* Management Dropdown Menu */}
        <Menu
          anchorEl={managementAnchorEl}
          open={Boolean(managementAnchorEl)}
          onClose={() => setManagementAnchorEl(null)}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          slotProps={{
            paper: {
              sx: {
                width: managementAnchorEl ? managementAnchorEl.offsetWidth : "auto",
                borderRadius: theme.shape.borderRadius,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: `1px solid ${theme.palette.divider}`,
                mt: -1,
              },
            },
          }}
        >
          {managementItems.map((item) => (
            <MenuItem
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setManagementAnchorEl(null);
              }}
              sx={{
                display: "flex",
                gap: theme.spacing(4),
                px: theme.spacing(4),
                py: 0,
                height: "32px",
                fontSize: "13px",
                borderRadius: theme.shape.borderRadius,
                "&:hover": {
                  backgroundColor: "#F9F9F9",
                },
                "&:hover svg": {
                  color: "#13715B !important",
                  stroke: "#13715B !important",
                },
                "&:hover svg path": {
                  stroke: "#13715B !important",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "16px",
                    height: "16px",
                    flexShrink: 0,
                    "& svg": {
                      color: location.pathname.includes(item.path)
                        ? "#13715B !important"
                        : `${theme.palette.text.tertiary} !important`,
                      stroke: location.pathname.includes(item.path)
                        ? "#13715B !important"
                        : `${theme.palette.text.tertiary} !important`,
                      transition: "color 0.2s ease, stroke 0.2s ease",
                    },
                    "& svg path": {
                      stroke: location.pathname.includes(item.path)
                        ? "#13715B !important"
                        : `${theme.palette.text.tertiary} !important`,
                    },
                  }}
                >
                  {item.icon}
                </Box>
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: theme.palette.text.secondary,
                  }}
                >
                  {item.name}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </List>
      {!collapsed && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <ReadyToSubscribeBox />
        </Box>
      )}
      <Divider sx={{ mt: "auto" }} />
      <Stack
        direction="row"
        height="50px"
        alignItems="center"
        py={theme.spacing(4)}
        px={theme.spacing(8)}
        gap={theme.spacing(2)}
        borderRadius={theme.shape.borderRadius}
        sx={{ flexShrink: 0 }}
      >
        {collapsed ? (
          <>
            <Tooltip
              sx={{ fontSize: 13 }}
              title="Options"
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      name: "offset",
                      options: {
                        offset: [0, -10],
                      },
                    },
                  ],
                },
              }}
              disableInteractive
            >
              <IconButton
                onClick={openPopup}
                sx={{
                  p: 0,
                  "&:focus": { outline: "none" },
                  justifyContent: "center",
                  alignItems: "center",
                  marginLeft: theme.spacing(3),
                }}
              >
                <Avatar
                  user={userAvator}
                  size="small"
                  sx={{ margin: "auto" }}
                />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            {/* <Avatar small={true} /> */}
            <Box ml={theme.spacing(2)}>
              <Typography component="span" fontWeight={500}>
                {user.name} {user.surname}
              </Typography>
              <Typography sx={{ textTransform: "capitalize" }}>
                {ROLES[user.roleId as keyof typeof ROLES]}
              </Typography>
            </Box>
            <IconButton
              disableRipple={
                theme.components?.MuiIconButton?.defaultProps?.disableRipple
              }
              sx={{
                ml: "auto",
                mr: "-8px",
                "&:focus": { outline: "none" },
                "& svg": {
                  width: "20px",
                  height: "20px",
                },
                "& svg path": {
                  stroke: theme.palette.other.icon,
                },
              }}
              onClick={openPopup}
            >
              <MoreVertical size={16} strokeWidth={1.5} />
            </IconButton>
          </>
        )}
        <Drawer
          anchor="bottom"
          open={slideoverOpen}
          onClose={closePopup}
          hideBackdrop={true}
          transitionDuration={0}
          PaperProps={{
            sx: {
              width: collapsed ? "180px" : "220px", // Slightly smaller than sidebar to fit within
              height: "auto", // Let height adjust to content
              maxHeight: "fit-content",
              position: "absolute",
              bottom: "80px", // Position closer to the 3-dot button
              left: collapsed ? "30px" : "30px", // Center within sidebar with some margin
              borderRadius: "4px",
              boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: "transparent",
              transition: "none",
            },
          }}
        >
          <Box
            ref={drawerRef}
            sx={{
              backgroundColor: theme.palette.background.main,
              borderRadius: "4px",
              border: `1px solid ${theme.palette.divider}`,
              p: 1.5,
              animation: slideoverOpen ? "fadeIn 0.2s ease-in-out" : "none",
              "@keyframes fadeIn": {
                "0%": {
                  opacity: 0,
                },
                "100%": {
                  opacity: 1,
                },
              },
            }}
          >
            {collapsed && (
              <Box
                sx={{
                  mb: 1.5,
                  pb: 1,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography component="span" fontWeight={500} fontSize="13px">
                  {user.name} {user.surname}
                </Typography>
                <Typography
                  sx={{
                    textTransform: "capitalize",
                    fontSize: "13px",
                    color: theme.palette.text.secondary,
                  }}
                >
                  {ROLES[user.roleId as keyof typeof ROLES]}
                </Typography>
              </Box>
            )}

            <Stack spacing={0.5}>
              <ListItemButton
                onClick={() => {
                  window.open(
                    "https://verifywise.ai/contact",
                    "_blank",
                    "noreferrer"
                  );
                  closePopup();
                }}
                sx={{
                  gap: theme.spacing(3),
                  borderRadius: theme.shape.borderRadius,
                  px: theme.spacing(2),
                  py: theme.spacing(1.5),
                  "& svg": {
                    width: "16px",
                    height: "16px",
                  },
                  "& svg path": {
                    stroke: theme.palette.other.icon,
                  },
                  "&:hover svg": {
                    color: "#13715B !important",
                    stroke: "#13715B !important",
                  },
                  "&:hover svg path": {
                    stroke: "#13715B !important",
                  },
                  fontSize: "13px",
                }}
              >
                <MessageCircle size={16} strokeWidth={1.5} />
                <Typography sx={{ fontSize: "13px" }}>Feedback</Typography>
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  window.open(
                    "https://discord.gg/d3k3E4uEpR",
                    "_blank",
                    "noreferrer"
                  );
                  closePopup();
                }}
                sx={{
                  gap: theme.spacing(3),
                  borderRadius: theme.shape.borderRadius,
                  px: theme.spacing(2),
                  py: theme.spacing(1.5),
                  "& svg": {
                    width: "16px",
                    height: "16px",
                  },
                  "& svg path": {
                    stroke: theme.palette.other.icon,
                  },
                  "&:hover svg": {
                    color: "#13715B !important",
                    stroke: "#13715B !important",
                  },
                  "&:hover svg path": {
                    stroke: "#13715B !important",
                  },
                  fontSize: "13px",
                }}
              >
                <MessageSquare size={16} strokeWidth={1.5} />
                <Typography sx={{ fontSize: "13px" }}>
                  Ask on Discord
                </Typography>
              </ListItemButton>

              <ListItemButton
                onClick={logout}
                sx={{
                  gap: theme.spacing(3),
                  borderRadius: theme.shape.borderRadius,
                  px: theme.spacing(2),
                  py: theme.spacing(1.5),
                  "& svg": {
                    width: "16px",
                    height: "16px",
                  },
                  "& svg path": {
                    stroke: theme.palette.other.icon,
                  },
                  "&:hover svg": {
                    color: "#13715B !important",
                    stroke: "#13715B !important",
                  },
                  "&:hover svg path": {
                    stroke: "#13715B !important",
                  },
                  fontSize: "13px",
                }}
              >
                <LogOut size={16} strokeWidth={1.5} />
                <Typography sx={{ fontSize: "13px" }}>Log out</Typography>
              </ListItemButton>
            </Stack>
          </Box>
        </Drawer>
      </Stack>
    </Stack>
  );
};

export default Sidebar;
