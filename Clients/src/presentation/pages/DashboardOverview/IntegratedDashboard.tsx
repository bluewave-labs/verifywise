/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useCallback, lazy, Suspense, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  CircularProgress,
  Button,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import {
  GripVertical,
  Lock,
  LockOpen,
  ChevronRight,
  Lightbulb,
  FileText,
  BarChart3,
  Users,
  Brain,
  Building2,
  ShieldAlert,
  GraduationCap,
  ScrollText,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Responsive, WidthProvider, Layout, Layouts } from "react-grid-layout";
import { useDashboard } from "../../../application/hooks/useDashboard";
import { useDashboardMetrics } from "../../../application/hooks/useDashboardMetrics";
import { cardStyles } from "../../themes";
import { useAuth } from "../../../application/hooks/useAuth";
import { getUserById } from "../../../application/repository/user.repository";
import VerifyWiseMultiSelect from "../../components/VerifyWiseMultiSelect";
import StatusDonutChart from "../../components/Charts/StatusDonutChart";
import { getDefaultStatusDistribution } from "../../utils/statusColors";
import {
  getDistributionSummary,
  getQuickStats,
  hasCriticalItems,
  getPriorityLevel,
} from "../../utils/cardEnhancements";
import DashboardErrorBoundary from "../../components/Dashboard/DashboardErrorBoundary";
import WidgetErrorBoundary from "../../components/Dashboard/WidgetErrorBoundary";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { IStatusData } from "../../../domain/interfaces/i.chart";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageTour from "../../components/PageTour";
import DashboardSteps from "./DashboardSteps";
import AddNewMegaDropdown from "../../components/MegaDropdown/AddNewMegaDropdown";
import MegaDropdownErrorBoundary from "../../components/MegaDropdown/MegaDropdownErrorBoundary";
import placeholderImage from "../../assets/imgs/empty-state.svg";

const Alert = lazy(() => import("../../components/Alert"));
const ResponsiveGridLayout = WidthProvider(Responsive);

// Time-based greeting function with special occasions
const getTimeBasedGreeting = (userName?: string, userToken?: any): { icon: React.ReactNode; text: string; greetingText: string } => {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth() + 1; // getMonth() returns 0-11
  const day = now.getDate();

  // Get display name - prioritize token for consistency over API data
  let displayName = 'there';
  if (userToken?.name) {
    displayName = userToken.name; // Always use token name first (consistent)
  } else if (userName) {
    displayName = userName; // Fallback to API data if token name unavailable
  } else if (userToken?.email) {
    displayName = userToken.email.split('@')[0]; // Last resort - email prefix
  }

  // Check for international special days
  const specialDay = getSpecialDayGreeting(month, day, displayName);
  if (specialDay) {
    return specialDay;
  }

  let icon: React.ReactNode;
  let greetingText: string;

  if (hour >= 5 && hour < 12) {
    icon = "☀️";
    greetingText = "Good morning";
  } else if (hour >= 12 && hour < 17) {
    icon = "☀️";
    greetingText = "Good afternoon";
  } else if (hour >= 17 && hour < 22) {
    icon = "🌅";
    greetingText = "Good evening";
  } else {
    // Late night fun messages
    icon = "🌙";
    const lateNightMessages = [
      "Burning the midnight oil",
      "Still up? You're dedicated",
      "Night owl mode activated",
      "Coffee might be needed",
      "Early bird or night owl"
    ];

    if (hour >= 1 && hour <= 4) {
      const randomMessage = lateNightMessages[Math.floor(Math.random() * lateNightMessages.length)];
      greetingText = randomMessage;
    } else {
      greetingText = "Good night";
    }
  }

  return {
    icon,
    text: `${greetingText}, ${displayName}! ${icon}`,
    greetingText
  };
};

