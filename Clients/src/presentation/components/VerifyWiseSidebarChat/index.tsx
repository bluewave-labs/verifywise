import React, { useState, useRef } from 'react';
import { TextField, IconButton, Box, Popover, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton, Tooltip } from '@mui/material';
import { Paperclip, Smile, Send, X, Download, Trash2 } from 'lucide-react';
import EmojiPicker, { EmojiClickData, EmojiStyle } from 'emoji-picker-react';
import Button from '../Button';
import { useSidebarChat, RowContext } from '../../contexts/SidebarChatContext';
import singleTheme from '../../themes/v1SingleTheme';
import './VerifyWiseSidebarChat.css';

interface Reaction {
  emoji: string;
  userIds: string[];
}

interface Message {
  id: string;
  senderName: string;
  senderId?: string;
  senderProfilePhotoId?: number;
  fromMe: boolean;
  text: string;
  time: string;
  isSystemMessage?: boolean;
  attachment?: {
    fileName: string;
    fileSize: string;
  };
  reactions?: Reaction[];
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  size?: string | number;
  updatedAt: string;
  uploaderName?: string;
  uploaderId?: string;
  uploaderProfilePhotoId?: number;
  deletedBy?: string;
  deletedById?: string;
  deletedAt?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
}

interface VerifyWiseSidebarChatProps {
  messages?: Message[];
  files?: FileItem[];
  currentUserId?: string;
  rowContext?: RowContext | null;
  onSendMessage?: (message: string, attachment?: File) => void;
  onUploadFile?: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  onDownloadFile?: (fileId: string, fileName?: string) => void;
  onRemoveFile?: (fileId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}

type TabType = 'chat' | 'files';

const VerifyWiseSidebarChat: React.FC<VerifyWiseSidebarChatProps> = ({
  messages = [],
  files = [],
  currentUserId = 'current-user',
  rowContext,
  onSendMessage,
  onUploadFile,
  onDownloadFile,
  onRemoveFile,
  onAddReaction,
  onRemoveReaction,
}) => {
  // Make context optional - only use if available
  let closeSidebar: (() => void) | undefined;
  try {
    const context = useSidebarChat();
    closeSidebar = context.closeSidebar;
  } catch {
    // Context not available, component being used standalone
    closeSidebar = undefined;
  }
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);
  const [reactionPickerAnchorEl, setReactionPickerAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; fileId: string; fileName: string } | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadFilesCount, setUnreadFilesCount] = useState(0);
  const [showNewMessageNotification, setShowNewMessageNotification] = useState(false);
  const [showNewFileNotification, setShowNewFileNotification] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const prevFilesLengthRef = useRef<number>(files.length);
  const lastReadMessageCountRef = useRef<number>(messages.length);
  const lastReadFileCountRef = useRef<number>(files.filter(f => !f.deletedAt).length);
  const isInitialLoadRef = useRef<boolean>(true);

  // Reset initial load flag when switching rows
  React.useEffect(() => {
    isInitialLoadRef.current = true;
  }, [rowContext?.tableId, rowContext?.rowId]);

  // Initialize read tracking when messages first load
  React.useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      // On initial load, mark all existing messages as read
      // (ConnectedSidebarChat already calls markAsRead on server when sidebar opens)
      lastReadMessageCountRef.current = messages.length;
      prevMessagesLengthRef.current = messages.length;

      const activeFiles = files.filter(f => !f.deletedAt);
      lastReadFileCountRef.current = activeFiles.length;
      prevFilesLengthRef.current = activeFiles.length;

      isInitialLoadRef.current = false;
    }
  }, [messages.length, files]);

  // Auto-scroll to bottom when new messages/files arrive
  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  };

  // Check if user is at the bottom of the chat
  const isAtBottom = () => {
    if (!chatContentRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContentRef.current;
    return scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
  };

  // Only scroll to bottom when NEW messages/files are added, not when reactions change
  React.useEffect(() => {
    const newMessagesAdded = messages.length > prevMessagesLengthRef.current;
    const activeFiles = files.filter(f => !f.deletedAt);
    const newFilesAdded = activeFiles.length > prevFilesLengthRef.current;
    const userIsAtBottom = isAtBottom();

    // Only auto-scroll if new content was added AND user is at the bottom
    if ((newMessagesAdded || newFilesAdded) && userIsAtBottom && activeTab === 'chat') {
      scrollToBottom();
      // Mark all messages and files as read when user is at bottom
      lastReadMessageCountRef.current = messages.length;
      lastReadFileCountRef.current = activeFiles.length;
      setUnreadCount(0);
      setUnreadFilesCount(0);
      setShowNewMessageNotification(false);
      setShowNewFileNotification(false);
    } else {
      // Handle new messages from other users
      if (newMessagesAdded && !userIsAtBottom && activeTab === 'chat') {
        const newMessages = messages.slice(prevMessagesLengthRef.current);
        const newMessagesFromOthers = newMessages.filter(msg => !msg.fromMe);

        if (newMessagesFromOthers.length > 0) {
          const newUnreadCount = messages.length - lastReadMessageCountRef.current;
          setUnreadCount(newUnreadCount);
          setShowNewMessageNotification(true);
        }
      }

      // Handle new files from other users
      if (newFilesAdded) {
        const prevActiveFiles = files.filter(f => !f.deletedAt).slice(0, prevFilesLengthRef.current);
        const newFiles = activeFiles.slice(prevActiveFiles.length);
        // Check if new files are from other users (uploaderId is different from currentUserId)
        const newFilesFromOthers = newFiles.filter(file =>
          file.uploaderId && file.uploaderId !== currentUserId
        );

        if (newFilesFromOthers.length > 0) {
          const newUnreadFilesCount = activeFiles.length - lastReadFileCountRef.current;
          setUnreadFilesCount(newUnreadFilesCount);
          if (activeTab === 'files') {
            setShowNewFileNotification(true);
          } else {
            // In chat tab, show file notification in chat timeline
            setShowNewFileNotification(true);
          }
        }
      }
    }

    // Update refs for next comparison
    prevMessagesLengthRef.current = messages.length;
    prevFilesLengthRef.current = activeFiles.length;
  }, [messages, files, activeTab, currentUserId]);

  // Merge messages, files, and uploading files chronologically
  const getCombinedTimeline = () => {
    const timeline: Array<{ type: 'message' | 'file' | 'uploading'; data: Message | FileItem | UploadingFile; timestamp: Date }> = [];

    // Add messages to timeline
    messages.forEach((message) => {
      timeline.push({
        type: 'message',
        data: message,
        timestamp: new Date(message.time),
      });
    });

    // Add files to timeline
    files.forEach((file) => {
      timeline.push({
        type: 'file',
        data: file,
        timestamp: new Date(file.updatedAt),
      });
    });

    // Add uploading files to timeline (use current time)
    uploadingFiles.forEach((file) => {
      timeline.push({
        type: 'uploading',
        data: file,
        timestamp: new Date(),
      });
    });

    // Sort by timestamp
    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getFileIcon = (type: string): string => {
    if (!type) return 'F';
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pdf')) return 'P';
    if (lowerType.includes('doc')) return 'D';
    if (lowerType.includes('xls') || lowerType.includes('csv')) return 'X';
    if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg')) return 'I';
    return 'F';
  };

  const renderAvatar = (profilePhotoId?: number, userId?: string, name?: string) => {
    if (profilePhotoId && userId) {
      // Render profile photo image
      const photoUrl = `http://localhost:3000/api/users/${userId}/profile-photo`;
      return (
        <img
          src={photoUrl}
          alt={name || 'User'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
          }}
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.nextSibling) {
              (target.nextSibling as HTMLElement).style.display = 'flex';
            }
          }}
        />
      );
    }
    // Fallback to initials
    return name ? getInitials(name) : '?';
  };

  const getRelativeTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        const mins = Math.floor(diffInSeconds / 60);
        return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      } else if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years} ${years === 1 ? 'year' : 'years'} ago`;
      }
    } catch (error) {
      return dateString;
    }
  };

  const getFullDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      return date.toLocaleString('en-US', options);
    } catch (error) {
      return dateString;
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && onSendMessage) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      // Scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleScrollToNewMessages = () => {
    scrollToBottom();
    // Mark all messages as read
    lastReadMessageCountRef.current = messages.length;
    setUnreadCount(0);
    setShowNewMessageNotification(false);
  };

  const handleScrollToNewFiles = () => {
    // Scroll to bottom of files list
    const filesContent = document.querySelector('.files-content');
    if (filesContent) {
      filesContent.scrollTop = filesContent.scrollHeight;
    }
    // Mark all files as read
    const activeFiles = files.filter(f => !f.deletedAt);
    lastReadFileCountRef.current = activeFiles.length;
    setUnreadFilesCount(0);
    setShowNewFileNotification(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMenu = (fileId: string) => {
    setOpenMenuId(openMenuId === fileId ? null : fileId);
  };

  const handleMenuAction = (action: 'download' | 'remove', fileId: string) => {
    const file = files.find(f => f.id === fileId);

    if (action === 'download' && onDownloadFile) {
      const fileName = file ? file.name : undefined;
      onDownloadFile(fileId, fileName);
      setOpenMenuId(null);
    } else if (action === 'remove' && onRemoveFile) {
      const fileName = file ? file.name : 'this file';
      setDeleteConfirmation({ isOpen: true, fileId, fileName });
      setOpenMenuId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation && onRemoveFile) {
      onRemoveFile(deleteConfirmation.fileId);
      setDeleteConfirmation(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadFile) {
      const uploadId = `upload-${Date.now()}-${Math.random()}`;

      // Add file to uploading state
      const uploadingFile: UploadingFile = {
        id: uploadId,
        name: file.name,
        type: file.type,
        size: file.size,
        progress: 0,
      };

      setUploadingFiles((prev) => [...prev, uploadingFile]);

      try {
        // Call upload with progress callback
        await onUploadFile(file, (progress) => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadId ? { ...f, progress } : f
            )
          );
        });

        // Remove from uploading state after completion
        setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
      } catch (error) {
        console.error('Error uploading file:', error);
        // Remove from uploading state on error
        setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
      }

      // Clear the input so the same file can be selected again
      event.target.value = '';
    }
  };

  const handleEmojiClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setInputMessage((prev) => prev + emojiData.emoji);
    handleEmojiClose();
    // Focus back on the text field
    if (textFieldRef.current) {
      textFieldRef.current.focus();
    }
  };

  const emojiPickerOpen = Boolean(emojiAnchorEl);

  // Reaction handlers
  const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🙏'];

  const handleQuickReaction = (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const existingReaction = message.reactions?.find(r => r.emoji === emoji);
    const userHasReacted = existingReaction?.userIds.includes(currentUserId);

    if (userHasReacted && onRemoveReaction) {
      onRemoveReaction(messageId, emoji);
    } else if (onAddReaction) {
      onAddReaction(messageId, emoji);
    }
  };

  const handleReactionChipClick = (messageId: string, emoji: string) => {
    handleQuickReaction(messageId, emoji);
  };

  const handleOpenReactionPicker = (event: React.MouseEvent<HTMLButtonElement>, messageId: string) => {
    setReactionPickerAnchorEl(event.currentTarget);
    setReactionPickerMessageId(messageId);
  };

  const handleCloseReactionPicker = () => {
    setReactionPickerAnchorEl(null);
    setReactionPickerMessageId(null);
  };

  const handleReactionPickerSelect = (emojiData: EmojiClickData) => {
    if (reactionPickerMessageId && onAddReaction) {
      onAddReaction(reactionPickerMessageId, emojiData.emoji);
    }
    handleCloseReactionPicker();
  };

  const reactionPickerOpen = Boolean(reactionPickerAnchorEl);

  const userHasReacted = (reaction: Reaction): boolean => {
    return reaction.userIds.includes(currentUserId);
  };

  return (
    <div className="verifywise-sidebar-chat">
      {/* Header */}
      <div className="sidebar-header">
        <div className="header-content">
          <div>
            <div className="header-title">Comments</div>
            <div className="header-subtitle">
              {rowContext ? rowContext.rowLabel : 'Team chat'}
            </div>
          </div>
          {closeSidebar && (
            <IconButton
              onClick={closeSidebar}
              size="small"
              sx={{
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                },
              }}
            >
              <X size={20} />
            </IconButton>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files
          </button>
        </div>
      </div>

      {/* Chat Content */}
      {activeTab === 'chat' && (
        <>
          <div className="chat-content" ref={chatContentRef}>
            {getCombinedTimeline().map((item) => {
              if (item.type === 'message') {
                const message = item.data as Message;
                return message.isSystemMessage ? (
                  // System Message (e.g., file removal notifications)
                  <div key={`message-${message.id}`} className="system-message">
                    <div className="system-message-content">
                      <div className="system-message-text">{message.text}</div>
                      <div className="system-message-time">
                        <Tooltip title={getFullDateTime(message.time)} arrow placement="top">
                          <span style={{ cursor: 'help' }}>
                            {getRelativeTime(message.time)}
                          </span>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular Message
                  <div
                    key={`message-${message.id}`}
                    className={`message-row ${message.fromMe ? 'from-me' : 'from-other'}`}
                  >
                    <div className="message-avatar">
                      {renderAvatar(message.senderProfilePhotoId, message.senderId, message.senderName)}
                      <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        {getInitials(message.senderName)}
                      </div>
                    </div>
                    <div className="message-wrapper">
                      {/* Quick Reactions Bar (appears on hover) */}
                      <div className="quick-reactions">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            className="quick-reaction-btn"
                            onClick={() => handleQuickReaction(message.id, emoji)}
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          className="quick-reaction-btn add-more"
                          onClick={(e) => handleOpenReactionPicker(e, message.id)}
                          title="More reactions"
                        >
                          ➕
                        </button>
                      </div>

                      <div className="message-bubble">
                        <div className="message-header">
                          <span className="message-sender">{message.senderName}</span>
                          <span className="message-time">{getRelativeTime(message.time)}</span>
                        </div>
                        <div className="message-text">{message.text}</div>
                        {message.attachment && (
                          <div className="message-attachment">
                            <svg className="attachment-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M12.25 6.125V11.375C12.25 11.8223 12.0722 12.2512 11.7562 12.5693C11.4403 12.8875 11.0104 13.0625 10.5625 13.0625H3.4375C2.98995 13.0625 2.56072 12.8875 2.24476 12.5693C1.92879 12.2512 1.75 11.8223 1.75 11.375V4.25C1.75 3.80245 1.92879 3.37322 2.24476 3.05726C2.56072 2.74129 2.98995 2.5625 3.4375 2.5625H8.6875" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10.5 1H13V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M6 8L13 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="attachment-name">{message.attachment.fileName}</span>
                            <span className="attachment-size">{message.attachment.fileSize}</span>
                          </div>
                        )}
                      </div>

                      {/* Reaction Chips */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="reaction-chips">
                          {message.reactions.map((reaction) => (
                            <button
                              key={reaction.emoji}
                              className={`reaction-chip ${userHasReacted(reaction) ? 'reacted' : ''}`}
                              onClick={() => handleReactionChipClick(message.id, reaction.emoji)}
                              title={`${reaction.userIds.length} ${reaction.userIds.length === 1 ? 'person' : 'people'} reacted`}
                            >
                              <span className="reaction-emoji">{reaction.emoji}</span>
                              <span className="reaction-count">{reaction.userIds.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else if (item.type === 'uploading') {
                // Uploading file with progress bar
                const uploadingFile = item.data as UploadingFile;

                return (
                  <div key={`uploading-${uploadingFile.id}`} className="file-message-row">
                    <div className="file-message-avatar">U</div>
                    <div className="file-message-wrapper">
                      <div className="file-message-box uploading">
                        <div className="file-message-header">
                          <div className="file-message-icon">
                            {getFileIcon(uploadingFile.type)}
                          </div>
                          <div className="file-message-info">
                            <div className="file-message-name">{uploadingFile.name}</div>
                            <div className="file-message-meta">
                              Uploading... {uploadingFile.progress}%
                            </div>
                            <div className="upload-progress-bar">
                              <div
                                className="upload-progress-fill"
                                style={{ width: `${uploadingFile.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // File item
                const file = item.data as FileItem;
                const isDeleted = !!file.deletedAt;

                // Debug log to track file status
                console.log(`[VerifyWiseSidebarChat] Rendering file:`, {
                  id: file.id,
                  name: file.name,
                  deletedAt: file.deletedAt,
                  isDeleted,
                });

                return (
                  <div key={`file-${file.id}`} className="file-message-row">
                    <div className="file-message-avatar">
                      {file.uploaderName && (file.uploaderProfilePhotoId || file.uploaderId)
                        ? renderAvatar(file.uploaderProfilePhotoId, file.uploaderId, file.uploaderName)
                        : file.uploaderName
                          ? getInitials(file.uploaderName)
                          : getFileIcon(file.type)}
                      <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        {file.uploaderName ? getInitials(file.uploaderName) : getFileIcon(file.type)}
                      </div>
                    </div>
                    <div className="file-message-wrapper">
                      <div className={`file-message-box ${isDeleted ? 'deleted' : ''}`}>
                        {isDeleted ? (
                          // Deleted file message
                          <div className="file-message-deleted">
                            <div className="file-message-deletion-info">
                              <strong>{file.name}</strong> was deleted{' '}
                              <Tooltip title={getFullDateTime(file.deletedAt!)} arrow placement="top">
                                <span style={{ cursor: 'help', borderBottom: '1px dotted currentColor' }}>
                                  {getRelativeTime(file.deletedAt!)}
                                </span>
                              </Tooltip>
                            </div>
                          </div>
                        ) : (
                          // Active file
                          <>
                            <div className="file-message-header">
                              <div className="file-message-icon">
                                {getFileIcon(file.type)}
                              </div>
                              <div className="file-message-info">
                                <div className="file-message-name">{file.name}</div>
                                <div className="file-message-meta">
                                  {file.type}{file.size ? ` · ${file.size}` : ''} · Uploaded{' '}
                                  <Tooltip title={getFullDateTime(file.updatedAt)} arrow placement="top">
                                    <span style={{ cursor: 'help', borderBottom: '1px dotted currentColor' }}>
                                      {getRelativeTime(file.updatedAt)}
                                    </span>
                                  </Tooltip>
                                  {file.uploaderName && ` by ${file.uploaderName}`}
                                </div>
                              </div>
                            </div>
                            <div className="file-message-actions">
                              <IconButton
                                size="small"
                                onClick={() => onDownloadFile && onDownloadFile(file.id, file.name)}
                                sx={{ color: '#6b7280', '&:hover': { backgroundColor: '#f3f4f6', color: '#13715B' } }}
                                title="Download file"
                              >
                                <Download size={18} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setDeleteConfirmation({ isOpen: true, fileId: file.id, fileName: file.name });
                                }}
                                sx={{ color: '#6b7280', '&:hover': { backgroundColor: '#fee2e2', color: '#dc2626' } }}
                                title="Remove file"
                              >
                                <Trash2 size={18} />
                              </IconButton>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {/* New Messages Notification */}
          {showNewMessageNotification && unreadCount > 0 && (
            <div className="new-message-notification">
              <button
                className="new-message-button"
                onClick={handleScrollToNewMessages}
              >
                {unreadCount} new {unreadCount === 1 ? 'message' : 'messages'}
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <Box className="chat-input-bar">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
            <IconButton
              className="input-button"
              aria-label="Attach file"
              size="small"
              onClick={handleAttachFile}
            >
              <Paperclip size={20} />
            </IconButton>
            <TextField
              multiline
              rows={3}
              className="chat-input"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
              fullWidth
              inputRef={textFieldRef}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                },
                '& .MuiOutlinedInput-input': {
                  color: '#111827',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#9ca3af',
                  opacity: 1,
                },
              }}
            />
            <IconButton
              className="input-button"
              aria-label="Add emoji"
              size="small"
              onClick={handleEmojiClick}
            >
              <Smile size={20} />
            </IconButton>
            <Button
              onClick={handleSendMessage}
              sx={{
                mt: 0,
                minHeight: '36px',
                px: 3,
              }}
            >
              <Send size={16} style={{ marginRight: '4px' }} />
              Send
            </Button>
          </Box>

          {/* Emoji Picker Popover (for typing) */}
          <Popover
            open={emojiPickerOpen}
            anchorEl={emojiAnchorEl}
            onClose={handleEmojiClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiPopover-paper': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                borderRadius: '12px',
              },
            }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              autoFocusSearch={false}
              width={280}
              height={350}
              emojiStyle={EmojiStyle.NATIVE}
              previewConfig={{ showPreview: false }}
            />
          </Popover>

          {/* Reaction Picker Popover (for message reactions) */}
          <Popover
            open={reactionPickerOpen}
            anchorEl={reactionPickerAnchorEl}
            onClose={handleCloseReactionPicker}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            sx={{
              '& .MuiPopover-paper': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                borderRadius: '12px',
              },
            }}
          >
            <EmojiPicker
              onEmojiClick={handleReactionPickerSelect}
              autoFocusSearch={false}
              width={280}
              height={350}
              emojiStyle={EmojiStyle.NATIVE}
              previewConfig={{ showPreview: false }}
            />
          </Popover>
        </>
      )}

      {/* Files Content */}
      {activeTab === 'files' && (
        <>
          <div className="files-content">
            {/* Show uploading files */}
            {uploadingFiles.map((file) => (
              <div key={`uploading-file-${file.id}`} className="file-row uploading">
                <div className="file-icon">
                  {getFileIcon(file.type)}
                </div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    Uploading... {file.progress}%
                  </div>
                  <div className="upload-progress-bar">
                    <div
                      className="upload-progress-fill"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Show uploaded files (excluding deleted ones) */}
            {files.filter(file => !file.deletedAt).map((file) => (
              <div key={`active-file-${file.id}`} className="file-row">
                <div className="file-icon">
                  {getFileIcon(file.type)}
                </div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    {file.type}{file.size ? ` · ${file.size}` : ''} · Uploaded{' '}
                    <Tooltip title={getFullDateTime(file.updatedAt)} arrow placement="top">
                      <span style={{ cursor: 'help', borderBottom: '1px dotted currentColor' }}>
                        {getRelativeTime(file.updatedAt)}
                      </span>
                    </Tooltip>
                  </div>
                </div>
                <div className="file-actions">
                  <button
                    className="menu-button"
                    onClick={() => toggleMenu(file.id)}
                    aria-label="File options"
                  >
                    ⋯
                  </button>
                  {openMenuId === file.id && (
                    <div className="context-menu">
                      <button
                        className="menu-item"
                        onClick={() => handleMenuAction('download', file.id)}
                      >
                        Download
                      </button>
                      <button
                        className="menu-item"
                        onClick={() => handleMenuAction('remove', file.id)}
                      >
                        Remove from thread
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* New Files Notification */}
          {showNewFileNotification && unreadFilesCount > 0 && (
            <div className="new-message-notification">
              <button
                className="new-message-button"
                onClick={handleScrollToNewFiles}
              >
                {unreadFilesCount} new {unreadFilesCount === 1 ? 'file' : 'files'}
              </button>
            </div>
          )}

          {/* Files Footer */}
          <Box className="files-footer">
            <Button
              variant="outlined"
              onClick={() => {
                // Trigger file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv";
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file && onUploadFile) {
                    const uploadId = `upload-${Date.now()}-${Math.random()}`;

                    // Add file to uploading state
                    const uploadingFile: UploadingFile = {
                      id: uploadId,
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      progress: 0,
                    };

                    setUploadingFiles((prev) => [...prev, uploadingFile]);

                    try {
                      // Call upload with progress callback
                      await onUploadFile(file, (progress) => {
                        setUploadingFiles((prev) =>
                          prev.map((f) =>
                            f.id === uploadId ? { ...f, progress } : f
                          )
                        );
                      });

                      // Remove from uploading state after completion
                      setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
                    } catch (error) {
                      console.error('Error uploading file:', error);
                      // Remove from uploading state on error
                      setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
                    }
                  }
                };
                input.click();
              }}
              sx={{
                mt: 0,
                backgroundColor: 'transparent',
                color: '#13715B',
                borderColor: '#13715B',
                '&:hover': {
                  backgroundColor: '#f0fdf4',
                  borderColor: '#13715B',
                },
              }}
            >
              Upload file
            </Button>
          </Box>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmation?.isOpen || false} onClose={handleCancelDelete}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: "16px", color: singleTheme.textStyles.pageDescription.color }}>
          <strong>Remove file from thread?</strong>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "14px", color: singleTheme.textStyles.pageDescription.color }}>
            Are you sure you want to remove <strong>{deleteConfirmation?.fileName}</strong> from the thread?
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "right",
            gap: 2,
            px: 5,
            pb: 3,
            pt: 0,
          }}
        >
          <MuiButton
            onClick={handleCancelDelete}
            variant="text"
            disableFocusRipple
            disableRipple
            sx={{
              textTransform: "none",
              fontSize: "14px",
              color: singleTheme.textStyles.pageDescription.color,
              px: 3,
              py: 1.5,
              "&:focus": { outline: "none" },
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              ...singleTheme.buttons.error.contained,
              px: 3,
              py: 1.5,
              minWidth: "120px",
            }}
          >
            Remove
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default VerifyWiseSidebarChat;
