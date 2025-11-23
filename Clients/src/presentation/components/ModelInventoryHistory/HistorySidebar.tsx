import React from "react";
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  useTheme,
  Collapse,
} from "@mui/material";
import { Clock } from "lucide-react";
import {
  useModelInventoryChangeHistory,
  ModelInventoryChangeHistoryEntry,
} from "../../../application/hooks/useModelInventoryChangeHistory";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  modelInventoryId?: number;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  modelInventoryId,
}) => {
  const theme = useTheme();
  const { data: history = [], isLoading } =
    useModelInventoryChangeHistory(modelInventoryId);

  // Group history entries by change event (by changed_at timestamp)
  const groupedHistory = React.useMemo(() => {
    const groups: { [key: string]: ModelInventoryChangeHistoryEntry[] } = {};

    history.forEach((entry) => {
      // Only include entries with field_name (skip action-only markers)
      if (entry.field_name) {
        const key = `${entry.changed_at}_${entry.action}_${entry.changed_by_user_id}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(entry);
      }
    });

    return Object.values(groups).sort((a, b) => {
      // Sort by timestamp descending (newest first)
      return (
        new Date(b[0].changed_at).getTime() -
        new Date(a[0].changed_at).getTime()
      );
    });
  }, [history]);

  const renderHistoryEntry = (group: ModelInventoryChangeHistoryEntry[]) => {
    const firstEntry = group[0];
    const userName =
      firstEntry.user_name && firstEntry.user_surname
        ? `${firstEntry.user_name} ${firstEntry.user_surname}`
        : firstEntry.user_email || "Unknown User";

    const timeAgo = dayjs(firstEntry.changed_at).fromNow();
    const fullDate = dayjs(firstEntry.changed_at).format(
      "MMMM D, YYYY [at] h:mm A"
    );

    return (
      <Box
        key={`${firstEntry.changed_at}_${firstEntry.id}`}
        sx={{
          mb: 3,
          pb: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          "&:last-child": {
            borderBottom: "none",
          },
        }}
      >
        {/* Header */}
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 500,
                color: theme.palette.text.primary,
              }}
            >
              {firstEntry.action === "created" &&
                `${userName} created this model`}
              {firstEntry.action === "updated" &&
                `${userName} updated ${group.length} field${
                  group.length > 1 ? "s" : ""
                }`}
              {firstEntry.action === "deleted" &&
                `${userName} deleted this model`}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={10} color={theme.palette.text.secondary} />
              <Typography
                sx={{
                  fontSize: 10,
                  color: theme.palette.text.secondary,
                }}
                title={fullDate}
              >
                {timeAgo}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {/* Field Changes */}
        {group.map((entry) => {
          if (!entry.field_name) return null;

          return (
            <Box
              key={entry.id}
              sx={{
                mb: 1.5,
                pl: 4.5,
                "&:last-child": {
                  mb: 0,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  mb: 0.75,
                }}
              >
                {entry.field_name}
              </Typography>

              {/* Show change based on action type */}
              {entry.action === "created" &&
              entry.new_value &&
              entry.new_value !== "-" ? (
                <Box
                  sx={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    backgroundColor: "#D1FAE5",
                    border: "1px solid #6EE7B7",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 9,
                      color: "#065F46",
                      fontWeight: 500,
                      mb: 0.3,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Initial Value
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: "#065F46",
                      fontWeight: 400,
                      wordBreak: "break-word",
                    }}
                  >
                    {entry.new_value}
                  </Typography>
                </Box>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                  {/* Old Value */}
                  {entry.old_value && entry.old_value !== "-" && (
                    <Box
                      sx={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: "4px",
                        backgroundColor: "#FEE2E2",
                        border: "1px solid #FCA5A5",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 9,
                          color: "#991B1B",
                          fontWeight: 500,
                          mb: 0.3,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Previous
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 10,
                          color: "#991B1B",
                          fontWeight: 400,
                          wordBreak: "break-word",
                        }}
                      >
                        {entry.old_value}
                      </Typography>
                    </Box>
                  )}

                  {/* Arrow */}
                  {entry.old_value &&
                    entry.old_value !== "-" &&
                    entry.new_value &&
                    entry.new_value !== "-" && (
                      <Typography
                        sx={{
                          fontSize: 14,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        →
                      </Typography>
                    )}

                  {/* New Value */}
                  {entry.new_value && entry.new_value !== "-" && (
                    <Box
                      sx={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: "4px",
                        backgroundColor: "#D1FAE5",
                        border: "1px solid #6EE7B7",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 9,
                          color: "#065F46",
                          fontWeight: 500,
                          mb: 0.3,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Current
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 10,
                          color: "#065F46",
                          fontWeight: 400,
                          wordBreak: "break-word",
                        }}
                      >
                        {entry.new_value}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Collapse in={isOpen} orientation="horizontal" timeout={300}>
      <Box
        sx={{
          width: "320px",
          height: "100%",
          marginLeft: "16px", // 16px padding from main content
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            height: "100%",
            border: `1px solid #E0E4E9`,
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FAFBFC",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              background: "linear-gradient(180deg, #F8FAFB 0%, #F3F5F8 100%)",
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Activity History
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: theme.palette.text.secondary,
                mt: 0.5,
              }}
            >
              Track all changes to this model
            </Typography>
          </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 200,
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : groupedHistory.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                textAlign: "center",
              }}
            >
              <Clock size={40} color={theme.palette.text.secondary} />
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mt: 2,
                }}
              >
                No history yet
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  color: theme.palette.text.secondary,
                  mt: 1,
                }}
              >
                Changes will appear here
              </Typography>
            </Box>
          ) : (
            <Box>{groupedHistory.map(renderHistoryEntry)}</Box>
          )}
        </Box>
        </Box>
      </Box>
    </Collapse>
  );
};

export default HistorySidebar;
