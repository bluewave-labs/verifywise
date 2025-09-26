import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  Chip,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Reply as ReplyIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ConversationMessageProps } from '../../../domain/types/Comment';
import { formatTimeAgo } from '../../../application/tools/dateUtils';

const ConversationMessage: React.FC<ConversationMessageProps> = ({
  message,
  onVote,
  onReply,
  level = 0,
  userVotes = {},
  voteDetails = {},
  currentUserId
}) => {
  const theme = useTheme();
  const isReply = level > 0;
  const isOwnMessage = currentUserId && message.authorId === currentUserId;
  const userVote = userVotes[message.id];
  const messageVoteDetails = voteDetails[message.id];
  const [isHovered, setIsHovered] = useState(false);

  // Get user initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2); // Limit to 2 characters
  };

  // Generate subtle pastel color based on user name
  const getAvatarColor = (name: string) => {
    const pastelColors = [
      { bg: '#E8F5E8', text: '#2E7D32' }, // Soft green
      { bg: '#E3F2FD', text: '#1565C0' }, // Soft blue
      { bg: '#FFF3E0', text: '#EF6C00' }, // Soft orange
      { bg: '#F3E5F5', text: '#7B1FA2' }, // Soft purple
      { bg: '#E0F2F1', text: '#00695C' }, // Soft teal
      { bg: '#FFF8E1', text: '#F57F17' }, // Soft yellow
      { bg: '#FCE4EC', text: '#C2185B' }, // Soft pink
      { bg: '#F1F8E9', text: '#558B2F' }, // Soft lime
    ];

    // Create a simple hash from the name to consistently assign colors
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return pastelColors[Math.abs(hash) % pastelColors.length];
  };

  // Create tooltip content for vote counts
  const createVoteTooltip = (voters: Array<{ userId: string; userName: string; }> | undefined, voteType: 'up' | 'down') => {
    if (!voters || voters.length === 0) return '';
    if (voters.length === 1) return `${voters[0].userName} voted ${voteType}`;
    if (voters.length <= 3) {
      return `${voters.map(v => v.userName).join(', ')} voted ${voteType}`;
    }
    return `${voters.slice(0, 2).map(v => v.userName).join(', ')} and ${voters.length - 2} others voted ${voteType}`;
  };

  return (
    <Box sx={{ mb: 2.5 }}> {/* 20px spacing between messages */}
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          ml: isReply ? 6 : (isOwnMessage ? '20%' : 0), // Own messages: 1/5 left margin, replies: indent
          width: isOwnMessage ? '80%' : '100%', // Own messages: 4/5 width
          flexDirection: isOwnMessage ? 'row-reverse' : 'row', // Own messages: reverse for right align
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: getAvatarColor(message.authorName).bg,
            color: getAvatarColor(message.authorName).text,
            fontSize: '16px',
            fontWeight: 600,
            flexShrink: 0,
            border: `1px solid ${getAvatarColor(message.authorName).text}15` // Very subtle border
          }}
        >
          {getInitials(message.authorName)}
        </Avatar>

        {/* Message Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header with name and time */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                fontSize: '14px',
                color: theme.palette.text.primary
              }}
            >
              {message.authorName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '12px',
                color: theme.palette.text.secondary
              }}
            >
              {formatTimeAgo(message.createdAt)}
            </Typography>
            {message.status === 'resolved' && (
              <Chip
                label="Resolved"
                size="small"
                sx={{
                  fontSize: '10px',
                  height: '18px',
                  backgroundColor: theme.palette.status?.success?.bg || '#d1fadf',
                  color: theme.palette.status?.success?.text || '#027a48',
                  '& .MuiChip-label': { px: 0.75 }
                }}
              />
            )}
          </Box>

          {/* Message Text */}
          <Typography
            variant="body2"
            sx={{
              fontSize: '14px',
              lineHeight: 1.4,
              color: theme.palette.text.primary,
              whiteSpace: 'pre-wrap',
              mb: 1.5
            }}
            component="div"
            dangerouslySetInnerHTML={{
              __html: message.message
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br/>')
            }}
          />

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Voting */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip
                title={createVoteTooltip(messageVoteDetails?.upVoters, 'up')}
                arrow
                placement="top"
                disableHoverListener={!messageVoteDetails?.upVoters?.length}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={() => onVote(message.id, 'up')}
                    sx={{
                      p: 0.5,
                      color: userVote === 'up'
                        ? theme.palette.primary.main
                        : theme.palette.grey[600],
                      backgroundColor: userVote === 'up'
                        ? 'rgba(25, 118, 210, 0.12)'
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: userVote === 'up'
                          ? 'rgba(25, 118, 210, 0.2)'
                          : 'rgba(103, 112, 133, 0.08)',
                        color: theme.palette.primary.main
                      }
                    }}
                  >
                    <ThumbUp sx={{ fontSize: 14 }} />
                  </IconButton>
                  <Typography variant="caption" fontSize="11px" color="text.secondary" sx={{ minWidth: '12px' }}>
                    {message.votesUp > 0 ? message.votesUp : ''}
                  </Typography>
                </Box>
              </Tooltip>

              <Tooltip
                title={createVoteTooltip(messageVoteDetails?.downVoters, 'down')}
                arrow
                placement="top"
                disableHoverListener={!messageVoteDetails?.downVoters?.length}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={() => onVote(message.id, 'down')}
                    sx={{
                      p: 0.5,
                      ml: 0.5,
                      color: userVote === 'down'
                        ? theme.palette.error.main
                        : theme.palette.grey[600],
                      backgroundColor: userVote === 'down'
                        ? 'rgba(217, 45, 32, 0.12)'
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: userVote === 'down'
                          ? 'rgba(217, 45, 32, 0.2)'
                          : 'rgba(103, 112, 133, 0.08)',
                        color: theme.palette.error.main
                      }
                    }}
                  >
                    <ThumbDown sx={{ fontSize: 14 }} />
                  </IconButton>
                  <Typography variant="caption" fontSize="11px" color="text.secondary" sx={{ minWidth: '12px' }}>
                    {message.votesDown > 0 ? message.votesDown : ''}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>

            {/* Reply Button */}
            {isHovered && (
              <Button
                size="small"
                startIcon={<ReplyIcon sx={{ fontSize: 12 }} />}
                onClick={() => onReply(message.id)}
                sx={{
                  fontSize: '11px',
                  color: theme.palette.grey[600],
                  minHeight: 'auto',
                  py: 0.5,
                  px: 1,
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(103, 112, 133, 0.08)',
                    color: theme.palette.primary.main
                  }
                }}
              >
                Reply
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Nested Replies */}
      {message.replies && message.replies.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Stack spacing={2.5}>
            {message.replies.map((reply) => (
              <ConversationMessage
                key={reply.id}
                message={reply}
                onVote={onVote}
                onReply={onReply}
                level={level + 1}
                userVotes={userVotes}
                voteDetails={voteDetails}
                currentUserId={currentUserId}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default ConversationMessage;