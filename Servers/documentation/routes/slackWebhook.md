# SlackWebhook Routes Documentation

## Table of Contents

- [Overview](#overview)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Request/Response Examples](#requestresponse-examples)

## Overview

The SlackWebhook routes define all HTTP endpoints for managing Slack workspace integrations within VerifyWise.

**Location:** `Servers/routes/slackWebhook.route.ts`

**Base Path:** `/slackWebhooks`

**Router:** Express Router

## API Endpoints

### GET /slackWebhooks

Retrieves all Slack webhooks for a specific user.

**Authentication:** Required (JWT)

**Query Parameters:**

- `userId` (required): User ID to filter webhooks
- `channel` (optional): Filter by channel name

**Controller:** `getAllSlackWebhooks`

**Success Response:** 200 OK

```json
{
  "status": "success",
  "data": [
    {
      "id": 123,
      "team_name": "VerifyWise Team",
      "channel": "#notifications",
      "is_active": true
    }
  ]
}
```

---

### GET /slackWebhooks/:id

Retrieves a specific Slack webhook by ID.

**Authentication:** Required (JWT)

**Path Parameters:**

- `id` (required): Webhook ID

**Controller:** `getSlackWebhookById`

**Success Response:** 200 OK

```json
{
  "status": "success",
  "data": {
    "id": 123,
    "team_name": "VerifyWise Team",
    "channel": "#notifications",
    "is_active": true
  }
}
```

---

### POST /slackWebhooks

Creates a new Slack webhook integration after OAuth authorization.

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "code": "1234567890.abcdef",
  "userId": 1
}
```

**Controller:** `createNewSlackWebhook`

**Success Response:** 201 Created

```json
{
  "status": "success",
  "data": {
    "id": 123,
    "team_name": "VerifyWise Team",
    "channel": "#notifications",
    "is_active": true
  }
}
```

---

### PATCH /slackWebhooks/:id

Updates an existing Slack webhook's configuration.

**Authentication:** Required (JWT)

**Path Parameters:**

- `id` (required): Webhook ID to update

**Request Body:**

```json
{
  "is_active": true,
  "routing_type": ["Membership and roles", "Evidence and task alerts"]
}
```

**Controller:** `updateSlackWebhookById`

**Success Response:** 202 Accepted

```json
{
  "status": "success",
  "data": {
    "id": 123,
    "is_active": true,
    "routing_type": ["Membership and roles", "Evidence and task alerts"]
  }
}
```

---

### POST /slackWebhooks/:id/send

Sends a test message to a Slack channel.

**Authentication:** Required (JWT)

**Path Parameters:**

- `id` (required): Webhook ID

**Request Body:**

```json
{
  "title": "Test Notification",
  "message": "This is a test message from VerifyWise"
}
```

**Controller:** `sendSlackMessage`

**Success Response:** 200 OK

```json
{
  "status": "success",
  "data": {
    "success": true,
    "messageId": "1234567890.123456",
    "channel": "C1234567890"
  }
}
```
