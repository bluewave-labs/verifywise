import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { MessageSquare } from 'lucide-react';
import { useSidebarChat, RowContext } from '../../contexts/SidebarChatContext';
import './ChatIconColumn.css';

interface ChatIconColumnProps {
  tableId: string;
  rowId: string | number;
  rowLabel: string;
  metadata?: Record<string, any>;
  hasUnreadMessages?: boolean;
  messageCount?: number;
  fileCount?: number;
}

const ChatIconColumn: React.FC<ChatIconColumnProps> = ({
  tableId,
  rowId,
  rowLabel,
  metadata,
  hasUnreadMessages = false,
  messageCount = 0,
  fileCount = 0,
}) => {
  const { toggleSidebar, currentRow, isOpen } = useSidebarChat();

  const isActive = isOpen && currentRow?.tableId === tableId && currentRow?.rowId === rowId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rowContext: RowContext = {
      tableId,
      rowId,
      rowLabel,
      metadata,
    };
    toggleSidebar(rowContext);
  };

  const tooltipContent = (
    <Box sx={{ textAlign: 'left', lineHeight: 1.6 }}>
      <div>{messageCount} {messageCount === 1 ? 'comment' : 'comments'}</div>
      <div>{fileCount} {fileCount === 1 ? 'file' : 'files'}</div>
    </Box>
  );

  return (
    <div className="chat-icon-column">
      <Tooltip
        title={tooltipContent}
        placement="right"
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: '#13715B',
              color: '#ffffff',
              fontSize: '13px',
              padding: '8px 12px',
              borderRadius: '6px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              '& .MuiTooltip-arrow': {
                color: '#13715B',
              },
            },
          },
        }}
        arrow
      >
        <IconButton
          onClick={handleClick}
          size="small"
          className={`chat-icon-button ${isActive ? 'active' : ''} ${hasUnreadMessages ? 'has-unread' : ''}`}
          sx={{
            color: isActive ? '#13715B' : '#6b7280',
            '&:hover': {
              backgroundColor: '#f3f4f6',
              color: '#13715B',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <MessageSquare size={18} />
          {messageCount > 0 && (
            <span className="message-count-badge">{messageCount > 99 ? '99+' : messageCount}</span>
          )}
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default ChatIconColumn;
