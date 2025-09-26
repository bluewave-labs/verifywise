export interface ConversationMessage {
  id: string;
  objectType: string;
  objectId: string;
  authorId: string;
  authorName: string;
  message: string;
  mentions: string[];
  votesUp: number;
  votesDown: number;
  status: 'open' | 'resolved';
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  replies?: ConversationMessage[];
}

export interface ConversationSidebarProps {
  open: boolean;
  onClose: () => void;
  objectType: string;
  objectId: string;
  title: string;
}

export interface ConversationMessageProps {
  message: ConversationMessage;
  onVote: (messageId: string, voteType: 'up' | 'down') => void;
  onReply: (messageId: string) => void;
  level?: number;
  userVotes?: Record<string, 'up' | 'down'>;
  voteDetails?: Record<string, {
    upVoters: Array<{ userId: string; userName: string; }>;
    downVoters: Array<{ userId: string; userName: string; }>;
  }>;
  currentUserId?: string;
}

export interface ConversationNotification {
  id: string;
  type: 'message' | 'reply' | 'mention';
  message: string;
  objectType: string;
  objectId: string;
  createdAt: Date;
  isRead: boolean;
}