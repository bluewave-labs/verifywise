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
} from "@mui/material";
import "./index.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { useTheme } from "@mui/material";
import React, { useState } from "react";
import { toggleSidebar } from "../../tools/uiSlice";

import { ReactComponent as ArrowLeft } from "../../assets/icons/left-arrow.svg";
import { ReactComponent as ArrowRight } from "../../assets/icons/right-arrow.svg";
import { ReactComponent as Dashboard } from "../../assets/icons/dashboard.svg";
import { ReactComponent as DotsVertical } from "../../assets/icons/dots-vertical.svg";
import { ReactComponent as LogoutSvg } from "../../assets/icons/logout.svg";

import { ReactComponent as Compliance } from "../../assets/icons/globe.svg";
import { ReactComponent as Assessment } from "../../assets/icons/chart.svg";
import { ReactComponent as Vendors } from "../../assets/icons/building.svg";
import { ReactComponent as Settings } from "../../assets/icons/setting.svg";
import { ReactComponent as Team } from "../../assets/icons/team.svg";

import Logo from "../../assets/imgs/logo.png";

import Select from "../Inputs/Select";
import Avatar from "../Avatar/VWAvatar";

const menu = [
  {
    name: "Dashboard",
    icon: <Dashboard />,
    path: "/",
  },
  {
    name: "Compliance tracker",
    icon: <Compliance />,
    path: "/compliance-tracker",
  },
  {
    name: "Assessment tracker",
    icon: <Assessment />,
    path: "/assessment",
  },
  {
    name: "Vendors",
    icon: <Vendors style={{}} />,
    path: "/vendors",
  },
];

const other = [
  {
    name: "Settings",
    icon: <Settings />,
    path: "/setting",
  },
  {
    name: "Team",
    icon: <Team />,
    path: "/team",
  },
];

const Sidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [popup, setPopup] = useState();

  const collapsed = useSelector((state: any) => state.ui?.sidebar?.collapsed);

  const [open, setOpen] = useState<{ [key: string]: boolean }>({
    Dashboard: false,
    Account: false,
  });

  const openPopup = (event: any, id: any) => {
    setAnchorEl(event.currentTarget);
    setPopup(id);
  };

  const closePopup = () => {
    setAnchorEl(null);
  };

  /**
   * Handles logging out the user
   *
   */
  const logout = async () => {
    // placeholder for logging out the user
    console.log("User logged out");
  };

  console.log("collapsed -> ", collapsed);

  return (
    <Stack
      component="aside"
      className={collapsed ? "collapsed" : "expanded"}
      py={theme.spacing(6)}
      gap={theme.spacing(6)}
      sx={{
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
        <Stack direction="row" alignItems="center" gap={theme.spacing(4)}>
          <img src={Logo} alt="Logo" width={32} height={30} />
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
          setOpen({ Dashboard: false, Account: false });
          dispatch(toggleSidebar());
        }}
      >
        {collapsed ? <ArrowRight /> : <ArrowLeft />}
      </IconButton>
      {/* Select */}
      {!collapsed && (
        <Stack
          sx={{
            padding: theme.spacing(4),
            justifyContent: "flex-start",
            width: "fit-content",
          }}
        >
          <Select
            id="projects"
            value={"1"}
            items={[
              { _id: "1", name: "ChatBot AI" },
              { _id: "2", name: "Chat-GPT 4" },
            ]}
            onChange={() => {}}
            sx={{ width: "180px", marginLeft: theme.spacing(8) }}
          />
        </Stack>
      )}
      {/* menu */}
      <List
        component="nav"
        aria-labelledby="nested-menu-subheader"
        disablePadding
        sx={{ px: theme.spacing(8) }}
      >
        {/*
        Items of the menu
        */}
        {menu.map((item) =>
          item.path ? (
            <Tooltip
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
                  location.pathname === item.path
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
                    location.pathname === item.path ? "#F9F9F9" : "transparent",

                  "&:hover": {
                    backgroundColor: "#F9F9F9",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
                <ListItemText>{item.name}</ListItemText>
              </ListItemButton>
            </Tooltip>
          ) : collapsed ? (
            <React.Fragment key={item.name}>
              <Tooltip
                placement="right"
                title={collapsed ? item.name : ""}
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: "offset",
                        options: [0, -16],
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
                      location.pathname === item.path
                        ? "#F9F9F9"
                        : "transparent",

                    "&:hover": {
                      backgroundColor: "#F9F9F9",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
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
              ></Menu>
            </React.Fragment>
          ) : (
            <React.Fragment key={item.name}>
              <ListItemButton
                onClick={() =>
                  setOpen((prev) => ({
                    ...prev,
                    [`${item.name}`]: !prev[`${item.name}`],
                  }))
                }
                sx={{
                  gap: theme.spacing(4),
                  borderRadius: theme.shape.borderRadius,
                  px: theme.spacing(4),
                }}
              >
                <ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
                <ListItemText>{item.name}</ListItemText>
              </ListItemButton>
              <Collapse in={open[`${item.name}`]} timeout="auto">
                <List
                  component="div"
                  disablePadding
                  sx={{ pl: theme.spacing(12) }}
                ></List>
              </Collapse>
            </React.Fragment>
          )
        )}
      </List>
      <Divider sx={{ my: theme.spacing(4) }} />
      {/* other */}
      <List
        component={"nav"}
        aria-labelledby="nested-other-subheader"
        sx={{ px: theme.spacing(8) }}
      >
        {other.map((item) => (
          <Tooltip
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
              onClick={() =>
                item.path === "support"
                  ? window.open(
                      "https://github.com/bluewave-labs/bluewave-uptime/issues",
                      "_blank",
                      "noreferrer"
                    )
                  : navigate(`${item.path}`)
              }
              sx={{
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
              <ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
              <ListItemText>{item.name}</ListItemText>
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
      <Divider sx={{ mt: "auto" }} />
      <Stack
        direction="row"
        height="50px"
        alignItems="center"
        py={theme.spacing(4)}
        px={theme.spacing(8)}
        gap={theme.spacing(2)}
        borderRadius={theme.shape.borderRadius}
      >
        {collapsed ? (
          <>
            <Tooltip
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
                <Avatar size="small" sx={{ margin: "auto" }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            {/* <Avatar small={true} /> */}
            <Box ml={theme.spacing(2)}>
              <Typography component="span" fontWeight={500}>
                {"Mohammad"} {"Khalilzadeh"}
              </Typography>
              <Typography sx={{ textTransform: "capitalize" }}>
                {"Admin"}
              </Typography>
            </Box>
            <Tooltip title="Controls" disableInteractive>
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
                <Typography component="span" fontWeight={500} fontSize={13}>
                  {"Mohammad"} {"Khalilzadeh"}
                </Typography>
                <Typography sx={{ textTransform: "capitalize", fontSize: 12 }}>
                  {"Admin"}
                </Typography>
              </Box>
            </MenuItem>
          )}
          <MenuItem
            onClick={logout}
            sx={{
              gap: theme.spacing(4),
              borderRadius: theme.shape.borderRadius,
              pl: theme.spacing(4),
              "& svg path": {
                stroke: theme.palette.other.icon,
              },
              fontSize: 13,

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
