import React, { useState, useCallback } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  Typography,
  Box,
  Divider
} from '@mui/material';
import { Notifications as NotificationIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { NotificationItem } from '../../../domain/types/Comment';
import { formatTimeAgo } from '../../../application/tools/dateUtils';

import { useMockConversationNotifications } from '../../../application/mocks/commentMocks';

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { notifications, unreadCount, markAsRead } = useMockConversationNotifications();
  const theme = useTheme();

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    // Don't auto-mark as read - let user explicitly read them
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleNotificationClick = useCallback((notification: NotificationItem) => {
    markAsRead();
    handleClose();
    // TODO: Navigate to the relevant object
    console.log('Navigate to:', notification.objectType, notification.objectId);
  }, [markAsRead, handleClose]);

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          color: theme.palette.other.icon,
          '&:hover': {
            backgroundColor: 'rgba(103, 112, 133, 0.08)'
          }
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="primary"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '10px',
              minWidth: '18px',
              height: '18px',
              backgroundColor: theme.palette.primary.main
            }
          }}
        >
          <NotificationIcon sx={{ fontSize: 18 }} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        sx={{
          mt: 1,
          '& .MuiPopover-paper': {
            borderRadius: '8px',
            boxShadow: '0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)',
            border: `1px solid ${theme.palette.border?.light || '#eaecf0'}`
          }
        }}
      >
        <Box sx={{ width: 320, maxHeight: 400 }}>
          {/* Header */}
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="body2" fontWeight={600} fontSize="14px">
              Notifications
            </Typography>
          </Box>

          <Divider />

          {/* Notifications List */}
          <List sx={{ p: 0 }}>
            {notifications.length === 0 ? (
              <ListItem sx={{ py: 3 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontSize="13px"
                  textAlign="center"
                  width="100%"
                >
                  No new notifications
                </Typography>
              </ListItem>
            ) : (
              notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.background?.accent || '#f9fafb'
                    }
                  }}
                >
                  <Typography
                    variant="body2"
                    fontSize="13px"
                    sx={{ mb: 0.5 }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontSize="11px"
                  >
                    {formatTimeAgo(notification.createdAt)}
                  </Typography>
                </ListItem>
              ))
            )}
          </List>

          {notifications.length > 0 && (
            <>
              <Divider />
              <Box sx={{ p: 1 }}>
                <Typography
                  variant="caption"
                  color="primary"
                  fontSize="12px"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    py: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                  onClick={handleClose}
                >
                  View all notifications
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;