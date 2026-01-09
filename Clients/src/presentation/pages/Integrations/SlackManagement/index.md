# Slack Integration Module

This module manages the integration between VerifyWise and Slack workspaces, enabling real-time notifications and alerts to be sent to designated Slack channels.

## Architecture Overview

The Slack integration follows a modular architecture with clear separation of concerns:

```
SlackManagement/
├── index.tsx                      # Main component, OAuth flow handler
├── SlackIntegrationsTable.tsx    # Integration list and management UI
├── NotificationRoutingModal.tsx   # Notification type to channel mapping
└── constants.ts                   # Notification type definitions
```

## Features

- OAuth 2.0 integration with Slack workspaces
- Multiple channel support with team-based organization
- Notification routing to specific channels by type
- Test message functionality for each integration
- Real-time validation and error handling
- Automatic bot invitation to private channels
- Pagination for large integration lists
- Role-based access control

## Components

### SlackManagement (index.tsx)

The main entry point component that orchestrates the entire Slack integration flow.

**Features:**

- Manages Slack OAuth authorization flow
- Handles OAuth callback with code exchange
- Displays loading states during authentication
- Manages alert notifications with auto-hide
- Enforces role-based permissions
- Lazy loads SlackIntegrationsTable component for performance

**OAuth Scopes:**

Bot Scopes:

- `channels:read` - View channels
- `channels:manage` - Manage channels
- `chat:write` - Send messages
- `incoming-webhook` - Post messages via webhook
- `chat:write.public` - Post to public channels
- `groups:write` - Manage private channels
- `groups:read` - View private channels
- `im:read` - View direct messages
- `mpim:read` - View group direct messages

User Scopes:

- `channels:read` - View channels
- `channels:write.invites` - Invite members to channels
- `groups:read` - View private channels
- `groups:write.invites` - Invite members to private channels
- `channels:write` - Manage channels
- `chat:write` - Send messages
- `im:read` - View direct messages
- `mpim:read` - View group direct messages

**Props:** None (uses URL search params for OAuth)

**State Management:**

- `isLoading`: OAuth token exchange in progress
- `integrationData`: List of active Slack integrations
- `alert`: Alert notification state with auto-dismiss

**Permissions:**
Requires user role to be in `allowedRoles.slack.view` array.

**Usage:**

```tsx
<SlackManagement />
```

---

### SlackIntegrationsTable

Displays and manages a paginated table of all active Slack workspace integrations.

**Features:**

- Paginated table view with customizable rows per page
- Displays team name, channel, creation date, and active status
- Send test messages to verify channel connectivity
- Configure notification routing via modal popup
- Add new Slack integrations via OAuth
- Real-time error handling for archived/invalid channels
- Sticky action column for better UX

**Props:**

| Prop                       | Type             | Description                            |
| -------------------------- | ---------------- | -------------------------------------- |
| `integrationData`          | `SlackWebhook[]` | Array of Slack integrations to display |
| `showAlert`                | `function`       | Callback to show alert notifications   |
| `refreshSlackIntegrations` | `function`       | Callback to refresh integration list   |
| `slackUrl`                 | `string`         | OAuth URL for adding new integrations  |

**Table Columns:**

- Team Name: Slack workspace name
- Channel: Target channel name
- Creation Date: When integration was created
- Active: Whether integration is currently active
- Action: Send test message button

**Error Handling:**

- `is_archived`: Channel has been archived
- `channel_not_found`: Channel no longer exists or is inaccessible
- Automatically refreshes integration list on error

**Usage:**

```tsx
<SlackIntegrationsTable
  integrationData={integrations}
  showAlert={showAlert}
  refreshSlackIntegrations={refresh}
  slackUrl={oauthUrl}
/>
```

---

### NotificationRoutingModal

Modal component for configuring which Slack channels receive which types of notifications.

**Features:**

- Maps notification types to one or more destination channels
- Multi-select dropdown for channel selection
- Send test notifications per routing type
- Validates selections before saving
- Handles removed integrations gracefully
- Real-time form state management

