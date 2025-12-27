# Slack Plugin

Real-time notifications for VerifyWise via Slack.

## Features

- **Real-time Notifications**: Receive instant alerts about critical events
- **Channel Routing**: Route different notification types to specific channels
- **OAuth Integration**: Secure authentication with Slack workspace
- **Policy Reminders**: Automated reminders for policy reviews

## Installation

Users can install this plugin from the VerifyWise plugin marketplace. The plugin requires:

1. Slack workspace with admin permissions
2. OAuth authorization
3. Bot invitation to desired channels

## Configuration

### Notification Routing Types

- **Membership and Roles**: User access and permission changes
- **Projects and Organizations**: Project updates and org changes
- **Policy Reminders and Status**: Policy reviews and compliance alerts
- **Evidence and Task Alerts**: Evidence submissions and task assignments
- **Control or Policy Changes**: Control modifications and policy updates

### Required Permissions

- `channels:read` - View public channels
- `chat:write` - Send messages
- `incoming-webhook` - Post messages via webhook
- `channels:write` - Invite bot to channels (user scope)
- `groups:write` - Invite bot to private channels (user scope)

## Usage

### Send Notification

```javascript
const plugin = require('./index');

await plugin.sendNotification(
  'Risk assessment completed for Project XYZ',
  {
    channel: '#ai-governance',
    routingType: 'PROJECTS_AND_ORGANIZATIONS'
  }
);
```

### Configure Routing

```javascript
await plugin.configureRouting(webhookId, [
  'POLICY_REMINDERS_AND_STATUS',
  'CONTROL_OR_POLICY_CHANGES'
]);
```

### Test Connection

```javascript
const result = await plugin.testConnection(config);
console.log(result.message); // "Connection test successful"
```

## Database Schema

The plugin uses the existing `slack_webhooks` table:

- `access_token` - Encrypted OAuth token
- `channel` - Target Slack channel
- `routing_type` - Array of enabled routing types
- `is_active` - Whether webhook is active

## Scheduled Jobs

- **Daily Policy Reminders**: Runs at 9 AM UTC
- Sends notifications for policies due soon
- Routes to `POLICY_REMINDERS_AND_STATUS` channels

## Development

```bash
npm install
npm test
```

## Support

For issues or questions, contact support@verifywise.com
