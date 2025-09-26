# Conversations Database Schema

## Tables Required

### 1. Comments Table
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  object_type VARCHAR(50) NOT NULL,  -- 'vendor', 'project', 'risk', etc.
  object_id VARCHAR(50) NOT NULL,    -- ID of the object being commented on
  author_id INTEGER NOT NULL REFERENCES users(id),
  parent_id INTEGER REFERENCES comments(id), -- For replies
  message TEXT NOT NULL,
  mentions TEXT[], -- Array of mentioned user IDs
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'resolved'
  tenant_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_comments_object ON comments(object_type, object_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_tenant ON comments(tenant_id);
```

### 2. Comment Votes Table
```sql
CREATE TABLE comment_votes (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES conversation_messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
  tenant_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id) -- Prevent duplicate votes
);

-- Indexes for performance
CREATE INDEX idx_comment_votes_comment ON comment_votes(comment_id);
CREATE INDEX idx_comment_votes_user ON comment_votes(user_id);
CREATE INDEX idx_comment_votes_tenant ON comment_votes(tenant_id);
```

### 3. Comment Notifications Table
```sql
CREATE TABLE comment_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message_id INTEGER NOT NULL REFERENCES conversation_messages(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'comment', 'reply', 'mention'
  is_read BOOLEAN DEFAULT FALSE,
  tenant_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_comment_notifications_user ON comment_notifications(user_id);
CREATE INDEX idx_comment_notifications_unread ON comment_notifications(user_id, is_read);
CREATE INDEX idx_comment_notifications_tenant ON comment_notifications(tenant_id);
```

## API Endpoints Needed

### Comments
- `GET /api/comments?objectType=vendor&objectId=123` - Get comments for object
- `POST /api/comments` - Create new comment
- `PUT /api/comments/:id` - Update comment (author only)
- `DELETE /api/comments/:id` - Delete comment (author only)

### Votes
- `POST /api/comments/:id/vote` - Vote on comment (up/down)
- `DELETE /api/comments/:id/vote` - Remove vote
- `GET /api/comments/:id/votes` - Get vote details with user names

### Notifications
- `GET /api/notifications/comments` - Get comment notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Data Flow

1. **Create Comment**: POST to `/api/comments` → Insert to comments table → Create notifications for mentions
2. **Vote on Comment**: POST to `/api/comments/:id/vote` → Insert/Update comment_votes → Return updated vote counts
3. **Get Comments**: GET `/api/comments` → Join with users table for author names → Join with comment_votes for vote counts
4. **Hover for Voters**: GET `/api/comments/:id/votes` → Return list of users who voted up/down

## Security Considerations

1. **Tenant Isolation**: All queries must include tenant_id filter
2. **Authorization**: Users can only vote once per comment
3. **Permissions**: Only comment authors can edit/delete their comments
4. **Input Validation**: Sanitize comment content, validate object types
5. **Rate Limiting**: Prevent spam voting/commenting