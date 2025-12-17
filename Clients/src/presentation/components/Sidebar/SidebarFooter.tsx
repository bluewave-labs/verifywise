import { FC, useState, useRef, useEffect, useContext } from "react";
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
  Menu,
  MenuItem,
  Drawer,
} from "@mui/material";
import { useTheme } from "@mui/material";
import { useNavigate, useLocation } from "react-router";
import {
  ChevronDown,
  MoreVertical,
  Settings,
  Database,
  HelpCircle,
  Newspaper,
  Users,
  Headphones,
  Trash2,
  FolderCog,
  LogOut,
  MessageCircle,
  Telescope,
} from "lucide-react";
import Avatar from "../Avatar/VWAvatar";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { ROLES } from "../../../application/constants/roles";
import useLogout from "../../../application/hooks/useLogout";
import { User } from "../../../domain/types/User";
import { useProfilePhotoFetch } from "../../../application/hooks/useProfilePhotoFetch";
import ReadyToSubscribeBox from "../ReadyToSubscribeBox/ReadyToSubscribeBox";

interface IManagementItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
}

interface SidebarFooterProps {
  collapsed: boolean;
  delayedCollapsed: boolean;
  hasDemoData?: boolean;
  onOpenCreateDemoData?: () => void;
  onOpenDeleteDemoData?: () => void;
  showReadyToSubscribe?: boolean;
  openUserGuide?: () => void;
}

