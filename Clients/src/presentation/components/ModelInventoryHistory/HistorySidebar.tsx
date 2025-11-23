import React from "react";
import {
  Box,
  Typography,
  Drawer,
  Stack,
  CircularProgress,
  Chip,
  useTheme,
  IconButton,
} from "@mui/material";
import { X as CloseIcon, Clock } from "lucide-react";
import { useModelInventoryChangeHistory, ModelInventoryChangeHistoryEntry } from "../../../application/hooks/useModelInventoryChangeHistory";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(relativeTime);
dayjs.extend(utc);

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
  const { data: history = [], isLoading } = useModelInventoryChangeHistory(modelInventoryId);

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
      return new Date(b[0].changed_at).getTime() - new Date(a[0].changed_at).getTime();
    });
  }, [history]);

  const renderHistoryEntry = (group: ModelInventoryChangeHistoryEntry[]) => {
    const firstEntry = group[0];
    const userName = firstEntry.user_name && firstEntry.user_surname
      ? `${firstEntry.user_name} ${firstEntry.user_surname}`
      : firstEntry.user_email || "Unknown User";

    const timeAgo = dayjs(firstEntry.changed_at).fromNow();
    const fullDate = dayjs(firstEntry.changed_at).format("MMMM D, YYYY [at] h:mm A");

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
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: theme.palette.text.primary,
              }}
            >
              {firstEntry.action === "created" && `${userName} created this model`}
              {firstEntry.action === "updated" && `${userName} updated ${group.length} field${group.length > 1 ? "s" : ""}`}
              {firstEntry.action === "deleted" && `${userName} deleted this model`}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={12} color={theme.palette.text.secondary} />
              <Typography
                sx={{
                  fontSize: 11,
                  color: theme.palette.text.secondary,
                }}
                title={fullDate}
              >
                {timeAgo}
              </Typography>
            </Stack>
          </Box>
          <Chip
            label={firstEntry.action.toUpperCase()}
            size="small"
            sx={{
              height: 20,
              fontSize: 10,
              fontWeight: 600,
              backgroundColor:
                firstEntry.action === "created"
                  ? "#D1FAE5"
                  : firstEntry.action === "updated"
                  ? "#DBEAFE"
                  : "#FEE2E2",
              color:
                firstEntry.action === "created"
                  ? "#065F46"
                  : firstEntry.action === "updated"
                  ? "#1E40AF"
                  : "#991B1B",
            }}
          />
        </Stack>

        {/* Field Changes */}
        {group.map((entry) => {
          if (!entry.field_name) return null;

          return (
            <Box
              key={entry.id}
              sx={{
                mb: 2,
                pl: 5,
                "&:last-child": {
                  mb: 0,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  mb: 1,
                }}
              >
                {entry.field_name}
              </Typography>

              {/* Show change based on action type */}
              {entry.action === "created" && entry.new_value && entry.new_value !== "-" ? (
                <Box
                  sx={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    backgroundColor: "#D1FAE5",
                    border: "1px solid #6EE7B7",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: "#065F46",
                      fontWeight: 500,
                      mb: 0.5,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Initial Value
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "#065F46",
                      fontWeight: 400,
                      wordBreak: "break-word",
                    }}
                  >
                    {entry.new_value}
                  </Typography>
                </Box>
              ) : (
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Old Value */}
                  {entry.old_value && entry.old_value !== "-" && (
                    <Box
                      sx={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        backgroundColor: "#FEE2E2",
                        border: "1px solid #FCA5A5",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 10,
                          color: "#991B1B",
                          fontWeight: 500,
                          mb: 0.5,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Previous
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
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
                  {entry.old_value && entry.old_value !== "-" && entry.new_value && entry.new_value !== "-" && (
                    <Typography
                      sx={{
                        fontSize: 16,
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
                        padding: "8px 12px",
                        borderRadius: "6px",
                        backgroundColor: "#D1FAE5",
                        border: "1px solid #6EE7B7",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 10,
                          color: "#065F46",
                          fontWeight: 500,
                          mb: 0.5,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Current
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
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
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 450, md: 500 },
          maxWidth: "95vw",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: "linear-gradient(180deg, #F8FAFB 0%, #F3F5F8 100%)",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            Activity History
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            <CloseIcon size={20} />
          </IconButton>
        </Stack>
        <Typography
          sx={{
            fontSize: 13,
            color: theme.palette.text.secondary,
            mt: 1,
          }}
        >
          Track all changes made to this model
        </Typography>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 3,
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
            <CircularProgress size={32} />
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
            <Clock size={48} color={theme.palette.text.secondary} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 500,
                color: theme.palette.text.primary,
                mt: 2,
              }}
            >
              No history yet
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: theme.palette.text.secondary,
                mt: 1,
              }}
            >
              Changes to this model will appear here
            </Typography>
          </Box>
        ) : (
          <Box>{groupedHistory.map(renderHistoryEntry)}</Box>
        )}
      </Box>
    </Drawer>
  );
};

export default HistorySidebar;