**Props:**

| Prop           | Type                | Description                          |
| -------------- | ------------------- | ------------------------------------ |
| `setIsOpen`    | `function`          | Callback to close modal              |
| `integrations` | `IntegrationList[]` | Available Slack channels for routing |
| `showAlert`    | `function`          | Callback to show alert notifications |

**Usage:**

```tsx
<NotificationRoutingModal
  setIsOpen={setAnchor}
  integrations={channelList}
  showAlert={showAlert}
/>
```

---

## Data Types

### SlackWebhook

```typescript
interface SlackWebhook {
  id: number;
  scope: string;
  teamName: string;
  teamId: string;
  channel: string;
  channelId: string;
  createdAt?: string;
  isActive?: boolean;
  routingType: SlackNotificationRoutingType[];
}
```

### SlackNotificationRoutingType

```typescript
enum SlackNotificationRoutingType {
  MEMBERSHIP_AND_ROLES = "Membership and roles",
  PROJECTS_AND_ORGANIZATIONS = "Projects and organizations",
  POLICY_REMINDERS_AND_STATUS = "Policy reminders and status",
  EVIDENCE_AND_TASK_ALERTS = "Evidence and task alerts",
  CONTROL_OR_POLICY_CHANGES = "Control or policy changes",
}
```

### SlackRoutingType

```typescript
type SlackRoutingType = {
  routingType: string;
  id: number[]; // Array of SlackWebhook IDs
};
```

## Hooks

### useSlackIntegrations

Custom hook for fetching and managing Slack integrations.

**Location:** Clients/src/application/hooks/useSlackIntegrations.tsx

**Returns:**

| Property                   | Type                 | Description                        |
| -------------------------- | -------------------- | ---------------------------------- |
| `slackIntegrations`        | `SlackWebhook[]`     | List of Slack integrations         |
| `routingData`              | `SlackRoutingType[]` | Notification routing configuration |
| `loading`                  | `boolean`            | Loading state                      |
| `error`                    | `string \| null`     | Error message if any               |
| `refreshSlackIntegrations` | `function`           | Refresh integration data           |

**Usage:**

```tsx
const {
  slackIntegrations,
  routingData,
  loading,
  error,
  refreshSlackIntegrations,
} = useSlackIntegrations(userId);
```

## User Flow

### Adding a New Slack Integration

1. User clicks "Add to Slack" button
2. Redirected to Slack OAuth authorization page
3. User selects workspace and channel
4. User authorizes VerifyWise app with required scopes
5. Redirected back to VerifyWise with authorization code
6. Code is exchanged for access token (backend)
7. Integration is created and bot is invited to channel
8. Integration appears in table

### Configuring Notification Routing

1. User clicks "Configure" button
2. NotificationRoutingModal opens
3. User selects destination channels for each notification type
4. User can send test notifications
5. User clicks "Save Changes"
6. Routing configuration is updated for all affected channels
7. Modal closes and table refreshes

### Testing an Integration

1. User clicks "Send Test" button in table row
2. Test message is sent via API
3. Success or error alert is displayed
4. If error, integration list is refreshed to update status

## Error Handling

### Client-side Errors

- OAuth errors displayed via alert notifications
- Network errors caught and displayed
- Invalid channel states handled gracefully
- Archived/deleted channels marked inactive

### Channel-specific Errors

- `is_archived`: Channel was archived in Slack
- `channel_not_found`: Channel was deleted or bot removed
- Both trigger automatic integration refresh

## Styling

- Material-UI components for consistent design
- Custom theme integration (singleTheme)
- Responsive table with sticky headers and columns
- Custom pagination controls
- Loading states with CircularProgress
- Toast notifications for user feedback

## Environment Variables

Required in `.env`:

- `SLACK_URL`: Slack OAuth authorization URL
- `CLIENT_ID`: Slack app client ID
- `FRONTEND_URL`: Application base URL for OAuth redirect
