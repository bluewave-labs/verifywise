/**
 * Generic Calendar Widget Template
 *
 * A reusable widget template that displays a read-only calendar with events/deadlines.
 * Plugins can use this template by specifying "calendar" as the template type.
 *
 * Expected API Response:
 * {
 *   success: true,
 *   data: {
 *     events: [
 *       {
 *         id: "1",
 *         title: "Audit Due",
 *         date: "2024-01-15",
 *         type?: "deadline" | "event" | "reminder" | "milestone",
 *         color?: "#dc2626",
 *         url?: "/audits/123"
 *       },
 *       ...
 *     ],
 *     total: 10
 *   }
 * }
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, CircularProgress, Stack, IconButton } from "@mui/material";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Circle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type?: "deadline" | "event" | "reminder" | "milestone";
  color?: string;
  url?: string;
}

interface CalendarData {
  events: CalendarEvent[];
  total: number;
}

interface CalendarWidgetProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: {
    refreshInterval?: number;
    showHeader?: boolean;
    highlightToday?: boolean;
    emptyMessage?: string;
  };
}

// Type to color mapping
const typeColors: Record<string, string> = {
  deadline: "#dc2626",
  event: "#2563eb",
  reminder: "#d97706",
  milestone: "#16a34a",
};

// Get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Get first day of month (0 = Sunday)
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Format date as YYYY-MM-DD
function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  pluginId,
  endpoint,
  title = "Calendar",
  config = {},
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    refreshInterval,
    showHeader = true,
    highlightToday = true,
    emptyMessage = "No events this month",
  } = config;

  const fetchData = useCallback(async () => {
    try {
      // Fetch events for the current month range
      const startDate = formatDate(currentYear, currentMonth, 1);
      const endDate = formatDate(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));

      const response = await apiServices.get(
        `/plugins/${pluginId}${endpoint}?start=${startDate}&end=${endDate}`
      );
      const data = response.data as { success: boolean; data?: CalendarData; error?: string };

      if (data.success && data.data) {
        setCalendarData(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load calendar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar");
    } finally {
      setIsLoading(false);
    }
  }, [pluginId, endpoint, currentYear, currentMonth]);

  useEffect(() => {
    fetchData();

    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    if (!calendarData?.events) return {};

    const grouped: Record<string, CalendarEvent[]> = {};
    calendarData.events.forEach((event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return grouped;
  }, [calendarData]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleEventClick = (url: string) => {
    window.location.href = url;
  };

  // Generate calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  // Add empty cells for days before the first day
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add remaining empty cells
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (isLoading) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={24} sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: "100%", p: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>{title}</Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#dc2626", mb: 1 }}>{error}</Typography>
          <Typography
            onClick={fetchData}
            sx={{
              fontSize: 12,
              color: "#13715B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            <RefreshCw size={12} /> Retry
          </Typography>
        </Box>
      </Box>
    );
  }

  const todayDate = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <Box sx={{ height: "100%", p: 2, overflow: "auto" }}>
      {showHeader && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{title}</Typography>
          <Typography
            onClick={fetchData}
            sx={{
              fontSize: 11,
              color: "#999",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              "&:hover": { color: "#13715B" },
            }}
          >
            <RefreshCw size={11} />
          </Typography>
        </Stack>
      )}

      {/* Month navigation */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <IconButton
          size="small"
          onClick={handlePrevMonth}
          sx={{ p: 0.5, color: "#666", "&:hover": { backgroundColor: "#f5f5f5" } }}
        >
          <ChevronLeft size={16} />
        </IconButton>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#000" }}>
          {monthNames[currentMonth]} {currentYear}
        </Typography>
        <IconButton
          size="small"
          onClick={handleNextMonth}
          sx={{ p: 0.5, color: "#666", "&:hover": { backgroundColor: "#f5f5f5" } }}
        >
          <ChevronRight size={16} />
        </IconButton>
      </Stack>

      {/* Day headers */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.5,
          mb: 0.5,
        }}
      >
        {dayNames.map((day) => (
          <Typography
            key={day}
            sx={{
              fontSize: 10,
              fontWeight: 600,
              color: "#999",
              textAlign: "center",
              py: 0.5,
            }}
          >
            {day}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.5,
        }}
      >
        {weeks.flat().map((day, index) => {
          if (day === null) {
            return <Box key={`empty-${index}`} sx={{ aspectRatio: "1", minHeight: 28 }} />;
          }

          const dateStr = formatDate(currentYear, currentMonth, day);
          const dayEvents = eventsByDate[dateStr] || [];
          const isToday = highlightToday && dateStr === todayDate;

          return (
            <Box
              key={dateStr}
              sx={{
                aspectRatio: "1",
                minHeight: 28,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                borderRadius: "4px",
                backgroundColor: isToday ? "#13715B" : dayEvents.length > 0 ? "#f9fafb" : "transparent",
                cursor: dayEvents.length > 0 ? "pointer" : "default",
                transition: "background-color 0.15s",
                "&:hover": dayEvents.length > 0 ? { backgroundColor: isToday ? "#0f5f4c" : "#f0f0f0" } : {},
                pt: 0.25,
              }}
              title={dayEvents.map((e) => e.title).join(", ")}
              onClick={() => {
                if (dayEvents.length === 1 && dayEvents[0].url) {
                  handleEventClick(dayEvents[0].url);
                }
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: isToday ? 600 : 400,
                  color: isToday ? "#fff" : "#000",
                }}
              >
                {day}
              </Typography>
              {dayEvents.length > 0 && (
                <Stack direction="row" spacing={0.25} sx={{ mt: 0.25 }}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <Circle
                      key={event.id}
                      size={4}
                      fill={event.color || typeColors[event.type || "event"] || "#2563eb"}
                      color={event.color || typeColors[event.type || "event"] || "#2563eb"}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Event list for current month */}
      {calendarData?.events && calendarData.events.length > 0 ? (
        <Box sx={{ mt: 2, borderTop: "1px solid #e5e7eb", pt: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#666", mb: 1 }}>
            Upcoming this month
          </Typography>
          <Stack spacing={0.75}>
            {calendarData.events.slice(0, 5).map((event) => (
              <Stack
                key={event.id}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  cursor: event.url ? "pointer" : "default",
                  "&:hover": event.url ? { opacity: 0.8 } : {},
                }}
                onClick={() => event.url && handleEventClick(event.url)}
              >
                <Circle
                  size={6}
                  fill={event.color || typeColors[event.type || "event"] || "#2563eb"}
                  color={event.color || typeColors[event.type || "event"] || "#2563eb"}
                />
                <Typography sx={{ fontSize: 11, color: "#000", flex: 1 }} noWrap>
                  {event.title}
                </Typography>
                <Typography sx={{ fontSize: 10, color: "#999" }}>
                  {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </Typography>
              </Stack>
            ))}
          </Stack>
          {calendarData.events.length > 5 && (
            <Typography sx={{ fontSize: 10, color: "#999", mt: 1, textAlign: "center" }}>
              +{calendarData.events.length - 5} more events
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ mt: 2, borderTop: "1px solid #e5e7eb", pt: 2 }}>
          <Stack alignItems="center" spacing={0.5}>
            <CalendarIcon size={16} color="#999" />
            <Typography sx={{ fontSize: 11, color: "#999" }}>{emptyMessage}</Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default CalendarWidget;
