# MLflow Plugin

ML model tracking and experiment management for VerifyWise.

## Features

- **Model Tracking**: Automatically sync ML models from your MLflow server
- **Experiment Management**: Track experiments and training runs
- **Version Control**: Maintain model version history and lineage
- **Metrics Monitoring**: Monitor model performance metrics and parameters
- **Scheduled Sync**: Hourly automated synchronization of models

## Installation

Users can install this plugin from the VerifyWise plugin marketplace. The plugin requires:

1. MLflow tracking server URL
2. Authentication credentials (optional)
3. Network access to MLflow server

## Configuration

### Authentication Methods

- **None**: Public MLflow server (no authentication)
- **Basic Auth**: Username and password
- **Token**: API token for Bearer authentication

### Configuration Example

```javascript
{
  trackingServerUrl: 'http://mlflow-server:5000',
  authMethod: 'token',
  apiToken: 'your-api-token',
  verifySsl: true,
  timeout: 30
}
```

## Usage

### Test Connection

```javascript
const plugin = require('./index');

const result = await plugin.testConnection({
  trackingServerUrl: 'http://localhost:5000',
  authMethod: 'none'
});
```

### Sync Models

```javascript
await plugin.syncModels(tenantId, config);
```

### Get Models

```javascript
const { models } = await plugin.getModels(tenantId, {
  lifecycleStage: 'Production'
});
```

### Configure Sync Schedule

```javascript
await plugin.configureSyncSchedule(tenantId, {
  schedule: '0 * * * *' // Hourly
});
```

## Database Schema

The plugin uses tenant-specific tables:

### mlflow_integrations
- `tracking_server_url` - MLflow server URL
- `auth_method` - Authentication method
- `username`, `password`, `api_token` - Encrypted credentials
- `last_synced_at`, `last_sync_status` - Sync status
- `last_tested_at`, `last_test_status` - Test status

### mlflow_model_records
- `model_name`, `version` - Model identification
- `tags`, `metrics`, `parameters` - JSONB data
- `experiment_id`, `experiment_name` - Experiment info
- `lifecycle_stage`, `status` - Model state

## Scheduled Jobs

- **Hourly Sync**: Runs every hour at minute 0
- Syncs all models from MLflow server
- Updates model records in database
- Retries up to 3 times on failure

## API Endpoints

MLflow plugin uses these MLflow API endpoints:

- `GET /api/2.0/mlflow/experiments/search` - List experiments
- `POST /api/2.0/mlflow/runs/search` - Search runs

## Development

```bash
npm install
npm test
```

## Troubleshooting

### Connection Failed
- Verify MLflow server URL is accessible
- Check authentication credentials
- Ensure firewall allows outbound connections

### Sync Failed
- Check MLflow server logs
- Verify tenant has valid configuration
- Review last_sync_message for details

## Support

For issues or questions, contact support@verifywise.com
