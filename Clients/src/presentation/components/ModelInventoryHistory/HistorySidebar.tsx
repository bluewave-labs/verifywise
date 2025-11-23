import React from "react";
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  useTheme,
  Collapse,
  Avatar,
} from "@mui/material";
import { Clock } from "lucide-react";
import {
  useModelInventoryChangeHistory,
  ModelInventoryChangeHistoryEntry,
} from "../../../application/hooks/useModelInventoryChangeHistory";
import { useAuth } from "../../../application/hooks/useAuth";
import { useProfilePhotoFetch } from "../../../application/hooks/useProfilePhotoFetch";
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
  const { userId: currentUserId } = useAuth();
  const { data: history = [], isLoading } =
    useModelInventoryChangeHistory(modelInventoryId);
  const { fetchProfilePhotoAsBlobUrl } = useProfilePhotoFetch();
  const [avatarUrls, setAvatarUrls] = React.useState<{ [userId: number]: string | null }>({});

  // Fetch avatars for all users in the history
  React.useEffect(() => {
    const fetchAvatars = async () => {
      const uniqueUserIds = Array.from(
        new Set(history.map((entry) => entry.changed_by_user_id))
      );

      for (const userId of uniqueUserIds) {
        if (avatarUrls[userId] === undefined) {
          const avatarUrl = await fetchProfilePhotoAsBlobUrl(userId);
          setAvatarUrls((prev) => ({ ...prev, [userId]: avatarUrl }));
        }
      }
    };

    if (history.length > 0) {
      fetchAvatars();
    }
  }, [history, fetchProfilePhotoAsBlobUrl]);

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

  // Find the creation entry for the header
  const creationEntry = React.useMemo(() => {
    return history.find((entry) => entry.action === "created");
  }, [history]);

  const creationInfo = React.useMemo(() => {
    if (!creationEntry) return null;

    const isCurrentUser = creationEntry.changed_by_user_id === currentUserId;
    const creatorName = isCurrentUser
      ? "you"
      : creationEntry.user_name && creationEntry.user_surname
      ? `${creationEntry.user_name} ${creationEntry.user_surname}`
      : creationEntry.user_email || "Unknown User";

    const creationDate = dayjs(creationEntry.changed_at).format("MMMM D, YYYY");
    const creationTime = dayjs(creationEntry.changed_at).format("h:mm A");

    return { creatorName, creationDate, creationTime };
  }, [creationEntry, currentUserId]);

  // Find the most recent update for fallback header
  const lastUpdateInfo = React.useMemo(() => {
    if (history.length === 0) return null;

    // Sort history by timestamp and get the most recent
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    );
    const lastEntry = sortedHistory[0];

    const updateDate = dayjs(lastEntry.changed_at).format("MMMM D, YYYY");
    const updateTime = dayjs(lastEntry.changed_at).format("h:mm A");

    return { updateDate, updateTime };
  }, [history]);

  const renderHistoryEntry = (group: ModelInventoryChangeHistoryEntry[]) => {
    const firstEntry = group[0];
    const isCurrentUser = firstEntry.changed_by_user_id === currentUserId;
    const userName = isCurrentUser
      ? "You"
      : firstEntry.user_name && firstEntry.user_surname
      ? `${firstEntry.user_name} ${firstEntry.user_surname}`
      : firstEntry.user_email || "Unknown User";

    const updateDate = dayjs(firstEntry.changed_at).format("MMMM D, YYYY");
    const updateTime = dayjs(firstEntry.changed_at).format("h:mm A");

    return (
      <Box
        key={`${firstEntry.changed_at}_${firstEntry.id}`}
        sx={{
          marginBottom: "32px",
          "&:last-child": {
            marginBottom: 0,
          },
        }}
      >
        {/* Header */}
        <Stack direction="row" gap="8px" alignItems="center" marginBottom="8px">
          <Avatar
            src={avatarUrls[firstEntry.changed_by_user_id] || undefined}
            alt={userName}
            sx={{
              width: 28,
              height: 28,
              backgroundColor: theme.palette.primary.main,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 500,
                color: theme.palette.text.primary,
                textDecoration: firstEntry.action === "updated" ? "underline" : "none",
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
            <Stack direction="row" gap="8px" alignItems="center">
              <Clock size={10} color={theme.palette.text.secondary} />
              <Typography
                sx={{
                  fontSize: 10,
                  color: theme.palette.text.secondary,
                }}
              >
                {updateDate} at {updateTime}
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
                marginBottom: "8px",
                paddingLeft: "36px",
                "&:last-child": {
                  marginBottom: 0,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  marginBottom: "8px",
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
                <Stack direction="row" gap="8px" alignItems="center">
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
    <Collapse
      in={isOpen}
      orientation="horizontal"
      timeout={300}
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          width: "320px",
          height: "100%",
          minHeight: 0,
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
              padding: "16px",
              borderBottom: `1px solid ${theme.palette.divider}`,
              background: "linear-gradient(180deg, #F8FAFB 0%, #F3F5F8 100%)",
            }}
          >
            {creationInfo ? (
              <Typography
                sx={{
                  fontSize: 11,
                  color: theme.palette.text.secondary,
                }}
              >
                Created by {creationInfo.creatorName} on {creationInfo.creationDate} at{" "}
                {creationInfo.creationTime}
              </Typography>
            ) : lastUpdateInfo ? (
              <Typography
                sx={{
                  fontSize: 11,
                  color: theme.palette.text.secondary,
                }}
              >
                Last updated on {lastUpdateInfo.updateDate} at {lastUpdateInfo.updateTime}
              </Typography>
            ) : (
              <Typography
                sx={{
                  fontSize: 11,
                  color: theme.palette.text.secondary,
                }}
              >
                No activity yet
              </Typography>
            )}
          </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            // Custom scrollbar styling - invisible by default, visible on hover
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "transparent",
              borderRadius: "4px",
            },
            "&:hover::-webkit-scrollbar-thumb": {
              background: "#C1C7CD",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#98A2B3",
            },
            // Firefox scrollbar styling
            scrollbarWidth: "thin",
            scrollbarColor: "transparent transparent",
            "&:hover": {
              scrollbarColor: "#C1C7CD transparent",
            },
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
                  marginTop: "8px",
                }}
              >
                No history yet
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  color: theme.palette.text.secondary,
                  marginTop: "8px",
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
