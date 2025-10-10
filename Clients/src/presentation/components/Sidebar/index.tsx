import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  Chip,
} from "@mui/material";
import "./index.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { useTheme } from "@mui/material";
import React, { useContext, useState, useEffect } from "react";
import { toggleSidebar } from "../../../application/redux/ui/uiSlice";

// Lucide Icons
import {
  ChevronLeft,
  ChevronRight,
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

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  highlightPaths?: string[];
  taskCount?: number;
}

interface MenuGroup {
  name: string;
  items: MenuItem[];
}

const getMenuGroups = (): MenuGroup[] => [
  {
    name: "DISCOVERY",
    items: [
      {
        name: "Project oriented view",
        icon: <FolderTree size={16} strokeWidth={1.5} />,
        path: "/overview",
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
        name: "Event Tracker",
        icon: <Telescope size={16} strokeWidth={1.5} />,
        path: "/event-tracker",
      },
    ],
  },
];

const topItems = (openTasksCount: number): MenuItem[] => [
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

const other: MenuItem[] = [
  {
    name: "Settings",
    icon: <Settings size={16} strokeWidth={1.5} />,
    path: "/setting",
  },
];

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
  const [anchorEl, setAnchorEl] = useState(null);
  const [popup, setPopup] = useState();
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

  const openPopup = (event: any, id: any) => {
    setAnchorEl(event.currentTarget);
    setPopup(id);
  };

  const closePopup = () => {
    setAnchorEl(null);
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
        {collapsed ? <ChevronRight size={16} strokeWidth={1.5} /> : <ChevronLeft size={16} strokeWidth={1.5} />}
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
                backgroundColor:
                  location.pathname === item.path ||
                  item.highlightPaths?.some((p: string) =>
                    location.pathname.startsWith(p)
                  ) ||
                  customMenuHandler() === item.path
                    ? "#E8E8E8" // darker highlight background
                    : "transparent",

                "&:hover": {
                  backgroundColor:
                    location.pathname === item.path ||
                    item.highlightPaths?.some((p: string) =>
                      location.pathname.startsWith(p)
                    ) ||
                    customMenuHandler() === item.path
                      ? "#E8E8E8" // keep same color if already selected
                      : "#F9F9F9", // hover color only if not selected
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
                    color: location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path
                        ? "#13715B !important"
                        : `${theme.palette.text.tertiary} !important`,
                    stroke: location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path
                        ? "#13715B !important"
                        : `${theme.palette.text.tertiary} !important`,
                    transition: "color 0.2s ease, stroke 0.2s ease",
                  },
                  "& svg path": {
                    stroke: location.pathname === item.path ||
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
                    backgroundColor: (
                      location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path
                    ) ? "#f8fafc" : "#e2e8f0", // lighter when active, blueish-grayish when inactive
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
                    backgroundColor:
                      location.pathname === item.path ||
                      item.highlightPaths?.some((p: string) =>
                        location.pathname.startsWith(p)
                      ) ||
                      customMenuHandler() === item.path
                        ? "#E8E8E8" // darker highlight background
                        : "transparent",

                    "&:hover": {
                      backgroundColor:
                        location.pathname === item.path ||
                        item.highlightPaths?.some((p: string) =>
                          location.pathname.startsWith(p)
                        ) ||
                        customMenuHandler() === item.path
                          ? "#E8E8E8" // keep same color if already selected
                          : "#F9F9F9", // hover color only if not selected
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
                        color: location.pathname === item.path ||
                          item.highlightPaths?.some((p: string) =>
                            location.pathname.startsWith(p)
                          ) ||
                          customMenuHandler() === item.path
                            ? "#13715B !important"
                            : `${theme.palette.text.tertiary} !important`,
                        stroke: location.pathname === item.path ||
                          item.highlightPaths?.some((p: string) =>
                            location.pathname.startsWith(p)
                          ) ||
                          customMenuHandler() === item.path
                            ? "#13715B !important"
                            : `${theme.palette.text.tertiary} !important`,
                        transition: "color 0.2s ease, stroke 0.2s ease",
                      },
                      "& svg path": {
                        stroke: location.pathname === item.path ||
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
      {/* other */}
      <List
        component={"nav"}
        aria-labelledby="nested-other-subheader"
        sx={{
          px: theme.spacing(8),
          flexShrink: 0,
        }}
      >
        {other.map((item) => (
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
                location.pathname.includes(item.path) ? "selected-path" : ""
              }
              onClick={() => {
                if (item.name === "Feedback" || item.name.includes("Discord")) {
                  window.open(item.path, "_blank", "noreferrer");
                } else {
                  navigate(`${item.path}`);
                }
              }}
              sx={{
                height: "32px",
                gap: theme.spacing(4),
                borderRadius: theme.shape.borderRadius,
                px: theme.spacing(4),
                backgroundColor:
                  location.pathname === item.path ? "#E8E8E8" : "transparent",

                "&:hover": {
                  backgroundColor:
                    location.pathname === item.path
                      ? "#E8E8E8" // keep same color if already selected
                      : "#F9F9F9", // hover color only if not selected
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
                onClick={(event) => openPopup(event, "logout")}
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
            <Tooltip title="Controls" disableInteractive sx={{ fontSize: 13 }}>
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
                onClick={(event) => openPopup(event, "logout")}
              >
                <MoreVertical size={16} strokeWidth={1.5} />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Menu
          className="sidebar-popup"
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && popup === "logout"}
          onClose={closePopup}
          disableScrollLock
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          slotProps={{
            paper: {
              sx: {
                marginTop: theme.spacing(-4),
                marginLeft: collapsed ? theme.spacing(2) : 0,
                fontSize: 13,
              },
            },
          }}
          MenuListProps={{
            sx: {
              p: 2,
              "& li": { m: 0 },
              "& li:has(.MuiBox-root):hover": {
                backgroundColor: "transparent",
                fontSize: 13,
              },
            },
          }}
          sx={{
            ml: theme.spacing(12),
          }}
        >
          {collapsed && (
            <MenuItem sx={{ cursor: "default", minWidth: "150px" }}>
              <Box mb={theme.spacing(2)}>
                <Typography component="span" fontWeight={500} fontSize="13px">
                  {user.name} {user.surname}
                </Typography>
                <Typography
                  sx={{ textTransform: "capitalize", fontSize: "13px" }}
                >
                  {ROLES[user.roleId as keyof typeof ROLES]}
                </Typography>
              </Box>
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              window.open(
                "https://verifywise.ai/contact",
                "_blank",
                "noreferrer"
              );
              closePopup();
            }}
            sx={{
              gap: theme.spacing(4),
              borderRadius: theme.shape.borderRadius,
              pl: theme.spacing(4),
              "& svg": {
                width: "fit-content",
                height: "fit-content",
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

              "& .MuiTouchRipple-root": {
                display: "none",
              },
            }}
          >
            <MessageCircle size={16} strokeWidth={1.5} />
            Feedback
          </MenuItem>
          <MenuItem
            onClick={() => {
              window.open(
                "https://discord.gg/d3k3E4uEpR",
                "_blank",
                "noreferrer"
              );
              closePopup();
            }}
            sx={{
              gap: theme.spacing(4),
              borderRadius: theme.shape.borderRadius,
              pl: theme.spacing(4),
              "& svg": {
                width: "fit-content",
                height: "fit-content",
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

              "& .MuiTouchRipple-root": {
                display: "none",
              },
            }}
          >
            <MessageSquare size={16} strokeWidth={1.5} />
            Ask on Discord
          </MenuItem>
          <MenuItem
            onClick={logout}
            sx={{
              gap: theme.spacing(4),
              borderRadius: theme.shape.borderRadius,
              pl: theme.spacing(4),
              "& svg": {
                width: "fit-content",
                height: "fit-content",
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

              "& .MuiTouchRipple-root": {
                display: "none",
              },
            }}
          >
            <LogOut size={16} strokeWidth={1.5} />
            Log out
          </MenuItem>
        </Menu>
      </Stack>
    </Stack>
  );
};

export default Sidebar;
