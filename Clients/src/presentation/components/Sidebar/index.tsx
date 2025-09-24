import {
  Box,
  Collapse,
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
  Badge,
} from "@mui/material";
import "./index.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { useTheme } from "@mui/material";
import React, { useContext, useState, useEffect } from "react";
import { toggleSidebar } from "../../../application/redux/ui/uiSlice";

import { ReactComponent as ArrowLeft } from "../../assets/icons/left-arrow.svg";
import { ReactComponent as ArrowRight } from "../../assets/icons/right-arrow.svg";
import { ReactComponent as Dashboard } from "../../assets/icons/dashboard.svg";
import { ReactComponent as Tasks } from "../../assets/icons/flag-grey.svg";
import { ReactComponent as DotsVertical } from "../../assets/icons/dots-vertical.svg";
import { ReactComponent as LogoutSvg } from "../../assets/icons/logout.svg";
import { ReactComponent as ReportingSvg } from "../../assets/icons/reporting.svg";
import { ReactComponent as RiskManagementIcon } from "../../assets/icons/warning-triangle.svg";

import { ReactComponent as Vendors } from "../../assets/icons/building.svg";
import { ReactComponent as Settings } from "../../assets/icons/setting.svg";
import { ReactComponent as FileManager } from "../../assets/icons/file.svg";
import { ReactComponent as FairnessIcon } from "../../assets/icons/fairness-icon.svg";
import { ReactComponent as Feedback } from "../../assets/icons/feedback.svg";
import { ReactComponent as Discord } from "../../assets/icons/discord.svg";
import { ReactComponent as AITrustCenter } from "../../assets/icons/aiTrustCenter.svg";
import { ReactComponent as Policies } from "../../assets/icons/policies.svg";

/**Adding the training register icon */
import { ReactComponent as TrainingRegister } from "../../assets/icons/training-register.svg";
import { ReactComponent as WatchTower } from "../../assets/icons/telescope.svg";
import { ReactComponent as ModelInventory } from "../../assets/icons/list.svg";

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
import { TaskStatus } from "../../../domain/interfaces/i.task";
import { getAllTasks } from "../../../application/repository/task.repository";

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  children?: Array<{
    name: string;
    path: string;
  }>;
  highlightPaths?: string[];
}

const getMenuItems = (openTasksCount: number): MenuItem[] => [
  {
    name: "Dashboard",
    icon: <Dashboard />,
    path: "/",
    children: [
      {
        name: "Project oriented view",
        path: "/overview",
      },
      {
        name: "Organizational view",
        path: "/framework",
      },
    ],
    highlightPaths: ["/project-view"],
  },
  {
    name: "Risk Management",
    icon: <RiskManagementIcon />,
    path: "/risk-management",
  },
  {
    name: "Tasks",
    icon: (
      <Badge
        badgeContent={openTasksCount > 0 ? openTasksCount : null}
        color="error"
        sx={{
          "& .MuiBadge-badge": {
            fontSize: "10px",
            minWidth: "18px",
            height: "18px",
            backgroundColor: "#ef4444",
            color: "white",
          },
        }}
      >
        <Tasks />
      </Badge>
    ),
    path: "/tasks",
  },
  {
    name: "Vendors",
    icon: <Vendors style={{}} />,
    path: "/vendors",
  },
  {
    name: "Evidences",
    icon: <FileManager />,
    path: "/file-manager",
  },
  {
    name: "Reporting",
    icon: <ReportingSvg />,
    path: "/reporting",
  },
  {
    name: "Bias & Fairness",
    icon: <FairnessIcon />,
    path: "/fairness-dashboard",
  },
  {
    name: "Training Registry",
    icon: <TrainingRegister />,
    path: "/training",
  },
  {
    name: "Policy Manager",
    icon: <Policies />,
    path: "/policies",
  },
  {
    name: "AI Trust Center",
    icon: <AITrustCenter />,
    path: "/ai-trust-center",
  },
  {
    name: "Model Inventory",
    icon: <ModelInventory />,
    path: "/model-inventory",
  },
];