// Special day greetings
const getSpecialDayGreeting = (month: number, day: number, displayName: string): { icon: React.ReactNode; text: string; greetingText: string } | null => {
  // New Year's Day (universal celebration)
  if (month === 1 && day === 1) {
    return {
      icon: "🎉",
      text: `Happy New Year, ${displayName}! 🎉`,
      greetingText: "Happy New Year"
    };
  }


  // International Day of Education
  if (month === 1 && day === 24) {
    return {
      icon: "🎓",
      text: `Happy Education Day, ${displayName}! 🎓`,
      greetingText: "Happy Education Day"
    };
  }

  // World Cancer Day
  if (month === 2 && day === 4) {
    return {
      icon: "🎗️",
      text: `World Cancer Day, ${displayName}! 🎗️`,
      greetingText: "World Cancer Day"
    };
  }

  // International Day of Women and Girls in Science
  if (month === 2 && day === 11) {
    return {
      icon: "👩‍🔬",
      text: `Women in Science Day, ${displayName}! 👩‍🔬`,
      greetingText: "Women in Science Day"
    };
  }

  // Valentine's Day
  if (month === 2 && day === 14) {
    return {
      icon: "💝",
      text: `Happy Valentine's Day, ${displayName}! 💝`,
      greetingText: "Happy Valentine's Day"
    };
  }

  // International Mother Language Day
  if (month === 2 && day === 21) {
    return {
      icon: "🗣️",
      text: `Mother Language Day, ${displayName}! 🗣️`,
      greetingText: "Mother Language Day"
    };
  }

  // International Women's Day
  if (month === 3 && day === 8) {
    return {
      icon: "💪",
      text: `Happy Women's Day, ${displayName}! 💪`,
      greetingText: "Happy Women's Day"
    };
  }

  // World Water Day
  if (month === 3 && day === 22) {
    return {
      icon: "💧",
      text: `Happy World Water Day, ${displayName}! 💧`,
      greetingText: "Happy World Water Day"
    };
  }

  // World Health Day
  if (month === 4 && day === 7) {
    return {
      icon: "🏥",
      text: `Happy World Health Day, ${displayName}! 🏥`,
      greetingText: "Happy World Health Day"
    };
  }

  // Earth Day
  if (month === 4 && day === 22) {
    return {
      icon: "🌍",
      text: `Happy Earth Day, ${displayName}! 🌍`,
      greetingText: "Happy Earth Day"
    };
  }

  // International Workers' Day / Labor Day (May 1st - celebrated in many countries)
  if (month === 5 && day === 1) {
    return {
      icon: "👷",
      text: `Happy Labor Day, ${displayName}! 👷`,
      greetingText: "Happy Labor Day"
    };
  }

  // World Password Day (First Thursday of May - approximation)
  if (month === 5 && day >= 1 && day <= 7) {
    return {
      icon: "🔐",
      text: `Happy World Password Day, ${displayName}! 🔐`,
      greetingText: "Happy World Password Day"
    };
  }

  // World Environment Day
  if (month === 6 && day === 5) {
    return {
      icon: "🌱",
      text: `Happy Environment Day, ${displayName}! 🌱`,
      greetingText: "Happy Environment Day"
    };
  }


  // World Emoji Day
  if (month === 7 && day === 17) {
    return {
      icon: "😄",
      text: `Happy World Emoji Day, ${displayName}! 😄`,
      greetingText: "Happy World Emoji Day"
    };
  }

  // International Friendship Day
  if (month === 7 && day === 30) {
    return {
      icon: "👫",
      text: `Happy Friendship Day, ${displayName}! 👫`,
      greetingText: "Happy Friendship Day"
    };
  }

  // International Beer Day (First Friday of August - approximation)
  if (month === 8 && day >= 1 && day <= 7) {
    return {
      icon: "🍺",
      text: `Happy International Beer Day, ${displayName}! 🍺`,
      greetingText: "Happy International Beer Day"
    };
  }

  // International Youth Day
  if (month === 8 && day === 12) {
    return {
      icon: "🌟",
      text: `Happy Youth Day, ${displayName}! 🌟`,
      greetingText: "Happy Youth Day"
    };
  }

  // International Dog Day
  if (month === 8 && day === 26) {
    return {
      icon: "🐕",
      text: `Happy International Dog Day, ${displayName}! 🐕`,
      greetingText: "Happy International Dog Day"
    };
  }

  // International Literacy Day
  if (month === 9 && day === 8) {
    return {
      icon: "📚",
      text: `Happy Literacy Day, ${displayName}! 📚`,
      greetingText: "Happy Literacy Day"
    };
  }

  // Programmer's Day (September 13th - 256th day of year)
  if (month === 9 && day === 13) {
    return {
      icon: "💻",
      text: `Happy Programmer's Day, ${displayName}! 💻`,
      greetingText: "Happy Programmer's Day"
    };
  }

  // International Peace Day
  if (month === 9 && day === 21) {
    return {
      icon: "☮️",
      text: `Happy Peace Day, ${displayName}! ☮️`,
      greetingText: "Happy Peace Day"
    };
  }

  // World Teachers' Day
  if (month === 10 && day === 5) {
    return {
      icon: "👩‍🏫",
      text: `Happy Teachers' Day, ${displayName}! 👩‍🏫`,
      greetingText: "Happy Teachers' Day"
    };
  }

  // World Mental Health Day
  if (month === 10 && day === 10) {
    return {
      icon: "🧠",
      text: `Happy Mental Health Day, ${displayName}! 🧠`,
      greetingText: "Happy Mental Health Day"
    };
  }

  // World Food Day
  if (month === 10 && day === 16) {
    return {
      icon: "🍽️",
      text: `Happy World Food Day, ${displayName}! 🍽️`,
      greetingText: "Happy World Food Day"
    };
  }

  // International Internet Day
  if (month === 10 && day === 29) {
    return {
      icon: "🌐",
      text: `Happy Internet Day, ${displayName}! 🌐`,
      greetingText: "Happy Internet Day"
    };
  }

  // World Vegan Day
  if (month === 11 && day === 1) {
    return {
      icon: "🥗",
      text: `Happy World Vegan Day, ${displayName}! 🥗`,
      greetingText: "Happy World Vegan Day"
    };
  }

  // World Science Day
  if (month === 11 && day === 10) {
    return {
      icon: "🔬",
      text: `Happy World Science Day, ${displayName}! 🔬`,
      greetingText: "Happy World Science Day"
    };
  }

  // World Kindness Day
  if (month === 11 && day === 13) {
    return {
      icon: "💖",
      text: `Happy World Kindness Day, ${displayName}! 💖`,
      greetingText: "Happy World Kindness Day"
    };
  }

  // International Men's Day
  if (month === 11 && day === 19) {
    return {
      icon: "👨",
      text: `Happy International Men's Day, ${displayName}! 👨`,
      greetingText: "Happy International Men's Day"
    };
  }

  // World Computer Security Day
  if (month === 11 && day === 30) {
    return {
      icon: "🔒",
      text: `Happy Computer Security Day, ${displayName}! 🔒`,
      greetingText: "Happy Computer Security Day"
    };
  }

  // World AIDS Day
  if (month === 12 && day === 1) {
    return {
      icon: "🎗️",
      text: `World AIDS Day, ${displayName}! 🎗️`,
      greetingText: "World AIDS Day"
    };
  }

  // International Volunteer Day
  if (month === 12 && day === 5) {
    return {
      icon: "🤲",
      text: `Happy Volunteer Day, ${displayName}! 🤲`,
      greetingText: "Happy Volunteer Day"
    };
  }

  // Human Rights Day
  if (month === 12 && day === 10) {
    return {
      icon: "⚖️",
      text: `Happy Human Rights Day, ${displayName}! ⚖️`,
      greetingText: "Happy Human Rights Day"
    };
  }

  // International Mountain Day
  if (month === 12 && day === 11) {
    return {
      icon: "⛰️",
      text: `Happy Mountain Day, ${displayName}! ⛰️`,
      greetingText: "Happy Mountain Day"
    };
  }

  return null;
};


