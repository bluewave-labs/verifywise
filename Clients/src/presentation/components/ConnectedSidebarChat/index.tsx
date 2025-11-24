import React, { useEffect, useState } from 'react';
import VerifyWiseSidebarChat from '../VerifyWiseSidebarChat';
import { useSidebarChat } from '../../contexts/SidebarChatContext';
import './ConnectedSidebarChat.css';

interface Message {
  id: string;
  senderName: string;
  senderId?: string;
  senderProfilePhotoId?: number;
  fromMe: boolean;
  text: string;
  time: string;
  attachment?: {
    fileName: string;
    fileSize: string;
  };
  reactions?: {
    emoji: string;
    userIds: string[];
  }[];
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

interface ConnectedSidebarChatProps {
  currentUserId?: string;
  onLoadMessages?: (tableId: string, rowId: string | number) => Promise<Message[]>;
  onLoadFiles?: (tableId: string, rowId: string | number) => Promise<FileItem[]>;
  onSendMessage?: (tableId: string, rowId: string | number, message: string, attachment?: File) => Promise<void>;
  onUploadFile?: (tableId: string, rowId: string | number, file: File, onProgress?: (progress: number) => void) => Promise<void>;
  onDownloadFile?: (fileId: string, fileName?: string) => Promise<void>;
  onRemoveFile?: (fileId: string) => Promise<void>;
  onAddReaction?: (messageId: string, emoji: string) => Promise<void>;
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>;
  onMarkAsRead?: (tableId: string, rowId: string | number) => Promise<void>;
}

const ConnectedSidebarChat: React.FC<ConnectedSidebarChatProps> = ({
  currentUserId = 'current-user',
  onLoadMessages,
  onLoadFiles,
  onSendMessage,
  onUploadFile,
  onDownloadFile,
  onRemoveFile,
  onAddReaction,
  onRemoveReaction,
  onMarkAsRead,
}) => {
  const { isOpen, currentRow } = useSidebarChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);

  // Function to load chat data
  const loadChatData = React.useCallback(async () => {
    if (currentRow && isOpen) {
      try {
        const [loadedMessages, loadedFiles] = await Promise.all([
          onLoadMessages?.(currentRow.tableId, currentRow.rowId) || Promise.resolve([]),
          onLoadFiles?.(currentRow.tableId, currentRow.rowId) || Promise.resolve([]),
        ]);

        // Only update state if data has actually changed (prevents flickering)
        setMessages(prev => {
          if (JSON.stringify(prev) === JSON.stringify(loadedMessages)) {
            return prev; // No change, return previous state to prevent re-render
          }
          return loadedMessages;
        });

        setFiles(prev => {
          if (JSON.stringify(prev) === JSON.stringify(loadedFiles)) {
            return prev; // No change, return previous state to prevent re-render
          }
          return loadedFiles;
        });
      } catch (error) {
        console.error('Error loading chat data:', error);
      }
    } else {
      setMessages([]);
      setFiles([]);
    }
  }, [currentRow, isOpen, onLoadMessages, onLoadFiles]);

  // Load messages and files when row changes, and mark as read
  useEffect(() => {
    loadChatData();

    // Mark messages as read when sidebar first opens for this row
    if (currentRow && isOpen && !hasMarkedAsRead) {
      onMarkAsRead?.(currentRow.tableId, currentRow.rowId);
      setHasMarkedAsRead(true);
    }

    // Reset hasMarkedAsRead when row changes
    return () => {
      setHasMarkedAsRead(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow?.tableId, currentRow?.rowId, isOpen]); // Intentionally not including loadChatData and onMarkAsRead to prevent infinite re-render loop

  // Auto-refresh messages and files every 3 seconds when sidebar is open
  useEffect(() => {
    if (!isOpen || !currentRow) {
      return;
    }

    const intervalId = setInterval(() => {
      loadChatData();
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentRow?.tableId, currentRow?.rowId]); // Intentionally not including loadChatData to prevent interval reset

  const handleSendMessage = async (message: string, attachment?: File) => {
    if (currentRow) {
      await onSendMessage?.(currentRow.tableId, currentRow.rowId, message, attachment);
      // Reload messages after sending
      try {
        const loadedMessages = await onLoadMessages?.(currentRow.tableId, currentRow.rowId) || [];
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error reloading messages after send:', error);
      }
    }
  };

  const handleUploadFile = async (file: File, onProgress?: (progress: number) => void) => {
    if (currentRow) {
      await onUploadFile?.(currentRow.tableId, currentRow.rowId, file, onProgress);
      // Reload files after uploading
      try {
        const loadedFiles = await onLoadFiles?.(currentRow.tableId, currentRow.rowId) || [];
        setFiles(loadedFiles);
      } catch (error) {
        console.error('Error reloading files after upload:', error);
      }
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    console.log(`[ConnectedSidebarChat] Removing file:`, fileId);
    await onRemoveFile?.(fileId);
    // Reload files after removal
    if (currentRow) {
      try {
        const loadedFiles = await onLoadFiles?.(currentRow.tableId, currentRow.rowId) || [];
        console.log(`[ConnectedSidebarChat] Reloaded files after removal:`, loadedFiles);
        setFiles(loadedFiles);
      } catch (error) {
        console.error('Error reloading files after removal:', error);
      }
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    await onAddReaction?.(messageId, emoji);
    // Reload messages after adding reaction
    if (currentRow) {
      try {
        const loadedMessages = await onLoadMessages?.(currentRow.tableId, currentRow.rowId) || [];
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error reloading messages after adding reaction:', error);
      }
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    await onRemoveReaction?.(messageId, emoji);
    // Reload messages after removing reaction
    if (currentRow) {
      try {
        const loadedMessages = await onLoadMessages?.(currentRow.tableId, currentRow.rowId) || [];
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error reloading messages after removing reaction:', error);
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`connected-sidebar-chat ${isOpen ? 'open' : ''}`}>
      <VerifyWiseSidebarChat
        messages={messages}
        files={files}
        currentUserId={currentUserId}
        rowContext={currentRow}
        onSendMessage={handleSendMessage}
        onUploadFile={handleUploadFile}
        onDownloadFile={onDownloadFile}
        onRemoveFile={handleRemoveFile}
        onAddReaction={handleAddReaction}
        onRemoveReaction={handleRemoveReaction}
      />
    </div>
  );
};

export default ConnectedSidebarChat;