const other: MenuItem[] = [
  {
    name: "Event Tracker",
    icon: <WatchTower />,
    path: "/event-tracker",
  },
  {
    name: "Settings",
    icon: <Settings />,
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

  const [open, setOpen] = useState<{ [key: string]: boolean }>({
    Dashboard: true,
    Account: false,
  });

  const [openTasksCount, setOpenTasksCount] = useState(0);

  const menu = getMenuItems(openTasksCount);

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
          setOpen({ Dashboard: true, Account: false }); // Keep Dashboard always open
          dispatch(toggleSidebar());
        }}
      >
        {collapsed ? <ArrowRight /> : <ArrowLeft />}
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
        {/* Items of the menu */}
        {menu.map((item) =>
          item.children ? (
            collapsed ? (
              <React.Fragment key={item.name}>
                <Tooltip
                  sx={{ fontSize: 13 }}
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
                      Boolean(anchorEl) && popup === item.name
                        ? "selected-path"
                        : ""
                    }
                    onClick={(event) => openPopup(event, item.name)}
                    sx={{
                      position: "relative",
                      gap: theme.spacing(4),
                      borderRadius: theme.shape.borderRadius,
                      px: theme.spacing(4),
                      backgroundColor:
                        location.pathname === item.path ||
                        location.pathname === "/overview" ||
                        location.pathname === "/framework"
                          ? "#F9F9F9"
                          : "transparent",
                      "&:hover": {
                        backgroundColor: "#F9F9F9",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        width: "32px",
                        mr: 0,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText>{item.name}</ListItemText>
                  </ListItemButton>
                </Tooltip>
                <Menu
                  className="sidebar-popup"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl) && popup === item.name}
                  onClose={closePopup}
                  disableScrollLock
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: theme.spacing(-2),
                        ml: theme.spacing(1),
                      },
                    },
                  }}
                  MenuListProps={{ sx: { px: 1, py: 2 } }}
                  sx={{
                    ml: theme.spacing(8),
                    "& .selected-path": {
                      backgroundColor: theme.palette.background.accent,
                    },
                  }}
                >
                  {item.children.map((child) => (
                    <MenuItem
                      key={child.path}
                      onClick={() => {
                        navigate(`${child.path}`);
                        closePopup();
                      }}
                      sx={{
                        gap: theme.spacing(4),
                        borderRadius: theme.shape.borderRadius,
                        pl: theme.spacing(4),
                        backgroundColor:
                          location.pathname === child.path
                            ? theme.palette.background.accent
                            : "transparent",
                        "&:hover": {
                          backgroundColor: theme.palette.background.accent,
                        },
                      }}
                    >
                      {child.name}
                    </MenuItem>
                  ))}
                </Menu>
              </React.Fragment>
            ) : (
              <React.Fragment key={item.name}>
                <ListItemButton
                  disableRipple={
                    theme.components?.MuiListItemButton?.defaultProps
                      ?.disableRipple
                  }
                  onClick={() => {
                    if (item.name === "Dashboard") {
                      // Navigate directly to the main dashboard instead of toggling
                      navigate("/");
                    } else {
                      // Keep toggle behavior for other menu items with children
                      setOpen((prev) => ({
                        ...prev,
                        [`${item.name}`]: !prev[`${item.name}`],
                      }));
                    }
                  }}
                  sx={{
                    gap: theme.spacing(4),
                    borderRadius: theme.shape.borderRadius,
                    px: theme.spacing(4),
                    backgroundColor:
                      location.pathname === item.path ||
                      location.pathname === "/overview" ||
                      location.pathname === "/framework"
                        ? "#F9F9F9"
                        : "transparent",
                    "&:hover": {
                      backgroundColor: "#F9F9F9",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      width: "32px",
                      mr: 0,
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
                <Collapse
                  in={item.name === "Dashboard" ? true : open[`${item.name}`]}
                  timeout="auto"
                >
                  <List
                    component="div"
                    disablePadding
                    sx={{
                      pl: theme.spacing(8), // Indent the nested list
                      position: "relative",
                      // The main vertical line of the tree
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: `calc(${theme.spacing(3)} + 12px)`, // Position the line to align with parent icon center + 12px offset
                        top: 0,
                        height: "calc(100% - 18.5px)", // Extend to cover both items but stop before the last item's bottom
                        width: "1px",
                        backgroundColor: "#D1D5DB", // Light gray color matching the reference
                        zIndex: 1, // Ensure tree lines stay above background
                        pointerEvents: "none", // Prevent interference with hover
                      },
                    }}
                  >
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.path}
                        disableRipple={
                          theme.components?.MuiListItemButton?.defaultProps
                            ?.disableRipple
                        }
                        className={
                          location.pathname === child.path
                            ? "selected-path"
                            : "unselected"
                        }
                        onClick={() => navigate(`${child.path}`)}
                        sx={{
                          height: "37px",
                          gap: theme.spacing(4),
                          borderRadius: theme.shape.borderRadius,
                          px: theme.spacing(4),
                          pl: `calc(${theme.spacing(4)} + 20px)`, // Add extra left padding to avoid tree overlap
                          my: theme.spacing(1),
                          position: "relative",
                          backgroundColor:
                            location.pathname === child.path
                              ? "#F9F9F9"
                              : "transparent",
                          "&:hover": {
                            backgroundColor: "#F9F9F9",
                          },
                          // The horizontal line connecting item to the vertical tree line
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: `calc(${theme.spacing(-5)} + 12px)`, // Start from the vertical line's position + 12px offset
                            top: "50%",
                            width: theme.spacing(5), // Extend to the item's padding start
                            height: "1px",
                            backgroundColor: "#D1D5DB", // Light gray color matching the reference
                            zIndex: 1, // Ensure tree lines stay above background
                            pointerEvents: "none", // Prevent interference with hover
                          },
                        }}
                      >
                        <ListItemText
                          sx={{
                            "& .MuiListItemText-primary": {
                              fontSize: "13px",
                              color: theme.palette.text.secondary,
                              fontWeight: 400, // Ensure consistent font weight
                            },
                          }}
                        >
                          {child.name}
                        </ListItemText>
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            )
          ) : item.path ? (
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
                  height: "37px",
                  gap: theme.spacing(4),
                  borderRadius: theme.shape.borderRadius,
                  px: theme.spacing(4),
                  backgroundColor:
                    location.pathname === item.path ||
                    item.highlightPaths?.some((p: string) =>
                      location.pathname.startsWith(p)
                    ) ||
                    customMenuHandler() === item.path
                      ? "#F9F9F9" // highlight background
                      : "transparent",

                  "&:hover": {
                    backgroundColor: "#F9F9F9",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    width: "32px",
                    mr: 0,
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
          ) : null
        )}
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
                height: "37px",
                gap: theme.spacing(4),
                borderRadius: theme.shape.borderRadius,
                px: theme.spacing(4),
                backgroundColor:
                  location.pathname === item.path ? "#F9F9F9" : "transparent",

                "&:hover": {
                  backgroundColor: "#F9F9F9",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  width: "32px",
                  mr: 0,
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
                <DotsVertical />
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
              fontSize: "13px",

              "& .MuiTouchRipple-root": {
                display: "none",
              },
            }}
          >
            <Feedback />
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
              fontSize: "13px",

              "& .MuiTouchRipple-root": {
                display: "none",
              },
            }}
          >
            <Discord />
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
              fontSize: "13px",

              "& .MuiTouchRipple-root": {
                display: "none",
              },
            }}
          >
            <LogoutSvg />
            Log out
          </MenuItem>
        </Menu>
      </Stack>
    </Stack>
  );
};

export default Sidebar;
