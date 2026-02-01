# External Integrations

## Overview

VerifyWise integrates with external services for AI model management, notifications, repository access, and LLM capabilities. All integrations use encrypted credential storage and follow multi-tenant isolation patterns.

## Integrations Summary

| Integration | Purpose | Auth Method |
|-------------|---------|-------------|
| MLflow | AI/ML model registry sync | None/Basic/Token |
| GitHub | Private repository access | PAT (encrypted) |
| Slack | Team notifications | OAuth + Webhooks |
| LLM Providers | AI advisor capabilities | API Keys (encrypted) |

---

## MLflow Integration

### Purpose

Syncs AI/ML model metadata from MLflow tracking servers to VerifyWise model inventory.

### Database Schema

```
mlflow_integrations
├── id (PK, SERIAL)
├── tracking_server_url (VARCHAR NOT NULL)
├── auth_method (ENUM: none/basic/token)
├── username (VARCHAR, encrypted)
├── username_iv (VARCHAR)
├── password (VARCHAR, encrypted)
├── password_iv (VARCHAR)
├── api_token (VARCHAR, encrypted)
├── api_token_iv (VARCHAR)
├── verify_ssl (BOOLEAN, default: true)
├── timeout (INTEGER, default: 30)
├── last_tested_at (TIMESTAMP)
├── last_test_status (ENUM: success/error)
├── last_test_message (TEXT)
├── last_synced_at (TIMESTAMP)
├── last_sync_status (ENUM: success/partial/error)
├── last_sync_message (TEXT)
├── updated_by (FK → users)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/integrations/mlflow/test` | Test connection |
| GET | `/integrations/mlflow/config` | Get configuration |
| POST | `/integrations/mlflow/configure` | Save configuration |
| GET | `/integrations/mlflow/models` | Fetch models |
| GET | `/integrations/mlflow/sync-status` | Get sync status |
| GET | `/integrations/mlflow/health` | Health check |

### Authentication Methods

**None:**
```json
{ "authMethod": "none" }
```

**Basic Auth:**
```json
{
  "authMethod": "basic",
  "username": "user",
  "password": "pass"
}
```

**Token Auth:**
```json
{
  "authMethod": "token",
  "apiToken": "mlflow-api-token"
}
```

### Automated Sync

- **Schedule:** Hourly (cron: `0 * * * *`)
- **Queue:** BullMQ with Redis
- **Retry:** 3 attempts with exponential backoff
- **Pre-check:** Only syncs if last test was successful

### Configuration Response

```json
{
  "configured": true,
  "config": {
    "trackingServerUrl": "https://mlflow.example.com",
    "authMethod": "token",
    "timeout": 30,
    "verifySsl": true,
    "hasStoredApiToken": true,
    "lastTestStatus": "success",
    "lastSyncedAt": "2025-01-17T10:00:00Z"
  }
}
```

---

## GitHub Integration

### Purpose

Provides access to private repositories for AI Detection scanning service.

### Database Schema

```
github_tokens
├── id (PK, SERIAL)
├── encrypted_token (TEXT NOT NULL)
├── token_name (VARCHAR, default: 'GitHub Personal Access Token')
├── created_by (FK → users)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── last_used_at (TIMESTAMP)
```

### API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/integrations/github/token` | Admin | Get token status |
| POST | `/integrations/github/token` | Admin | Save token |
| DELETE | `/integrations/github/token` | Admin | Delete token |
| POST | `/integrations/github/token/test` | Admin | Test token |

### Token Formats

Supported GitHub PAT formats:
- **Classic:** `ghp_...` (40+ chars)
- **Fine-grained:** `github_pat_...` (30+ chars)
- **OAuth legacy:** 40 hex characters

### Token Test Response

```json
{
  "valid": true,
  "scopes": ["repo", "read:org"],
  "rate_limit": {
    "limit": 5000,
    "remaining": 4999,
    "reset": "2025-01-17T11:00:00Z"
  }
}
```

### Security

- Token encrypted with AES-256-CBC
- Never returned to frontend (only status)
- Admin-only access
- Usage tracking via `last_used_at`

---

## Slack Integration

### Purpose

Sends team notifications for automation events, alerts, and updates.

### Database Schema

```
slack_webhooks (public schema)
├── id (PK, SERIAL)
├── access_token (TEXT, encrypted)
├── access_token_iv (TEXT)
├── scope (TEXT NOT NULL)
├── user_id (FK → users)
├── team_name (TEXT NOT NULL)
├── team_id (TEXT NOT NULL)
├── channel (TEXT NOT NULL)
├── channel_id (TEXT NOT NULL)
├── configuration_url (TEXT NOT NULL)
├── url (TEXT, encrypted)
├── url_iv (TEXT)
├── is_active (BOOLEAN, default: true)
├── routing_type (ARRAY)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/slack-webhooks/` | List webhooks |
| GET | `/slack-webhooks/:id` | Get webhook |
| POST | `/slack-webhooks/` | Create webhook |
| PATCH | `/slack-webhooks/:id` | Update webhook |
| DELETE | `/slack-webhooks/:id` | Delete webhook |
| POST | `/slack-webhooks/:id/send` | Send message |