const getManagementItems = (
  hasDemoData?: boolean,
  onOpenCreateDemoData?: () => void,
  onOpenDeleteDemoData?: () => void
): IManagementItem[] => [
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

interface User_Avatar {
  firstname: string;
  lastname: string;
  email: string;
  pathToImage: string;
}

const DEFAULT_USER: User = {
  id: 1,
  name: "",
  surname: "",
  email: "",
  roleId: 1,
};

const SidebarFooter: FC<SidebarFooterProps> = ({
  collapsed,
  delayedCollapsed,
  hasDemoData,
  onOpenCreateDemoData,
  onOpenDeleteDemoData,
  showReadyToSubscribe = false,
  openUserGuide,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const { userId, users, photoRefreshFlag } = useContext(VerifyWiseContext);

  const [managementAnchorEl, setManagementAnchorEl] = useState<null | HTMLElement>(null);
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const user: User = users
    ? users.find((u: User) => u.id === userId) || DEFAULT_USER
    : DEFAULT_USER;

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const { fetchProfilePhotoAsBlobUrl } = useProfilePhotoFetch();

  useEffect(() => {
    let cancel = false;
    let previousUrl: string | null = null;
    (async () => {
      const url = await fetchProfilePhotoAsBlobUrl(userId || 0);
      if (cancel) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      if (previousUrl && previousUrl !== url) {
        URL.revokeObjectURL(previousUrl);
      }

      previousUrl = url ?? null;
      setAvatarUrl(url ?? "");
    })();

    return () => {
      cancel = true;
      if (previousUrl) URL.revokeObjectURL(previousUrl);
    };
  }, [userId, fetchProfilePhotoAsBlobUrl, photoRefreshFlag]);

  const userAvator: User_Avatar = {
    firstname: user.name,
    lastname: user.surname,
    email: user.email,
    pathToImage: avatarUrl,
  };

  const openPopup = () => setSlideoverOpen(true);
  const closePopup = () => setSlideoverOpen(false);

  // Click outside handler for drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
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

  const isManagementActive = getManagementItems(hasDemoData, onOpenCreateDemoData, onOpenDeleteDemoData).some(
    (item) => item.path && (location.pathname.startsWith(`${item.path}/`) || location.pathname === item.path)
  );

  return (
    <>
      <Divider sx={{ mt: "auto", mb: theme.spacing(4) }} />
      {/* Management Section */}
      <List
        component="nav"
        aria-labelledby="nested-management-subheader"
        disablePadding
        sx={{
          px: theme.spacing(8),
          flexShrink: 0,
        }}
      >
        <Tooltip
          sx={{ fontSize: 13 }}
          placement="right"
          title={delayedCollapsed ? "Management" : ""}
          slotProps={{
            popper: {
              modifiers: [{ name: "offset", options: { offset: [0, -16] } }],
            },
          }}
          disableInteractive
        >
          <ListItemButton
            disableRipple={theme.components?.MuiListItemButton?.defaultProps?.disableRipple}
            onClick={(e) => setManagementAnchorEl(e.currentTarget)}
            sx={{
              height: "32px",
              gap: theme.spacing(4),
              borderRadius: theme.shape.borderRadius,
              px: theme.spacing(4),
              background: isManagementActive
                ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                : "transparent",
              border: isManagementActive
                ? "1px solid #D8D8D8"
                : "1px solid transparent",
              "&:hover": {
                background: isManagementActive
                  ? "linear-gradient(135deg, #ECECEC 0%, #E4E4E4 100%)"
                  : "#F9F9F9",
                border: isManagementActive
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
                  color: isManagementActive
                    ? "#13715B !important"
                    : `${theme.palette.text.tertiary} !important`,
                  stroke: isManagementActive
                    ? "#13715B !important"
                    : `${theme.palette.text.tertiary} !important`,
                  transition: "color 0.2s ease, stroke 0.2s ease",
                },
                "& svg path": {
                  stroke: isManagementActive
                    ? "#13715B !important"
                    : `${theme.palette.text.tertiary} !important`,
                },
              }}
            >
              <FolderCog size={16} strokeWidth={1.5} />
            </ListItemIcon>
            {!delayedCollapsed && (
              <>
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
              </>
            )}
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
                width: managementAnchorEl ? managementAnchorEl.offsetWidth : "auto",
                minWidth: collapsed ? "180px" : "auto",
                borderRadius: theme.shape.borderRadius,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: `1px solid ${theme.palette.divider}`,
                mt: -1,
              },
            },
          }}
        >
          {getManagementItems(hasDemoData, onOpenCreateDemoData, onOpenDeleteDemoData).map((item) => (
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

      {/* Ready To Subscribe Box - only shown when not collapsed and enabled */}
      {showReadyToSubscribe && !collapsed && (
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

      {/* Divider */}
      <Divider />

      {/* User Profile Section */}
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
        {delayedCollapsed ? (
          <Tooltip
            sx={{ fontSize: 13 }}
            title="Options"
            slotProps={{
              popper: {
                modifiers: [{ name: "offset", options: { offset: [0, -10] } }],
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
              <Avatar user={userAvator} size="small" sx={{ margin: "auto" }} />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Avatar user={userAvator} size="small" sx={{ ml: theme.spacing(2) }} />
            <Box ml={theme.spacing(2)}>
              <Typography component="span" fontWeight={500}>
                {user.name} {user.surname}
              </Typography>
              <Typography sx={{ textTransform: "capitalize" }}>
                {ROLES[user.roleId as keyof typeof ROLES]}
              </Typography>
            </Box>
            <IconButton
              disableRipple={theme.components?.MuiIconButton?.defaultProps?.disableRipple}
              sx={{
                ml: "auto",
                mr: "-8px",
                "&:focus": { outline: "none" },
                "& svg": {
                  width: "20px",
                  height: "20px",
                },
                "& svg path": {
                  stroke: theme.palette.other?.icon,
                },
              }}
              onClick={openPopup}
            >
              <MoreVertical size={16} strokeWidth={1.5} />
            </IconButton>
          </>
        )}

        {/* User Options Drawer */}
        <Drawer
          anchor="bottom"
          open={slideoverOpen}
          onClose={closePopup}
          hideBackdrop={true}
          transitionDuration={0}
          PaperProps={{
            sx: {
              width: collapsed ? "260px" : "300px",
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
              p: 1,
              animation: slideoverOpen ? "fadeIn 0.2s ease-in-out" : "none",
              "@keyframes fadeIn": {
                "0%": { opacity: 0 },
                "100%": { opacity: 1 },
              },
            }}
          >
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
                      if (openUserGuide) {
                        openUserGuide();
                      } else {
                        window.open("https://verifywise.ai", "_blank", "noreferrer");
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
                    <HelpCircle size={16} strokeWidth={1.5} />
                    <Typography sx={{ fontSize: "13px" }}>Help center</Typography>
                  </ListItemButton>

                  {/* What's New */}
                  <ListItemButton
                    onClick={() => {
                      window.open("https://verifywise.ai/blog", "_blank", "noreferrer");
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
                    <Typography sx={{ fontSize: "13px" }}>What's new?</Typography>
                  </ListItemButton>

                  {/* User Community */}
                  <ListItemButton
                    onClick={() => {
                      window.open("https://discord.gg/d3k3E4uEpR", "_blank", "noreferrer");
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
                    <Typography sx={{ fontSize: "13px" }}>User community</Typography>
                  </ListItemButton>

                  {/* Get Support */}
                  <ListItemButton
                    onClick={() => {
                      window.open("https://cal.com/verifywise/", "_blank", "noreferrer");
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
                    <Typography sx={{ fontSize: "13px" }}>Get support</Typography>
                  </ListItemButton>

                  {/* Give Feedback */}
                  <ListItemButton
                    onClick={() => {
                      window.open("https://verifywise.ai/contact", "_blank", "noreferrer");
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
                    <Typography sx={{ fontSize: "13px" }}>Give feedback</Typography>
                  </ListItemButton>
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Logout */}
              <ListItemButton
                onClick={() => {
                  logout();
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
                <LogOut size={16} strokeWidth={1.5} />
                <Typography sx={{ fontSize: "13px" }}>Logout</Typography>
              </ListItemButton>
            </Stack>
          </Box>
        </Drawer>
      </Stack>
    </>
  );
};

export default SidebarFooter;
