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
  Grid,
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
  Brain,
  Shield,
  GraduationCap,
  Telescope,
  List as ListIcon,
  FolderTree,
  Layers,
  AlertCircle,
  FolderCog,
  Database,
  Heart,
  User as UserIcon,
  HelpCircle,
  Newspaper,
  Users,
  Headphones,
  Trash2,
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
import FlyingHearts from "../FlyingHearts";
import { useOnboarding } from "../../../application/hooks/useOnboarding";
import { RotateCcw } from "lucide-react";

const getMenuGroups = (): IMenuGroup[] => [
  {
    name: "DISCOVERY",
    items: [
      {
        name: "Use Cases",
        icon: <FolderTree size={16} strokeWidth={1.5} />,
        path: "/overview",
        highlightPaths: ["/project-view"],
      },
      {
        name: "Organizational View",
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

const getManagementItems = (
  hasDemoData: boolean,
  onOpenCreateDemoData?: () => void,
  onOpenDeleteDemoData?: () => void
): IMenuItem[] => [
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
  ...(hasDemoData
    ? [
        {
          name: "Delete demo data",
          icon: <Database size={16} strokeWidth={1.5} />,
          action: onOpenDeleteDemoData,
        },
      ]
    : [
        {
          name: "Create demo data",
          icon: <Database size={16} strokeWidth={1.5} />,
          action: onOpenCreateDemoData,
        },
      ]),
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

interface SidebarProps {
  onOpenCreateDemoData?: () => void;
  onOpenDeleteDemoData?: () => void;
  hasDemoData?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onOpenCreateDemoData,
  onOpenDeleteDemoData,
  hasDemoData = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [managementAnchorEl, setManagementAnchorEl] =
    useState<null | HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();
  const { resetOnboarding } = useOnboarding();

  // Heart icon state
  const [showHeartIcon, setShowHeartIcon] = useState(false);
  const [showFlyingHearts, setShowFlyingHearts] = useState(false);
  const [heartReturning, setHeartReturning] = useState(false);
  const heartTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Handle logo hover to show heart icon
  const handleLogoHover = () => {
    setShowHeartIcon(true);
    setHeartReturning(false); // Reset returning state

    // Clear existing timer
    if (heartTimerRef.current) {
      clearTimeout(heartTimerRef.current);
    }

    // Set new timer to animate return after 5 seconds
    heartTimerRef.current = setTimeout(() => {
      setHeartReturning(true);

      // Hide heart after return animation completes (500ms)
      setTimeout(() => {
        setShowHeartIcon(false);
        setHeartReturning(false);
      }, 500);
    }, 5000);
  };

  // Handle heart icon click
  const handleHeartClick = () => {
    setShowFlyingHearts(true);

    // Start return animation after a brief delay
    setTimeout(() => {
      setHeartReturning(true);

      // Hide heart after return animation completes (500ms)
      setTimeout(() => {
        setShowHeartIcon(false);
        setHeartReturning(false);
      }, 500);
    }, 1500);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (heartTimerRef.current) {
        clearTimeout(heartTimerRef.current);
      }
    };
  }, []);

  return (
    <Stack
      component="aside"
      className={`sidebar-menu ${collapsed ? "collapsed" : "expanded"}`}
      py={theme.spacing(6)}
      gap={theme.spacing(2)}
      sx={{
        height: "100vh",
        border: 1,
        borderColor: theme.palette.border.dark,
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
        sx={{ position: "relative" }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={theme.spacing(4)}
          className="app-title"
        >
          <Box onMouseEnter={handleLogoHover} sx={{ position: "relative" }}>
            {/* Heart Icon - Rises behind and appears above logo */}
            {showHeartIcon && (
              <Tooltip title="Spread some love!">
                <IconButton
                  onClick={handleHeartClick}
                  sx={{
                    position: "absolute",
                    top: "-20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: 0,
                    zIndex: 10,
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                    animation: heartReturning
                      ? "slideDownBehind 0.5s ease-in forwards"
                      : "slideUpFromBehind 0.5s ease-out",
                    "@keyframes slideUpFromBehind": {
                      "0%": {
                        opacity: 0,
                        transform: "translateX(-50%) translateY(35px)",
                        zIndex: -1,
                      },
                      "60%": {
                        zIndex: -1,
                      },
                      "70%": {
                        opacity: 1,
                        zIndex: 10,
                      },
                      "100%": {
                        opacity: 1,
                        transform: "translateX(-50%) translateY(0)",
                        zIndex: 10,
                      },
                    },
                    "@keyframes slideDownBehind": {
                      "0%": {
                        opacity: 1,
                        transform: "translateX(-50%) translateY(0)",
                        zIndex: 10,
                      },
                      "30%": {
                        opacity: 0.7,
                        zIndex: 10,
                      },
                      "40%": {
                        zIndex: -1,
                      },
                      "100%": {
                        opacity: 0,
                        transform: "translateX(-50%) translateY(35px)",
                        zIndex: -1,
                      },
                    },
                  }}
                >
                  <Heart
                    size={18}
                    color="#FF1493"
                    strokeWidth={1.5}
                    fill="#FF1493"
                  />
                </IconButton>
              </Tooltip>
            )}
            <RouterLink to="/">
              <img
                src={Logo}
                alt="Logo"
                width={32}
                height={30}
                style={{ position: "relative", zIndex: 1 }}
              />
            </RouterLink>
          </Box>
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
              <span
                style={{
                  fontSize: "10px",
                  marginLeft: "6px",
                  opacity: 0.6,
                  fontWeight: 400,
                  // position: "relative",
                  // top: "5px",
                }}
              >
                {__APP_VERSION__}
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
                      customMenuHandler() === item.path ||
                      location.pathname.startsWith(`${item.path}/`)
                        ? "#13715B !important"
                        : `${theme.palette.text.tertiary} !important`,
                    stroke:
                      location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path ||
                      location.pathname.startsWith(`${item.path}/`)
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
                      customMenuHandler() === item.path ||
                      location.pathname.startsWith(`${item.path}/`)
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
                      customMenuHandler() === item.path ||
                      location.pathname.startsWith(`${item.path}/`)
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
                    customMenuHandler() === item.path ||
                    location.pathname.startsWith(`${item.path}/`)
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
                      customMenuHandler() === item.path ||
                      location.pathname.startsWith(`${item.path}/`)
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
                        customMenuHandler() === item.path ||
                        location.pathname.startsWith(`${item.path}/`)
                          ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                          : "#F9F9F9",
                      border:
                        location.pathname === item.path ||
                        item.highlightPaths?.some((p: string) =>
                          location.pathname.startsWith(p)
                        ) ||
                        customMenuHandler() === item.path ||
                        location.pathname.startsWith(`${item.path}/`)
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
                          customMenuHandler() === item.path ||
                          location.pathname.startsWith(`${item.path}/`)
                            ? "#13715B !important"
                            : `${theme.palette.text.tertiary} !important`,
                        stroke:
                          location.pathname === item.path ||
                          item.highlightPaths?.some((p: string) =>
                            location.pathname.startsWith(p)
                          ) ||
                          customMenuHandler() === item.path ||
                          location.pathname.startsWith(`${item.path}/`)
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
                          customMenuHandler() === item.path ||
                          location.pathname.startsWith(`${item.path}/`)
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
              background: getManagementItems(
                hasDemoData,
                onOpenCreateDemoData,
                onOpenDeleteDemoData
              ).some(
                (item) =>
                  location.pathname.startsWith(`${item.path}/`) ||
                  location.pathname === item.path
              )
                ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                : "transparent",
              border: getManagementItems(
                hasDemoData,
                onOpenCreateDemoData,
                onOpenDeleteDemoData
              ).some(
                (item) =>
                  location.pathname.startsWith(`${item.path}/`) ||
                  location.pathname === item.path
              )
                ? "1px solid #D8D8D8"
                : "1px solid transparent",
              "&:hover": {
                background: getManagementItems(
                  hasDemoData,
                  onOpenCreateDemoData,
                  onOpenDeleteDemoData
                ).some(
                  (item) =>
                    location.pathname.startsWith(`${item.path}/`) ||
                    location.pathname === item.path
                )
                  ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                  : "#F9F9F9",
                border: getManagementItems(
                  hasDemoData,
                  onOpenCreateDemoData,
                  onOpenDeleteDemoData
                ).some(
                  (item) =>
                    location.pathname.startsWith(`${item.path}/`) ||
                    location.pathname === item.path
                )
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
                  color: getManagementItems(
                    hasDemoData,
                    onOpenCreateDemoData,
                    onOpenDeleteDemoData
                  ).some(
                    (item) => item.path && location.pathname.includes(item.path)
                  )
                    ? "#13715B !important"
                    : `${theme.palette.text.tertiary} !important`,
                  stroke: getManagementItems(
                    hasDemoData,
                    onOpenCreateDemoData,
                    onOpenDeleteDemoData
                  ).some(
                    (item) => item.path && location.pathname.includes(item.path)
                  )
                    ? "#13715B !important"
                    : `${theme.palette.text.tertiary} !important`,
                  transition: "color 0.2s ease, stroke 0.2s ease",
                },
                "& svg path": {
                  stroke: getManagementItems(
                    hasDemoData,
                    onOpenCreateDemoData,
                    onOpenDeleteDemoData
                  ).some(
                    (item) => item.path && location.pathname.includes(item.path)
                  )
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
                transform: managementAnchorEl
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
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
            horizontal: collapsed ? "right" : "left",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: collapsed ? "left" : "left",
          }}
          slotProps={{
            paper: {
              sx: {
                width: managementAnchorEl
                  ? managementAnchorEl.offsetWidth
                  : "auto",
                minWidth: collapsed ? "180px" : "auto",
                borderRadius: theme.shape.borderRadius,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: `1px solid ${theme.palette.divider}`,
                mt: -1,
              },
            },
          }}
        >
          {getManagementItems(
            hasDemoData,
            onOpenCreateDemoData,
            onOpenDeleteDemoData
          ).map((item) => (
            <MenuItem
              key={item.path || item.name}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.path) {
                  navigate(item.path);
                }
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
                      color:
                        item.path && location.pathname.includes(item.path)
                          ? "#13715B !important"
                          : `${theme.palette.text.tertiary} !important`,
                      stroke:
                        item.path && location.pathname.includes(item.path)
                          ? "#13715B !important"
                          : `${theme.palette.text.tertiary} !important`,
                      transition: "color 0.2s ease, stroke 0.2s ease",
                    },
                    "& svg path": {
                      stroke:
                        item.path && location.pathname.includes(item.path)
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
            <Avatar
              user={userAvator}
              size="small"
              sx={{ ml: theme.spacing(2) }}
            />
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
              width: collapsed ? "260px" : "300px", // Single column width
              height: "auto",
              maxHeight: "fit-content",
              position: "absolute",
              bottom: "80px",
              left: collapsed ? "30px" : "30px",
              borderRadius: "8px",
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
              borderRadius: "8px",
              border: `1px solid ${theme.palette.divider}`,
              overflow: "hidden",
              p: 1, // 8px padding around entire content
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
            {/* Single Column Layout */}
            <Stack spacing={2}>
              {/* Account Section */}
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: theme.palette.text.disabled,
                    letterSpacing: "0.5px",
                    px: theme.spacing(4),
                    pb: 1,
                  }}
                >
                  ACCOUNT
                </Typography>

                <Stack spacing={1}>
                  {/* My Profile */}
                  <ListItemButton
                    onClick={() => {
                      navigate("/settings");
                      closePopup();
                    }}
                    sx={{
                      minHeight: "48px",
                      gap: theme.spacing(4),
                      borderRadius: theme.shape.borderRadius,
                      px: theme.spacing(4),
                      py: 1,
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
                      },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                          {user.name} {user.surname}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "11px",
                            color: theme.palette.text.secondary,
                            textTransform: "capitalize",
                          }}
                        >
                          {ROLES[user.roleId as keyof typeof ROLES]}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "11px",
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {user.email}
                      </Typography>
                    </Box>
                  </ListItemButton>

                  {/* Create Demo Data / Delete Demo Data */}
                  {hasDemoData ? (
                    <ListItemButton
                      onClick={() => {
                        if (onOpenDeleteDemoData) {
                          onOpenDeleteDemoData();
                        }
                        closePopup();
                      }}
                      sx={{
                        height: "32px",
                        gap: theme.spacing(4),
                        borderRadius: theme.shape.borderRadius,
                        px: theme.spacing(4),
                        "& svg": {
                          color: theme.palette.text.tertiary,
                          stroke: theme.palette.text.tertiary,
                        },
                        "&:hover": {
                          backgroundColor: "#F9FAFB",
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
                      <Trash2 size={16} strokeWidth={1.5} />
                      <Typography sx={{ fontSize: "13px" }}>
                        Delete demo data
                      </Typography>
                    </ListItemButton>
                  ) : (
                    <ListItemButton
                      onClick={() => {
                        if (onOpenCreateDemoData) {
                          onOpenCreateDemoData();
                        }
                        closePopup();
                      }}
                      sx={{
                        height: "32px",
                        gap: theme.spacing(4),
                        borderRadius: theme.shape.borderRadius,
                        px: theme.spacing(4),
                        "& svg": {
                          color: theme.palette.text.tertiary,
                          stroke: theme.palette.text.tertiary,
                        },
                        "&:hover": {
                          backgroundColor: "#F9FAFB",
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
                      <Database size={16} strokeWidth={1.5} />
                      <Typography sx={{ fontSize: "13px" }}>
                        Create demo data
                      </Typography>
                    </ListItemButton>
                  )}
                </Stack>
              </Box>

              {/* Explore VerifyWise Section */}
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: theme.palette.text.disabled,
                    letterSpacing: "0.5px",
                    px: theme.spacing(4),
                    pb: 1,
                  }}
                >
                  EXPLORE VERIFYWISE
                </Typography>

                <Stack spacing={1}>
                  {/* Help Center */}
                  <ListItemButton
                    onClick={() => {
                      window.open(
                        "https://docs.verifywise.ai",
                        "_blank",
                        "noreferrer"
                      );
                      closePopup();
                    }}
                    sx={{
                      height: "32px",
                      gap: theme.spacing(4),
                      borderRadius: theme.shape.borderRadius,
                      px: theme.spacing(4),
                      "& svg": {
                        color: theme.palette.text.tertiary,
                        stroke: theme.palette.text.tertiary,
                      },
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
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
                    <HelpCircle size={16} strokeWidth={1.5} />
                    <Typography sx={{ fontSize: "13px" }}>
                      Help center
                    </Typography>
                  </ListItemButton>

                  {/* What's New */}
                  <ListItemButton
                    onClick={() => {
                      window.open(
                        "https://verifywise.ai/blog",
                        "_blank",
                        "noreferrer"
                      );
                      closePopup();
                    }}
                    sx={{
                      height: "32px",
                      gap: theme.spacing(4),
                      borderRadius: theme.shape.borderRadius,
                      px: theme.spacing(4),
                      "& svg": {
                        color: theme.palette.text.tertiary,
                        stroke: theme.palette.text.tertiary,
                      },
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
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
                    <Newspaper size={16} strokeWidth={1.5} />
                    <Typography sx={{ fontSize: "13px" }}>
                      What's new?
                    </Typography>
                  </ListItemButton>

                  {/* User Community */}
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
                      height: "32px",
                      gap: theme.spacing(4),
                      borderRadius: theme.shape.borderRadius,
                      px: theme.spacing(4),
                      "& svg": {
                        color: theme.palette.text.tertiary,
                        stroke: theme.palette.text.tertiary,
                      },
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
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
                    <Users size={16} strokeWidth={1.5} />
                    <Typography sx={{ fontSize: "13px" }}>
                      User community
                    </Typography>
                  </ListItemButton>

                  {/* Get Support */}
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
                      height: "32px",
                      gap: theme.spacing(4),
                      borderRadius: theme.shape.borderRadius,
                      px: theme.spacing(4),
                      "& svg": {
                        color: theme.palette.text.tertiary,
                        stroke: theme.palette.text.tertiary,
                      },
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
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
                    <Headphones size={16} strokeWidth={1.5} />
                    <Typography sx={{ fontSize: "13px" }}>
                      Get support
                    </Typography>
                  </ListItemButton>

                  {/* Give Feedback */}
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
                      height: "32px",
                      gap: theme.spacing(4),
                      borderRadius: theme.shape.borderRadius,
                      px: theme.spacing(4),
                      "& svg": {
                        color: theme.palette.text.tertiary,
                        stroke: theme.palette.text.tertiary,
                      },
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
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
                    <MessageCircle size={16} strokeWidth={1.5} />
                    <Typography sx={{ fontSize: "13px" }}>
                      Give feedback
                    </Typography>
                  </ListItemButton>
                </Stack>
              </Box>

              {/* Divider */}
              <Divider sx={{ my: 1 }} />

              {/* Logout */}
              <ListItemButton
                onClick={logout}
                sx={{
                  height: "32px",
                  gap: theme.spacing(4),
                  borderRadius: theme.shape.borderRadius,
                  px: theme.spacing(4),
                  "& svg": {
                    color: theme.palette.text.tertiary,
                    stroke: theme.palette.text.tertiary,
                  },
                  "&:hover": {
                    backgroundColor: "#F9FAFB",
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
                <LogOut size={16} strokeWidth={1.5} />
                <Typography sx={{ fontSize: "13px" }}>Logout</Typography>
              </ListItemButton>
            </Stack>
          </Box>
        </Drawer>
      </Stack>

      {/* Flying Hearts Animation */}
      {showFlyingHearts && (
        <FlyingHearts onComplete={() => setShowFlyingHearts(false)} />
      )}
    </Stack>
  );
};

export default Sidebar;