### OAuth Flow

1. User initiates Slack OAuth from frontend
2. Slack redirects with authorization code
3. Backend exchanges code for access token
4. Token and webhook URL encrypted and stored
5. Bot invited to selected channel

### Message Format

```json
{
  "text": "Notification from VerifyWise",
  "blocks": [
    { "type": "header", "text": { "type": "plain_text", "text": "Title" } },
    { "type": "section", "text": { "type": "mrkdwn", "text": "Message body" } },
    { "type": "context", "elements": [{ "type": "mrkdwn", "text": "📅 Timestamp" }] }
  ]
}
```

### Routing Types

Notifications can be routed to different channels based on event type (configured per webhook).

### Rate Limiting

- Webhook creation: 10 requests per hour per IP

---

## LLM Provider Integration

### Purpose

Manages API keys for LLM providers used by the AI Advisor system.

### Database Schema

```
llm_keys
├── id (PK, SERIAL)
├── key (TEXT NOT NULL, UNIQUE)
├── name (ENUM: Anthropic/OpenAI/OpenRouter)
├── url (TEXT)
├── model (TEXT NOT NULL)
└── created_at (TIMESTAMP)
```

### Supported Providers

| Provider | API URL |
|----------|---------|
| Anthropic | `https://api.anthropic.com/v1` |
| OpenAI | `https://api.openai.com/v1/` |
| OpenRouter | `https://openrouter.ai/api/v1/` |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/llm-keys/` | List all keys (masked) |
| GET | `/llm-keys/:name` | Get by provider |
| POST | `/llm-keys/` | Create key |
| PATCH | `/llm-keys/:id` | Update key |
| DELETE | `/llm-keys/:id` | Delete key |

### Key Masking

Keys returned to frontend are masked:
```
Original: sk-ant-api03-abc123...xyz789
Masked:   ****...789
```

### Create Key Request

```json
{
  "name": "Anthropic",
  "key": "sk-ant-api03-...",
  "model": "claude-3-opus-20240229"
}
```

---

## Security Patterns

### Encryption at Rest

All sensitive credentials use AES-256-CBC encryption:

```typescript
// Encryption
const { iv, value } = encrypt(plaintext);

// Decryption
const { data, success } = decrypt({ iv, value });
```

### Secret Handling

| Integration | Storage | Frontend Access |
|-------------|---------|-----------------|
| MLflow | Encrypted credentials | Status only |
| GitHub | Encrypted token | Status only |
| Slack | Encrypted token + URL | Status only |
| LLM Keys | Plain (unique constraint) | Masked (last 4 chars) |

### Access Control

| Integration | Required Role |
|-------------|---------------|
| MLflow | Authenticated |
| GitHub | Admin |
| Slack | Authenticated (user-scoped) |
| LLM Keys | Authenticated |

---

## Environment Variables

```bash
# Slack OAuth
SLACK_API_URL=https://slack.com/api/oauth.v2.access
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
FRONTEND_URL=https://app.verifywise.ai

# Encryption
ENCRYPTION_KEY=32-byte-key-for-aes-256

# Redis (for MLflow sync)
REDIS_URL=redis://localhost:6379
```

---

## Key Files

### MLflow

| File | Purpose |
|------|---------|
| `routes/integrations.route.ts` | Routes |
| `src/services/mlflow.service.ts` | Service |
| `services/mlflow/mlflowSyncProducer.ts` | Sync producer |
| `services/mlflow/mlflowSyncWorker.ts` | Sync worker |

### GitHub

| File | Purpose |
|------|---------|
| `routes/githubIntegration.route.ts` | Routes |
| `controllers/githubToken.ctrl.ts` | Controller |
| `utils/githubToken.utils.ts` | Utilities |
| `domain.layer/models/githubToken/` | Model |

### Slack

| File | Purpose |
|------|---------|
| `routes/slackWebhook.route.ts` | Routes |
| `controllers/slackWebhook.ctrl.ts` | Controller |
| `services/slack/slackNotificationService.ts` | Notification service |
| `domain.layer/models/slackNotification/` | Model |

### LLM Keys

| File | Purpose |
|------|---------|
| `routes/llmKey.route.ts` | Routes |
| `controllers/llmKey.ctrl.ts` | Controller |
| `utils/llmKey.utils.ts` | Utilities |
| `domain.layer/models/llmKey/` | Model |

---

## Related Documentation

- [Automations](./automations.md) - Uses Slack for notifications
- [Model Inventory](../domains/models.md) - Receives MLflow data
- [AI Detection](../domains/ai-detection.md) - Uses GitHub integration
