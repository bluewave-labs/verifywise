# SlackWebhook Controller Documentation

## Table of Contents

- [Overview](#overview)
- [Controller Functions](#controller-functions)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Dependencies](#dependencies)

## Overview

The SlackWebhook controller manages all HTTP request handling for Slack webhook operations, including OAuth flow, CRUD operations, and message sending functionality.

**Location:** `Servers/controllers/slackWebhook.ctrl.ts`

**Responsibilities:**

- Handle Slack OAuth 2.0 authorization flow
- Manage webhook CRUD operations with transactions
- Send test and notification messages to Slack
- Validate and sanitize all inputs
- Log all operations for audit trail
- Handle errors with appropriate status codes

## Controller Functions

### getAllSlackWebhooks

Retrieves all Slack webhooks for a specific user, optionally filtered by channel.

**HTTP Method:** GET
**Endpoint:** `/slackWebhooks`
**Authentication:** Required (JWT)

**Query Parameters:**

| Parameter | Type     | Required | Description                  |
| --------- | -------- | -------- | ---------------------------- |
| `userId`  | `string` | Yes      | User ID to filter webhooks   |
| `channel` | `string` | No       | Optional channel name filter |

**Response:**

Success (200):

```json
{
  "status": "success",
  "data": [
    {
      "id": 123,
      "scope": "chat:write,channels:read",
      "user_id": 1,
      "team_name": "VerifyWise Team",
      "team_id": "T1234567890",
      "channel": "#notifications",
      "channel_id": "C1234567890",
      "created_at": "2025-09-16T10:30:00Z",
      "is_active": true,
      "routing_type": ["Membership and roles"]
    }
  ]
}
```

Error (400):

```json
{
  "status": "error",
  "message": "userId query parameter is required"
}
```

---

### getSlackWebhookById

Retrieves a single Slack webhook by its ID.

**HTTP Method:** GET
**Endpoint:** `/slackWebhooks/:id`
**Authentication:** Required (JWT)

**Path Parameters:**

| Parameter | Type     | Required | Description |
| --------- | -------- | -------- | ----------- |
| `id`      | `number` | Yes      | Webhook ID  |

**Response:**

- Success (200): Slack Webhook Data
- Error (404): Not Found

**Exceptions:**

- `ValidationException` (400): Invalid ID format
- `NotFoundException` (404): Webhook not found
- Generic errors (500): Database or system errors

---

### createNewSlackWebhook

Creates a new Slack webhook after validating OAuth code with Slack API.

**HTTP Method:** POST
**Endpoint:** `/slackWebhooks`
**Authentication:** Required (JWT)

**Request Body:**

| Field    | Type     | Required | Description                         |
| -------- | -------- | -------- | ----------------------------------- |
| `code`   | `string` | Yes      | OAuth authorization code from Slack |
| `userId` | `number` | Yes      | User creating the integration       |

**OAuth Flow:**

1. Client redirects to Slack OAuth URL
2. User authorizes app and selects channel
3. Slack redirects back with authorization code
4. Client sends code to this endpoint
5. Server exchanges code for access token
6. Server creates webhook and invites bot to channel

**Response:**

- 201: Created
- 400: Bad request (missing required fields)
- 503: Service unavailable
- 500: Server error

**Slack API Call:**

The function makes a POST request to:

```
https://slack.com/api/oauth.v2.access
```

With parameters:

- `client_id`: Slack app client ID
- `client_secret`: Slack app client secret
- `code`: Authorization code from client
- `redirect_uri`: OAuth redirect URI

**Transaction Handling:**

- All database operations wrapped in transaction
- Automatic rollback on any error
- Commit only on complete success

**Post-creation Actions:**

1. Validate webhook data
2. Encrypt sensitive fields
3. Save to database
4. Invite bot to channel
5. Log event

**Exceptions:**

- `ValidationException` (400): Invalid webhook data
- `BusinessLogicException` (403): Business rule violation
- Generic errors (500): OAuth failure or database errors

---

### validateSlackOAuth

Internal function that exchanges OAuth code for access token.

**Signature:**

```typescript
async function validateSlackOAuth(code: string): Promise<any>;
```

**Parameters:**

- `code`: OAuth authorization code

**Returns:** Slack OAuth response containing:

- `access_token`: Bot access token
- `scope`: Granted scopes
- `team`: Workspace information
- `incoming_webhook`: Webhook details
- `authed_user`: User who authorized
- `bot_user_id`: Bot user ID

**Throws:**

- Error if OAuth validation fails
- Error if Slack API returns `ok: false`

**Environment Variables Required:**

- `SLACK_API_URL`: Slack OAuth token URL
- `SLACK_CLIENT_ID`: App client ID
- `SLACK_CLIENT_SECRET`: App client secret
- `FRONTEND_URL`: Base URL for redirect URI

---

### updateSlackWebhookById

Updates an existing Slack webhook's routing configuration or active status.

**HTTP Method:** PATCH
**Endpoint:** `/slackWebhooks/:id`
**Authentication:** Required (JWT)

**Path Parameters:**

| Parameter | Type     | Required | Description          |
| --------- | -------- | -------- | -------------------- |
| `id`      | `number` | Yes      | Webhook ID to update |

**Request Body:**

| Field          | Type       | Required | Description                         |
| -------------- | ---------- | -------- | ----------------------------------- |
| `is_active`    | `boolean`  | No       | Active status                       |
| `routing_type` | `string[]` | No       | Array of notification routing types |

**Example Request:**

```json
{
  "is_active": true,
  "routing_type": ["Membership and roles", "Evidence and task alerts"]
}
```

**Response:**

- 202: Accepted
- 400: Bad request (missing required fields)
- 404: Vendor risk not found
- 500: Server error

**Transaction Handling:**

- Validates webhook exists before update
- Updates and validates data
- Commits or rolls back transaction

**Exceptions:**

- `ValidationException` (400): Invalid update data
- `BusinessLogicException` (403): Business rule violation
- `NotFoundException` (404): Webhook not found
- Generic errors (500): Database errors

---

### sendSlackMessage

Sends a test message to a Slack channel via webhook.

**HTTP Method:** POST
**Endpoint:** `/slackWebhooks/:id/send`
**Authentication:** Required (JWT)

**Path Parameters:**

| Parameter | Type     | Required | Description |
| --------- | -------- | -------- | ----------- |
| `id`      | `number` | Yes      | Webhook ID  |

**Request Body:**

| Field     | Type     | Required | Description   |
| --------- | -------- | -------- | ------------- |
| `title`   | `string` | Yes      | Message title |
| `message` | `string` | Yes      | Message body  |

**Example Request:**

```json
{
  "title": "Test Notification",
  "message": "This is a test message from VerifyWise"
}
```

**Response:**

Success (200): Slack Notification Sent

Error (500):

```json
{
  "message": "channel_not_found"
}
```

**Message Format:**

The message is sent using Slack's Block Kit format:

- Header block with title
- Section block with message text (supports markdown)
- Context block with timestamp in UTC

**Validation:**

- Webhook must exist
- Webhook must be active (`is_active: true`)

**Error Handling:**

- `is_archived`: Channel has been archived
- `channel_not_found`: Channel deleted or inaccessible
- Both errors trigger automatic webhook deactivation

**Exceptions:**

- `ValidationException` (400): Invalid webhook ID
- `NotFoundException` (404): Webhook not found
- Generic errors (500): Slack API errors

---

### disableSlackActivity

Internal function to deactivate a webhook when channel errors occur.

**Signature:**

```typescript
async function disableSlackActivity(id: number): Promise<any>;
```

**Parameters:**

- `id`: Webhook ID to deactivate

**Behavior:**

- Finds webhook by ID
- Sets `is_active` to false
- Updates database within transaction
- Commits or rolls back based on success

**Usage:**
Called automatically when Slack API returns:

- `channel_not_found`
- `is_archived`

## Error Handling

### Exception Types

1. **ValidationException (400)**
   - Invalid input data
   - Missing required fields
   - Invalid ID format

2. **BusinessLogicException (403)**
   - Business rule violations
   - Authorization failures

3. **NotFoundException (404)**
   - Webhook not found
   - Resource doesn't exist

4. **Generic Errors (500)**
   - Database errors
   - External API failures
   - Unexpected exceptions

## Dependencies

### Internal Dependencies

- `domain.layer/models/slackNotification/slackWebhook.model`: Data model
- `domain.layer/exceptions/custom.exception`: Custom exception classes
- `services/slack/slackNotificationService`: Message sending logic
- `utils/slackWebhook.utils`: Database query utilities
- `utils/statusCode.utils`: HTTP status code helpers
- `utils/logger/fileLogger`: File-based logging
- `utils/logger/dbLogger`: Database event logging
- `database/db`: Sequelize instance for transactions

### Environment Variables

Required configuration:

- `SLACK_API_URL`: Slack OAuth API endpoint
- `SLACK_CLIENT_ID`: Slack app client ID
- `SLACK_CLIENT_SECRET`: Slack app client secret
- `FRONTEND_URL`: Frontend base URL for OAuth redirect

## Related Files

- **Routes:** `Servers/routes/slackWebhook.route.ts`
- **Model:** `Servers/domain.layer/models/slackNotification/slackWebhook.model.ts`
- **Service:** `Servers/services/slack/slackNotificationService.ts`
- **Utils:** `Servers/utils/slackWebhook.utils.ts`
- **Interface:** `Servers/domain.layer/interfaces/i.slackWebhook.ts`
