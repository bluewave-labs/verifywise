import { useState, useCallback } from 'react';
import { ConversationMessage, ConversationNotification } from '../../domain/types/Comment';

export const mockConversations: ConversationMessage[] = [
  {
    id: '1',
    objectType: 'vendor',
    objectId: '123',
    authorId: '1',
    authorName: 'John Smith',
    message: 'This vendor has shown concerning security practices in their latest audit. We should consider escalating their risk level.',
    mentions: [],
    votesUp: 3,
    votesDown: 0,
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    replies: [
      {
        id: '2',
        objectType: 'vendor',
        objectId: '123',
        authorId: '2',
        authorName: 'Sarah Johnson',
        message: 'I agree with John. Additionally, their response time to security incidents has been slow.',
        mentions: ['1'], // mentioning John
        votesUp: 1,
        votesDown: 0,
        status: 'open',
        parentId: '1',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ]
  }
];

export const mockConversationNotifications: ConversationNotification[] = [
  {
    id: '1',
    type: 'message',
    message: 'John mentioned you in Vendor Risk Assessment',
    objectType: 'vendor',
    objectId: '123',
    createdAt: new Date(Date.now() - 5 * 60000),
    isRead: false
  },
  {
    id: '2',
    type: 'message',
    message: 'New comment on Acme Corp vendor',
    objectType: 'vendor',
    objectId: '124',
    createdAt: new Date(Date.now() - 15 * 60000),
    isRead: false
  }
];

// Mock hooks for development - will be replaced with real implementation
export const useMockConversations = (objectType: string, objectId: string) => {
  const [localMessages, setLocalMessages] = useState<ConversationMessage[]>(() =>
    mockConversations.filter(c => c.objectType === objectType && c.objectId === objectId)
  );

  // Track which messages the current user has voted on
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});

  // Track detailed vote information (who voted what)
  const [voteDetails, setVoteDetails] = useState<Record<string, {
    upVoters: Array<{ userId: string; userName: string; }>;
    downVoters: Array<{ userId: string; userName: string; }>;
  }>>(() => {
    // Initialize with mock vote details for existing messages
    return {
      '1': {
        upVoters: [
          { userId: '3', userName: 'Alice Brown' },
          { userId: '4', userName: 'Bob Wilson' },
          { userId: '5', userName: 'Carol Davis' }
        ],
        downVoters: []
      },
      '2': {
        upVoters: [{ userId: '3', userName: 'Alice Brown' }],
        downVoters: []
      }
    };
  });

  const addMessage = useCallback((message: string, parentId?: string) => {
    console.log('Adding message:', { message, parentId, objectType, objectId });

    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      objectType,
      objectId,
      authorId: '1',
      authorName: 'VerifyWise Admin',
      message,
      mentions: [],
      votesUp: 0,
      votesDown: 0,
      status: 'open',
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: []
    };

    if (parentId) {
      // Add as reply to existing message
      setLocalMessages(prev => prev.map(message =>
        message.id === parentId
          ? { ...message, replies: [...(message.replies || []), newMessage] }
          : message
      ));
    } else {
      // Add as new top-level message
      setLocalMessages(prev => [newMessage, ...prev]);
    }
  }, [objectType, objectId]);

  const voteMessage = useCallback((messageId: string, voteType: 'up' | 'down') => {
    const existingVote = userVotes[messageId];
    const currentUser = { userId: '1', userName: 'VerifyWise Admin' };

    console.log('Voting on message:', { messageId, voteType, existingVote });

    // If clicking the same vote type, remove the vote (toggle)
    if (existingVote === voteType) {
      // Remove vote
      setUserVotes(prev => {
        const newVotes = { ...prev };
        delete newVotes[messageId];
        return newVotes;
      });

      // Remove user from vote details
      setVoteDetails(prev => ({
        ...prev,
        [messageId]: {
          upVoters: voteType === 'up'
            ? (prev[messageId]?.upVoters || []).filter(voter => voter.userId !== currentUser.userId)
            : (prev[messageId]?.upVoters || []),
          downVoters: voteType === 'down'
            ? (prev[messageId]?.downVoters || []).filter(voter => voter.userId !== currentUser.userId)
            : (prev[messageId]?.downVoters || [])
        }
      }));

      // Update comment counts (decrease)
      setLocalMessages(prev => prev.map(comment => {
        if (comment.id === messageId) {
          return {
            ...comment,
            votesUp: voteType === 'up' ? Math.max(0, comment.votesUp - 1) : comment.votesUp,
            votesDown: voteType === 'down' ? Math.max(0, comment.votesDown - 1) : comment.votesDown
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.id === messageId
                ? {
                    ...reply,
                    votesUp: voteType === 'up' ? Math.max(0, reply.votesUp - 1) : reply.votesUp,
                    votesDown: voteType === 'down' ? Math.max(0, reply.votesDown - 1) : reply.votesDown
                  }
                : reply
            )
          };
        }
        return comment;
      }));
      return;
    }

    // Record the new vote
    setUserVotes(prev => ({ ...prev, [messageId]: voteType }));

    // Update vote details - handle switching votes
    setVoteDetails(prev => {
      const currentDetails = prev[messageId] || { upVoters: [], downVoters: [] };

      // Remove user from previous vote list if switching
      const upVoters = existingVote === 'up'
        ? currentDetails.upVoters.filter(voter => voter.userId !== currentUser.userId)
        : currentDetails.upVoters;
      const downVoters = existingVote === 'down'
        ? currentDetails.downVoters.filter(voter => voter.userId !== currentUser.userId)
        : currentDetails.downVoters;

      return {
        ...prev,
        [messageId]: {
          upVoters: voteType === 'up'
            ? [...upVoters, currentUser]
            : upVoters,
          downVoters: voteType === 'down'
            ? [...downVoters, currentUser]
            : downVoters
        }
      };
    });

    // Update the comment vote counts
    setLocalMessages(prev => prev.map(comment => {
      if (comment.id === messageId) {
        let newVotesUp = comment.votesUp;
        let newVotesDown = comment.votesDown;

        // If switching from opposite vote, decrease that count
        if (existingVote === 'up' && voteType === 'down') {
          newVotesUp = Math.max(0, newVotesUp - 1);
          newVotesDown = newVotesDown + 1;
        } else if (existingVote === 'down' && voteType === 'up') {
          newVotesDown = Math.max(0, newVotesDown - 1);
          newVotesUp = newVotesUp + 1;
        } else if (!existingVote) {
          // New vote
          newVotesUp = voteType === 'up' ? newVotesUp + 1 : newVotesUp;
          newVotesDown = voteType === 'down' ? newVotesDown + 1 : newVotesDown;
        }

        return {
          ...comment,
          votesUp: newVotesUp,
          votesDown: newVotesDown
        };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(reply => {
            if (reply.id === messageId) {
              let newVotesUp = reply.votesUp;
              let newVotesDown = reply.votesDown;

              // If switching from opposite vote, decrease that count
              if (existingVote === 'up' && voteType === 'down') {
                newVotesUp = Math.max(0, newVotesUp - 1);
                newVotesDown = newVotesDown + 1;
              } else if (existingVote === 'down' && voteType === 'up') {
                newVotesDown = Math.max(0, newVotesDown - 1);
                newVotesUp = newVotesUp + 1;
              } else if (!existingVote) {
                // New vote
                newVotesUp = voteType === 'up' ? newVotesUp + 1 : newVotesUp;
                newVotesDown = voteType === 'down' ? newVotesDown + 1 : newVotesDown;
              }

              return {
                ...reply,
                votesUp: newVotesUp,
                votesDown: newVotesDown
              };
            }
            return reply;
          })
        };
      }
      return comment;
    }));
  }, [userVotes]);

  return {
    messages: localMessages,
    loading: false,
    error: null,
    addMessage,
    voteMessage,
    userVotes, // Expose user votes for UI state
    voteDetails // Expose vote details for hover tooltips
  };
};

export const useMockConversationNotifications = () => {
  const unreadCount = mockConversationNotifications.filter(n => !n.isRead).length;

  return {
    notifications: mockConversationNotifications,
    unreadCount,
    markAsRead: () => {
      console.log('Marking notifications as read');
      // TODO: Implement API call
    }
  };
};