// Import MetricCard component from WorkingDashboard
interface MetricCardProps {
  title: string;
  value: number | string;
  onClick?: () => void;
  navigable?: boolean;
  statusData?: IStatusData[];
  entityType?: "models" | "vendors" | "policies" | "trainings" | "vendorRisks";
  compact?: boolean;
  backgroundIcon?: React.ComponentType<any>;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  onClick,
  navigable = false,
  statusData,
  entityType,
  compact = false,
  backgroundIcon: BackgroundIcon,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Get status breakdown data
  const chartData =
    statusData ||
    (entityType
      ? getDefaultStatusDistribution(
          entityType,
          typeof value === "number" ? value : parseInt(String(value)) || 0
        )
      : []);
  const showChart =
    chartData.length > 0 && typeof value === "number" && value > 0;

  // Get enhancements
  const distributionSummary = getDistributionSummary(chartData);
  const quickStats = getQuickStats(
    entityType,
    typeof value === "number" ? value : parseInt(String(value)) || 0,
    chartData
  );
  const criticalInfo = hasCriticalItems(entityType, chartData);
  const priorityLevel = getPriorityLevel(
    entityType,
    typeof value === "number" ? value : parseInt(String(value)) || 0,
    chartData
  );

  // Priority visual cues
  const getPriorityStyles = () => {
    switch (priorityLevel) {
      case "high":
        return {
          background: "linear-gradient(135deg, #FEF2F2 0%, #FDE8E8 100%)",
          borderLeft: "4px solid #EF4444",
        };
      case "medium":
        return {
          background: "linear-gradient(135deg, #FFFBEB 0%, #FEF6D3 100%)",
          borderLeft: "4px solid #F59E0B",
        };
      default:
        return {
          background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
        };
    }
  };

  return (
    <Card
      elevation={0}
      onClick={navigable ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={(theme) => ({
        ...(cardStyles.base(theme) as any),
        ...getPriorityStyles(),
        border: "none", // Remove border from MetricCard
        margin: 0, // Remove any default margin
        height: "100%",
        minHeight: compact ? "90px" : "auto",
        cursor: navigable ? "pointer" : "default",
        position: "relative",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        borderRadius: 0, // Remove border radius to fill the wrapper completely
        "&:hover": navigable
          ? {
              background: "linear-gradient(135deg, #F9FAFB 0%, #F1F5F9 100%)",
              borderColor: "transparent",
            }
          : {},
      })}
    >
      <CardContent
        sx={{
          p: compact ? 1.5 : 2,
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          "&:last-child": {
            paddingBottom: compact ? 1.5 : 2,
          },
        }}
      >
        {/* Background Icon */}
        {BackgroundIcon && (
          <Box
            sx={{
              position: "absolute",
              bottom: "-48px",
              right: "-48px",
              opacity: isHovered ? 0.04 : 0.015,
              transform: isHovered ? "translateY(-10px)" : "translateY(0px)",
              zIndex: 0,
              pointerEvents: "none",
              transition: "opacity 0.2s ease, transform 0.3s ease",
            }}
          >
            <BackgroundIcon size={120} />
          </Box>
        )}
        {/* Header section with title and arrow icon */}
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: compact ? 1 : 2,
            mt: compact ? 1.5 : 2,
            zIndex: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={(theme) => ({
              color: theme.palette.text.tertiary,
              fontSize: compact ? "12px" : theme.typography.fontSize,
              fontWeight: 400,
            })}
          >
            {title}
          </Typography>

          {navigable && (
            <Box
              sx={{
                opacity: isHovered ? 1 : 0.3,
                transition: "opacity 0.2s ease",
              }}
            >
              <ChevronRight size={20} />
            </Box>
          )}
        </Box>

        {/* Content section */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: compact ? "center" : "flex-start",
            position: "relative",
            zIndex: 1,
          }}
        >
          {showChart ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  mb: 2,
                }}
              >
                <StatusDonutChart
                  data={chartData}
                  total={
                    typeof value === "number"
                      ? value
                      : parseInt(String(value)) || 0
                  }
                  size={60}
                />
                <Box>
                  <Typography
                    variant="h6"
                    sx={(theme) => ({
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: "1.25rem",
                      lineHeight: 1,
                    })}
                  >
                    {value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={(theme) => ({
                      color: theme.palette.text.tertiary,
                      fontSize: "11px",
                      display: "block",
                      mt: 0.5,
                    })}
                  >
                    Total
                  </Typography>
                </Box>
              </Box>

              {/* Distribution Summary */}
              {distributionSummary && (
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    color: theme.palette.text.secondary,
                    fontSize: "12px",
                    display: "block",
                    textAlign: "center",
                    mb: 1,
                  })}
                >
                  {distributionSummary}
                </Typography>
              )}

              {/* Quick Stats */}
              {quickStats && (
                <Box
                  sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}
                >
                  <Chip
                    label={quickStats}
                    size="small"
                    sx={{
                      fontSize: "11px",
                      height: "22px",
                      background:
                        "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
                      color: "#374151",
                      fontWeight: 500,
                    }}
                  />
                </Box>
              )}

              {/* Quick Action Button - Bottom Right */}
              {criticalInfo.hasCritical && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(criticalInfo.actionRoute);
                    }}
                    sx={{
                      fontSize: "9px",
                      textTransform: "none",
                      padding: "2px 6px",
                      minWidth: "auto",
                      height: "20px",
                      borderColor:
                        priorityLevel === "high" ? "#EF4444" : "#F59E0B",
                      color: priorityLevel === "high" ? "#EF4444" : "#F59E0B",
                      "&:hover": {
                        borderColor:
                          priorityLevel === "high" ? "#DC2626" : "#D97706",
                        background:
                          priorityLevel === "high"
                            ? "linear-gradient(135deg, #FEF2F2 0%, #FDE8E8 100%)"
                            : "linear-gradient(135deg, #FFFBEB 0%, #FEF6D3 100%)",
                      },
                    }}
                  >
                    {criticalInfo.actionLabel}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography
              variant="h6"
              sx={(theme) => ({
                fontWeight: 400,
                color: theme.palette.text.primary,
                fontSize: compact ? "1rem" : "1.25rem",
              })}
            >
              {value}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Integrated Dashboard Component
const IntegratedDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { dashboard, loading, fetchDashboard } = useDashboard();
  const {
    evidenceMetrics,
    vendorRiskMetrics,
    vendorMetrics,
    usersMetrics,
    policyMetrics,
    incidentMetrics,
  } = useDashboardMetrics();
  const { userToken, userId } = useAuth();

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Password notification state
  const [showPasswordNotification, setShowPasswordNotification] =
    useState(false);

  // User name state
  const [userName, setUserName] = useState<string>("");

  // Show/Hide selector state
  const [showHideSelector, setShowHideSelector] = useState(false);

  // Load visible cards from localStorage on initial render
  const getInitialVisibleCards = (): Set<string> => {
    if (typeof window !== 'undefined') {
      const savedCards = localStorage.getItem('dashboard-visible-cards');
      if (savedCards) {
        try {
          return new Set(JSON.parse(savedCards));
        } catch (error) {
          console.error('Error parsing saved visible cards:', error);
        }
      }
    }
    return new Set(["projects", "evidences", "reports", "users", "models", "vendors", "vendor-risks", "trainings", "policies"]);
  };

  const [visibleCards, setVisibleCards] = useState<Set<string>>(getInitialVisibleCards());

  // Save visible cards to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dashboard-visible-cards', JSON.stringify(Array.from(visibleCards)));
      } catch (error) {
        console.error('Error saving visible cards to localStorage:', error);
      }
    }
  }, [visibleCards]);
  // Generate time-based greeting
  const greeting = useMemo(() => {
    return getTimeBasedGreeting(userName, userToken);
  }, [userName, userToken]);

  // Default layouts for the dashboard sections with 4-column constraint
  // Each widget takes exactly 1/4 of the width and cannot be smaller
  // Heights: Users/Reports/Projects/Evidence are always small (85px), others can be big (170px)
  // Widgets are arranged from most important (top) to least important (bottom)
  const defaultLayouts: Layouts = {
    lg: [
      // Row 1 - Use cases (most important) + Models + Vendors (high importance)
      {
        i: "projects",
        x: 0,
        y: 0,
        w: 3,
        h: 2,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 2,
      },
      {
        i: "models",
        x: 3,
        y: 0,
        w: 3,
        h: 4,
        minW: 3,
        maxW: 6,
        minH: 2,
        maxH: 4,
      },
      {
        i: "vendors",
        x: 6,
        y: 0,
        w: 3,
        h: 4,
        minW: 3,
        maxW: 6,
        minH: 2,
        maxH: 4,
      },
      {
        i: "vendor-risks",
        x: 9,
        y: 0,
        w: 3,
        h: 4,
        minW: 3,
        maxW: 6,
        minH: 2,
        maxH: 4,
      },
      // Row 2 - Policies and Trainings (medium importance)
      {
        i: "policies",
        x: 0,
        y: 2,
        w: 3,
        h: 4,
        minW: 3,
        maxW: 6,
        minH: 2,
        maxH: 4,
      },
      {
        i: "trainings",
        x: 3,
        y: 4,
        w: 3,
        h: 4,
        minW: 3,
        maxW: 6,
        minH: 2,
        maxH: 4,
      },
      // Row 3 - Users, Evidence, Reports (lower importance, administrative)
      {
        i: "users",
        x: 6,
        y: 4,
        w: 3,
        h: 2,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 2,
      },
      {
        i: "evidences",
        x: 9,
        y: 4,
        w: 3,
        h: 2,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 2,
      },
      {
        i: "reports",
        x: 0,
        y: 6,
        w: 3,
        h: 2,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 2,
      },
    ],
    md: [
      // Row 1 - Use cases (most important) + Models + Vendors (high importance)
      {
        i: "projects",
        x: 0,
        y: 0,
        w: 2.5,
        h: 2,
        minW: 2.5,
        maxW: 2.5,
        minH: 2,
        maxH: 2,
      },
      {
        i: "models",
        x: 2.5,
        y: 0,
        w: 2.5,
        h: 4,
        minW: 2.5,
        maxW: 5,
        minH: 2,
        maxH: 4,
      },
      {
        i: "vendors",
        x: 5,
        y: 0,
        w: 2.5,
        h: 4,
        minW: 2.5,
        maxW: 5,
        minH: 2,
        maxH: 4,
      },
      {
        i: "vendor-risks",
        x: 7.5,
        y: 0,
        w: 2.5,
        h: 4,
        minW: 2.5,
        maxW: 5,
        minH: 2,
        maxH: 4,
      },
      // Row 2 - Policies and Trainings (medium importance)
      {
        i: "policies",
        x: 0,
        y: 2,
        w: 2.5,
        h: 4,
        minW: 2.5,
        maxW: 5,
        minH: 2,
        maxH: 4,
      },
      {
        i: "trainings",
        x: 2.5,
        y: 4,
        w: 2.5,
        h: 4,
        minW: 2.5,
        maxW: 5,
        minH: 2,
        maxH: 4,
      },
      // Row 3 - Users, Evidence, Reports (lower importance, administrative)
      {
        i: "users",
        x: 5,
        y: 4,
        w: 2.5,
        h: 2,
        minW: 2.5,
        maxW: 2.5,
        minH: 2,
        maxH: 2,
      },
      {
        i: "evidences",
        x: 7.5,
        y: 4,
        w: 2.5,
        h: 2,
        minW: 2.5,
        maxW: 2.5,
        minH: 2,
        maxH: 2,
      },
      {
        i: "reports",
        x: 0,
        y: 6,
        w: 2.5,
        h: 2,
        minW: 2.5,
        maxW: 2.5,
        minH: 2,
        maxH: 2,
      },
    ],
    sm: [
      // For small screens - Widgets arranged by importance top to bottom
      // Row 1 - Use cases (most important)
      {
        i: "projects",
        x: 0,
        y: 0,
        w: 3,
        h: 2,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 2,
      },
      // Row 1-2 - Models and Vendors (high importance)
      {
        i: "models",
        x: 3,
        y: 0,
        w: 3,
        h: 4,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 4,
      },
      {
        i: "vendors",
        x: 0,
        y: 2,
        w: 3,
        h: 4,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 4,
      },
      // Row 3-4 - Vendor Risks and Policies (medium-high importance)
      {
        i: "vendor-risks",
        x: 3,
        y: 4,
        w: 3,
        h: 4,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 4,
      },
      {
        i: "policies",
        x: 0,
        y: 6,
        w: 3,
        h: 4,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 4,
      },
      // Row 5 - Trainings (medium importance)
      {
        i: "trainings",
        x: 3,
        y: 8,
        w: 3,
        h: 4,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 4,
      },
      // Row 6-7 - Users, Evidence, Reports (lower importance, administrative)
      {
        i: "users",
        x: 0,
        y: 10,
        w: 3,
        h: 2,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 2,
      },
      {
        i: "evidences",
        x: 3,
        y: 12,
        w: 3,
        h: 2,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 2,
      },
      {
        i: "reports",
        x: 0,
        y: 12,
        w: 3,
        h: 2,
        minW: 3,
        maxW: 3,
        minH: 2,
        maxH: 2,
      },
    ],
  };

  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);

  // Helper function to check if a widget should always be small (85px)
  const isRestrictedToSmallHeight = useCallback((widgetId: string): boolean => {
    return ["users", "reports", "projects", "evidences"].includes(widgetId);
  }, []);

  // Constraint utility functions to eliminate code duplication
  const getWidthConstraints = useCallback(
    (breakpoint: string) =>
      ({
        lg: { min: 3, max: 6 }, // 1/4 to 1/2 of 12 columns
        md: { min: 2.5, max: 5 }, // 1/4 to 1/2 of 10 columns
        sm: { min: 3, max: 3 }, // Fixed at 1/2 of 6 columns
      }[breakpoint] || { min: 3, max: 6 }),
    []
  );

  const getFixedWidths = useCallback(
    (breakpoint: string) =>
      ({
        lg: 3, // 1/4 of 12 columns
        md: 2.5, // 1/4 of 10 columns
        sm: 3, // 1/2 of 6 columns
      }[breakpoint] || 3),
    []
  );

  const enforceHeightConstraint = useCallback(
    (height: number, isRestricted: boolean): number => {
      if (isRestricted) return 2; // Always small for restricted widgets
      if (height <= 2) return 2; // Small block (85px)
      if (height >= 4) return 4; // Big block (170px) - max allowed
      return height < 3 ? 2 : 4; // Snap to nearest
    },
    []
  );

  const enforceWidthConstraint = useCallback(
    (width: number, isRestricted: boolean, breakpoint: string): number => {
      if (isRestricted) return getFixedWidths(breakpoint);
      const constraint = getWidthConstraints(breakpoint);
      return Math.max(constraint.min, Math.min(constraint.max, width));
    },
    [getFixedWidths, getWidthConstraints]
  );

  const enforceLayoutItemConstraints = useCallback(
    (item: Layout, breakpoint: string): Layout => {
      const isRestricted = isRestrictedToSmallHeight(item.i);
      return {
        ...item,
        h: enforceHeightConstraint(item.h, isRestricted),
        w: enforceWidthConstraint(item.w, isRestricted, breakpoint),
      };
    },
    [isRestrictedToSmallHeight, enforceHeightConstraint, enforceWidthConstraint]
  );

  useEffect(() => {
    // Run initial data fetch once on mount
    fetchDashboard();
  }, []); // Empty dependency array - only run once on mount

  // Fetch user name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!userId) return;

      try {
        const userData = await getUserById({ userId });
        const actualUserData = userData?.data || userData;
        setUserName(actualUserData?.name || "");
      } catch (error) {
        console.error("Failed to fetch user name:", error);
        // Fallback to token data if API fails
        setUserName(userToken?.name || "");
      }
    };

    fetchUserName();
  }, [userId, userToken?.name]);

  useEffect(() => {
    const storedLayouts = localStorage.getItem(
      "verifywise_integrated_dashboard_layouts"
    );
    if (storedLayouts) {
      try {
        setLayouts(JSON.parse(storedLayouts));
      } catch (error) {
        console.error("Failed to parse stored layouts:", error);
      }
    }
    setMounted(true);
  }, []);

  const handleLayoutChange = useCallback(
    (_: Layout[], allLayouts: Layouts) => {
      // Ensure all heights are exactly 2 or 4 and width constraints are enforced before saving
      const enforcedLayouts = { ...allLayouts };
      Object.keys(enforcedLayouts).forEach((breakpoint) => {
        enforcedLayouts[breakpoint] = enforcedLayouts[breakpoint].map((item) =>
          enforceLayoutItemConstraints(item, breakpoint)
        );
      });

      setLayouts(enforcedLayouts);

      // Safe localStorage save with error handling
      try {
        const serialized = JSON.stringify(enforcedLayouts);
        if (serialized.length > 4.5 * 1024 * 1024) {
          // 4.5MB safety margin
          console.error("Layout data too large for localStorage");
          console.warn(
            "Layout is too complex and may not be saved. Consider resetting to default."
          );
          return;
        }
        localStorage.setItem(
          "verifywise_integrated_dashboard_layouts",
          serialized
        );
      } catch (error) {
        if (error instanceof DOMException && error.code === 22) {
          console.error("localStorage quota exceeded:", error);
          console.warn(
            "Storage quota exceeded. Layout changes not saved. Try resetting layout."
          );
        } else {
          console.error("Failed to save layout to localStorage:", error);
        }
      }
    },
    [enforceLayoutItemConstraints]
  );

  // Handle resize to enforce constraints: height 2 or 4, width constraints
  const handleResize = useCallback(
    (
      _: Layout[],
      __: Layout,
      newItem: Layout,
      placeholder: Layout,
      ___: MouseEvent,
      ____: HTMLElement
    ) => {
      const isRestricted = isRestrictedToSmallHeight(newItem.i);

      // Enforce height constraints
      if (newItem.h !== undefined) {
        const constrainedHeight = enforceHeightConstraint(
          newItem.h,
          isRestricted
        );
        newItem.h = constrainedHeight;
        placeholder.h = constrainedHeight;
      }

      // Enforce width constraints (use 'lg' breakpoint for real-time resize)
      if (newItem.w !== undefined) {
        const constrainedWidth = enforceWidthConstraint(
          newItem.w,
          isRestricted,
          "lg"
        );
        newItem.w = constrainedWidth;
        placeholder.w = constrainedWidth;
      }
    },
    [isRestrictedToSmallHeight, enforceHeightConstraint, enforceWidthConstraint]
  );

  // Ensure final constraints when resize stops
  const handleResizeStop = useCallback(
    (
      _: Layout[],
      __: Layout,
      newItem: Layout,
      ___: Layout,
      ____: MouseEvent,
      _____: HTMLElement
    ) => {
      const isUnlimited = false;

      // Update all responsive layouts to ensure consistency across breakpoints
      setLayouts((prevLayouts) => {
        const updatedLayouts = { ...prevLayouts };
        Object.keys(updatedLayouts).forEach((breakpoint) => {
          updatedLayouts[breakpoint] = updatedLayouts[breakpoint].map(
            (item) => {
              if (item.i === newItem.i) {
                if (isUnlimited) {
                  // For unlimited widgets, just update with new dimensions
                  return { ...item, h: newItem.h, w: newItem.w };
                } else {
                  // Apply constraints using the current item dimensions from the resize
                  return enforceLayoutItemConstraints(
                    { ...item, h: newItem.h, w: newItem.w },
                    breakpoint
                  );
                }
              }
              return item;
            }
          );
        });

        // Safe localStorage save with error handling
        try {
          const serialized = JSON.stringify(updatedLayouts);
          if (serialized.length > 4.5 * 1024 * 1024) {
            // 4.5MB safety margin
            console.error("Layout data too large for localStorage");
            console.warn(
              "Layout is too complex and may not be saved. Consider resetting to default."
            );
          } else {
            localStorage.setItem(
              "verifywise_integrated_dashboard_layouts",
              serialized
            );
          }
        } catch (error) {
          if (error instanceof DOMException && error.code === 22) {
            console.error("localStorage quota exceeded:", error);
            console.warn(
              "Storage quota exceeded. Layout changes not saved. Try resetting layout."
            );
          } else {
            console.error("Failed to save layout to localStorage:", error);
          }
        }

        return updatedLayouts;
      });
    },
    [enforceLayoutItemConstraints]
  );

  
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  if (!mounted) return null;

  // Widget definitions with your actual dashboard data
  const widgets = [
    {
      id: "projects",
      content: (
        <MetricCard
          title="Use cases"
          value={dashboard?.projects_list?.filter((p) => !p.is_organizational)?.length || 0}
          onClick={() => navigate("/overview")}
          navigable={true}
          backgroundIcon={Lightbulb}
        />
      ),
      title: "Use cases",
    },
    {
      id: "evidences",
      content: (
        <MetricCard
          title="Evidence"
          value={evidenceMetrics?.total || 0}
          onClick={() => navigate("/file-manager")}
          navigable={true}
          backgroundIcon={FileText}
        />
      ),
      title: "Evidence",
    },
    {
      id: "reports",
      content: (
        <MetricCard
          title="Reports"
          value={dashboard?.reports || 0}
          onClick={() => navigate("/reporting")}
          navigable={true}
          backgroundIcon={BarChart3}
        />
      ),
      title: "Reports",
    },
    {
      id: "users",
      content: (
        <MetricCard
          title="Users"
          value={usersMetrics?.total || 0}
          onClick={() => navigate("/settings")}
          navigable={true}
          backgroundIcon={Users}
        />
      ),
      title: "Users",
    },
    {
      id: "models",
      content: (
        <MetricCard
          title="Models"
          value={dashboard?.models || 0}
          onClick={() => navigate("/model-inventory")}
          navigable={true}
          statusData={getDefaultStatusDistribution(
            "models",
            dashboard?.models || 0
          )}
          entityType="models"
          backgroundIcon={Brain}
        />
      ),
      title: "AI Models",
    },
    {
      id: "vendors",
      content: (
        <MetricCard
          title="Vendors"
          value={vendorMetrics?.total || 0}
          onClick={() => navigate("/vendors")}
          navigable={true}
          statusData={vendorMetrics?.statusDistribution?.map((item) => ({
            ...item,
            label: item.name,
          }))}
          entityType="vendors"
          backgroundIcon={Building2}
        />
      ),
      title: "Vendors",
    },
    {
      id: "vendor-risks",
      content: (
        <MetricCard
          title="Vendor Risks"
          value={vendorRiskMetrics?.total || 0}
          onClick={() => navigate("/vendors/risks")}
          navigable={true}
          statusData={vendorRiskMetrics?.statusDistribution?.map((item) => ({
            ...item,
            label: item.name,
          }))}
          entityType="vendorRisks"
          backgroundIcon={ShieldAlert}
        />
      ),
      title: "Vendor Risks",
    },
    {
      id: "trainings",
      content: (
        <MetricCard
          title="Trainings"
          value={dashboard?.trainings || 0}
          onClick={() => navigate("/training")}
          navigable={true}
          statusData={getDefaultStatusDistribution(
            "trainings",
            dashboard?.trainings || 0
          )}
          entityType="trainings"
          backgroundIcon={GraduationCap}
        />
      ),
      title: "Trainings",
    },
    {
      id: "policies",
      content: (
        <MetricCard
          title="Policies"
          value={policyMetrics?.total || 0}
          onClick={() => navigate("/policies")}
          navigable={true}
          statusData={policyMetrics?.statusDistribution?.map((item) => ({
            ...item,
            label: item.name,
          }))}
          entityType="policies"
          backgroundIcon={ScrollText}
        />
      ),
      title: "Policies",
    },
    {
      id: "incidents",
      content: (
        <MetricCard
          title="Incidents"
          value={incidentMetrics?.total || 0}
          onClick={() => navigate("/ai-incident-managements")}
          navigable={true}
          statusData={incidentMetrics?.statusDistribution?.map((item) => ({
            ...item,
            label: item.name,
          }))}
          entityType="incidents"
          backgroundIcon={AlertCircle}
        />
      ),
      title: "Incidents",
    },
  ];

  return (
    <Box sx={{ pb: 3 }}>
      <PageBreadcrumbs />

      {/* Password notification */}
      {showPasswordNotification && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant="warning"
            title="Set Your Password"
            body="You signed in with Google but haven't set a password yet. For account security, please set a password that you can use to access your account."
            isToast={true}
            onClick={() => {
              setShowPasswordNotification(false);
            }}
          />
        </Suspense>
      )}

      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1.5}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 400,
              fontSize: "1.5rem",
            }}
          >
            <Box component="span" sx={{ color: "#13715B" }}>
              {greeting.greetingText}
            </Box>
            <Box component="span" sx={{ color: (theme) => theme.palette.text.primary }}>
              , {greeting.text.split(', ')[1]}
            </Box>
          </Typography>
          <Typography
            variant="body2"
            sx={(theme) => ({
              color: theme.palette.text.tertiary,
              fontSize: theme.typography.fontSize,
              fontWeight: 400,
            })}
          >
            Here is an overview of your AI governance platform
          </Typography>
        </Box>

        {/* Edit Mode Controls */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {editMode && (
            <Typography
              variant="body2"
              color="primary"
              sx={{ fontWeight: 500, fontSize: "13px" }}
            >
              Edit mode active
            </Typography>
          )}
          <Tooltip
            title={
              editMode
                ? "Lock layout (view mode)"
                : "Unlock layout (edit mode) - Click again to show/hide cards"
            }
          >
            <IconButton
              data-joyride-id="edit-mode-toggle"
              onClick={() => {
                if (editMode) {
                  setEditMode(false);
                  setShowHideSelector(false);
                } else {
                  setEditMode(true);
                  setShowHideSelector(true);
                }
              }}
              color="primary"
              size="medium"
            >
              {editMode ? (
                <LockOpen
                  size={20}
                  color="#344054"
                  strokeWidth={1.5}
                />
              ) : (
                <Lock
                  size={20}
                  color="#344054"
                  strokeWidth={1.5}
                />
              )}
            </IconButton>
          </Tooltip>

          {/* Show/Hide Selector - appears when lock is clicked once */}
          {showHideSelector && (
            <VerifyWiseMultiSelect
              options={widgets.map((widget) => ({
                value: widget.id,
                label: widget.title,
              }))}
              selectedValues={Array.from(visibleCards)}
              onChange={(values) => setVisibleCards(new Set(values))}
              placeholder="Show/hide cards"
              minWidth={120}
              height={32}
            />
          )}


          {/* Add New Dropdown */}
          <Box data-joyride-id="add-new-dropdown">
            <MegaDropdownErrorBoundary>
              <AddNewMegaDropdown />
            </MegaDropdownErrorBoundary>
          </Box>
        </Box>
      </Stack>

      {/* CSS for drag and drop */}
      <style>{`
        .react-grid-layout {
          position: relative;
          margin-top: 20px;
          ${
            editMode
              ? `
            background-image:
              linear-gradient(${alpha(
                theme.palette.divider,
                0.1
              )} 1px, transparent 1px),
              linear-gradient(90deg, ${alpha(
                theme.palette.divider,
                0.1
              )} 1px, transparent 1px);
            background-size: calc(100% / 12) 42.5px;
            background-position: 0 0, 0 0;
          `
              : ""
          }
        }

        .react-grid-item {
          transition: all 200ms ease;
        }

        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }

        .react-grid-item.resizing {
          z-index: 100;
          will-change: width, height;
        }

        .react-grid-item.react-draggable-dragging {
          z-index: 100;
          will-change: transform;
          opacity: 0.6;
          box-shadow: 0 12px 24px rgba(0,0,0,0.2) !important;
        }

        /* Multiple resize handles styling */
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }

        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          border: 2px solid transparent;
          transition: border-color 0.2s ease;
        }

        .react-grid-item > .react-resizable-handle-se {
          bottom: 0;
          right: 0;
          cursor: se-resize;
        }

        .react-grid-item > .react-resizable-handle-se::after {
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid transparent;
          border-bottom: 2px solid transparent;
        }

        .react-grid-item > .react-resizable-handle-sw {
          bottom: 0;
          left: 0;
          cursor: sw-resize;
        }

        .react-grid-item > .react-resizable-handle-sw::after {
          left: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-left: 2px solid transparent;
          border-bottom: 2px solid transparent;
        }

        .react-grid-item > .react-resizable-handle-ne {
          top: 0;
          right: 0;
          cursor: ne-resize;
        }

        .react-grid-item > .react-resizable-handle-ne::after {
          right: 3px;
          top: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid transparent;
          border-top: 2px solid transparent;
        }

        .react-grid-item > .react-resizable-handle-nw {
          top: 0;
          left: 0;
          cursor: nw-resize;
        }

        .react-grid-item > .react-resizable-handle-nw::after {
          left: 3px;
          top: 3px;
          width: 5px;
          height: 5px;
          border-left: 2px solid transparent;
          border-top: 2px solid transparent;
        }

        .react-grid-item > .react-resizable-handle-s {
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          cursor: s-resize;
          width: 40px;
          height: 10px;
        }

        .react-grid-item > .react-resizable-handle-n {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          cursor: n-resize;
          width: 40px;
          height: 10px;
        }

        .react-grid-item > .react-resizable-handle-e {
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          cursor: e-resize;
          width: 10px;
          height: 40px;
        }

        .react-grid-item > .react-resizable-handle-w {
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          cursor: w-resize;
          width: 10px;
          height: 40px;
        }

        .react-grid-placeholder {
          background: #E2E8F0 !important;
          background-image: radial-gradient(circle, #64748B 1px, transparent 1px) !important;
          background-size: 10px 10px !important;
          border: 2px dashed #94A3B8 !important;
          border-radius: 8px;
          z-index: 2;
          transition: all 200ms ease;
        }

        .widget-card-header {
          cursor: ${editMode ? "grab" : "default"};
          user-select: ${editMode ? "none" : "auto"};
        }

        .widget-card-header:active {
          cursor: ${editMode ? "grabbing" : "default"};
        }

        /* Handles remain invisible - no visual indicators */
      `}</style>

      {/* Grid Layout or Empty State */}
      <Box data-joyride-id="dashboard-widgets">
        {visibleCards.size === 0 ? (
          <Stack
            alignItems="center"
            sx={{
              border: "1px solid #EEEEEE",
              borderRadius: "4px",
              paddingTop: "100px",
              paddingBottom: "80px",
              paddingLeft: "20px",
              paddingRight: "20px",
              gap: "20px",
              minHeight: 400,
              backgroundColor: "#FFFFFF",
              textAlign: "center",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <img src={placeholderImage} alt="No cards visible" />
            <Typography
              sx={{
                fontSize: "13px",
                color: (theme) => theme.palette.text.tertiary,
              }}
            >
              This space looks a bit empty. You can add all cards to this dashboard to see a general overview of your AI governance status.{" "}
              <Typography
                component="span"
                onClick={() => {
                  const allWidgetIds = new Set(widgets.map((w) => w.id));
                  setVisibleCards(allWidgetIds);
                  localStorage.setItem(
                    "dashboardVisibleCards",
                    JSON.stringify(Array.from(allWidgetIds))
                  );
                }}
                sx={{
                  fontSize: "13px",
                  color: "#13715B",
                  cursor: "pointer",
                  textDecoration: "underline",
                  "&:hover": {
                    color: "#0f604d",
                  },
                }}
              >
                Click here to add all cards
              </Typography>
            </Typography>
          </Stack>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            onResize={handleResize}
            onResizeStop={handleResizeStop}
            breakpoints={{ lg: 1200, md: 996, sm: 768 }}
            cols={{ lg: 12, md: 10, sm: 6 }}
            rowHeight={42.5}
            isDraggable={editMode}
            isResizable={editMode}
            draggableHandle=".widget-card-header"
            resizeHandles={["se", "sw", "ne", "nw", "s", "e", "n", "w"]}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            useCSSTransforms={true}
            compactType="vertical"
            preventCollision={false}
            autoSize={true}
            isBounded={true}
          >
            {widgets
              .filter((widget) => visibleCards.has(widget.id))
              .map((widget) => (
                <Card
                  key={widget.id}
                  data-joyride-id={widget.id === "projects" ? "widget-card" : undefined}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxShadow: "none",
                    border: `1px solid #DCDFE3`,
                    backgroundColor: "inherit",
                    "& .MuiCard-root": {
                      height: "100%",
                      margin: 0,
                    },
                  }}
                >
                  {editMode && (
                    <CardHeader
                      className="widget-card-header"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        py: 1,
                        px: 2,
                        "& .MuiCardHeader-title": {
                          fontSize: "0.875rem",
                          fontWeight: 500,
                        },
                      }}
                      avatar={
                        <GripVertical
                          size={16}
                          color={alpha(theme.palette.text.secondary, 0.6)}
                        />
                      }
                      title={widget.title}
                    />
                  )}
                  <Box sx={{ flexGrow: 1, p: 0, height: "100%" }}>
                    <WidgetErrorBoundary
                      widgetId={widget.id}
                      widgetTitle={widget.title}
                    >
                      {widget.content}
                    </WidgetErrorBoundary>
                  </Box>
                </Card>
              ))}
          </ResponsiveGridLayout>
        )}
      </Box>

      {/* Page Tour */}
      <PageTour steps={DashboardSteps} run={true} tourKey="dashboard-tour" />
    </Box>
  );
};

// Wrap the dashboard with error boundary for better error handling
const ProtectedIntegratedDashboard: React.FC = () => {
  return (
    <DashboardErrorBoundary>
      <IntegratedDashboard />
    </DashboardErrorBoundary>
  );
};

export default ProtectedIntegratedDashboard;
