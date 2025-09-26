import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Drawer,
  Typography,
  Box,
  IconButton,
  TextField,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ConversationMessage from './CommentItem';
import { ConversationSidebarProps } from '../../../domain/types/Comment';

import { useMockConversations } from '../../../application/mocks/commentMocks';

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  open,
  onClose,
  objectType,
  objectId,
  title
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const { messages, loading, addMessage, voteMessage, userVotes, voteDetails } = useMockConversations(objectType, objectId);

  const handleSubmitMessage = () => {
    if (newMessage.trim()) {
      addMessage(newMessage, replyingTo || undefined);
      setNewMessage('');
      setReplyingTo(null);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    // Focus the input field after state update
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Auto-focus when entering reply mode
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleVote = (commentId: string, voteType: 'up' | 'down') => {
    voteMessage(commentId, voteType);
  };

  const totalComments = useMemo(() => {
    return messages.reduce((count, message) => {
      return count + 1 + (message.replies?.length || 0);
    }, 0);
  }, [messages]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          boxShadow: '0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            pb: 1,
            borderBottom: `1px solid ${theme.palette.border?.light || '#eaecf0'}`
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box sx={{ flex: 1, mr: 2 }}>
              <Typography variant="body1" fontWeight={600} fontSize="16px" sx={{ mb: 0.5 }}>
                {title}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={`${totalComments} message${totalComments !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{
                    fontSize: '11px',
                    height: '20px',
                    backgroundColor: theme.palette.background?.accent || '#f9fafb',
                    color: theme.palette.text.secondary,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
                <Typography variant="caption" color="text.secondary" fontSize="11px">
                  {objectType} • {objectId}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: theme.palette.other.icon,
                '&:hover': {
                  backgroundColor: 'rgba(103, 112, 133, 0.08)'
                }
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Comments List */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Loading conversation...
              </Typography>
            </Box>
          ) : messages.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary" fontSize="13px">
                No messages yet
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize="11px">
                Start the conversation by adding the first message
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              {messages.map((message) => (
                <ConversationMessage
                  key={message.id}
                  message={message}
                  onVote={handleVote}
                  onReply={handleReply}
                  userVotes={userVotes}
                  voteDetails={voteDetails}
                  currentUserId="1" // Pass current user ID to identify own messages
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Reply indicator */}
        {replyingTo && (
          <Box sx={{ px: 2, py: 1, backgroundColor: theme.palette.background?.accent || '#f9fafb' }}>
            <Typography variant="caption" color="text.secondary" fontSize="11px">
              Replying to message
              <IconButton
                size="small"
                onClick={() => setReplyingTo(null)}
                sx={{ ml: 1, p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Typography>
          </Box>
        )}

        {/* New Comment Form */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.border?.light || '#eaecf0'}`,
            backgroundColor: theme.palette.background?.main || '#ffffff'
          }}
        >
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              inputRef={inputRef}
              placeholder={replyingTo ? "Write a reply..." : "Add a message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              multiline
              minRows={1}
              maxRows={4}
              size="small"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '13px'
                },
                '& .MuiInputBase-input': {
                  py: 1
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitMessage();
                }
              }}
            />
            <IconButton
              onClick={handleSubmitMessage}
              disabled={!newMessage.trim()}
              sx={{
                color: theme.palette.primary.main,
                '&:disabled': {
                  color: theme.palette.other.icon
                }
              }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary" fontSize="10px" sx={{ mt: 0.5, display: 'block' }}>
            {replyingTo ? 'Press Enter to reply' : 'Press Enter to send'}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ConversationSidebar;