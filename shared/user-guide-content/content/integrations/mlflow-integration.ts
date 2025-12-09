import type { ArticleContent } from '../../contentTypes';

export const mlflowIntegrationContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The MLflow integration synchronizes your MLflow model registry with VerifyWise\'s model inventory. This connection automatically imports registered models, their versions, lifecycle stages, training metrics, and experiment context into VerifyWise for governance tracking.',
    },
    {
      type: 'paragraph',
      text: 'By connecting MLflow, you eliminate manual data entry, ensure production models are captured with their metrics, and maintain audit trails showing when models were synced and any changes detected.',
    },
    {
      type: 'heading',
      id: 'why-integrate',
      level: 2,
      text: 'Why integrate with MLflow',
    },
    {
      type: 'paragraph',
      text: 'Integrating MLflow with VerifyWise provides several governance benefits:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Automated inventory', text: 'Models registered in MLflow automatically appear in your VerifyWise model inventory' },
        { bold: 'Training evidence', text: 'Metrics, parameters, and experiment data are captured as evidence of model development' },
        { bold: 'Version tracking', text: 'All model versions and lifecycle stage changes are recorded' },
        { bold: 'Governance gaps', text: 'Identify models that may be missing bias assessments, security reviews, or privacy evaluations' },
        { bold: 'Audit trails', text: 'Maintain defensible logs of sync timestamps and data changes' },
      ],
    },
    {
      type: 'heading',
      id: 'prerequisites',
      level: 2,
      text: 'Prerequisites',
    },
    {
      type: 'paragraph',
      text: 'Before configuring the MLflow integration, ensure you have:',
    },
    {
      type: 'checklist',
      items: [
        'Admin access to VerifyWise',
        'MLflow tracking server URL and connection details',
        'Authentication credentials if your MLflow server requires them',
        'Read-only access permissions on the MLflow account',
        'Background worker process running (for scheduled syncs)',
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Each organization can have one MLflow configuration. In multi-tenant deployments, each organization maintains its own isolated MLflow connection.',
    },
    {
      type: 'heading',
      id: 'configuration',
      level: 2,
      text: 'Configuring the integration',
    },
    {
      type: 'paragraph',
      text: 'To set up the MLflow integration:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to the Integrations page from the main menu' },
        { text: 'Locate the MLflow integration card' },
        { text: 'Enter your MLflow tracking server URL' },
        { text: 'Set the request timeout (increase if you have many models)' },
        { text: 'Select your authentication method' },
        { text: 'Enter credentials if required' },
        { text: 'Click Test Connection to verify connectivity' },
        { text: 'Once the test succeeds, click Save Configuration' },
      ],
    },
    {
      type: 'heading',
      id: 'authentication',
      level: 2,
      text: 'Authentication methods',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise supports three authentication methods for connecting to MLflow:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'None', text: 'For MLflow servers with anonymous read access. No credentials required.' },
        { bold: 'Basic authentication', text: 'Username and password authentication. Use this for servers configured with HTTP basic auth.' },
        { bold: 'API token', text: 'Token-based authentication. Use this for MLflow deployments that issue API tokens.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Credentials are encrypted before storage and are never logged. Use a service account with read-only permissions rather than personal credentials.',
    },
    {
      type: 'heading',
      id: 'status-cards',
      level: 2,
      text: 'Understanding status cards',
    },
    {
      type: 'paragraph',
      text: 'After configuration, the integration page displays status cards showing the current state of your MLflow connection:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Connection status', text: 'Shows Connected, Action required, or Error depending on the last test result' },
        { bold: 'Last error', text: 'Displays the most recent error message. Clears automatically after a successful test or sync.' },
        { bold: 'Last successful test', text: 'Timestamp of the most recent successful connection test' },
        { bold: 'Last scheduled sync', text: 'Timestamp of the most recent automated sync attempt' },
        { bold: 'Upcoming sync', text: 'Indicates when the next scheduled sync will occur' },
      ],
    },
    {
      type: 'heading',
      id: 'scheduled-sync',
      level: 2,
      text: 'Scheduled sync behavior',
    },
    {
      type: 'paragraph',
      text: 'Once configured, VerifyWise automatically syncs with MLflow on an hourly schedule. The sync process:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Queries MLflow for all registered models and their versions' },
        { text: 'Retrieves linked experiment runs with metrics and parameters' },
        { text: 'Updates the VerifyWise database with new or changed records' },
        { text: 'Skips records that have not changed since the last sync' },
        { text: 'Logs the sync attempt in the sync history table' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Background worker required',
      text: 'Scheduled syncs require the background worker process to be running alongside the API. Start the worker with: npm run worker',
    },
    {
      type: 'heading',
      id: 'viewing-data',
      level: 2,
      text: 'Working with MLflow data',
    },
    {
      type: 'paragraph',
      text: 'Synced MLflow data appears in the Model Inventory section under the MLflow data tab. This tab provides a read-only view of models imported from MLflow.',
    },
    {
      type: 'heading',
      id: 'summary-cards',
      level: 3,
      text: 'Summary cards',
    },
    {
      type: 'paragraph',
      text: 'At the top of the MLflow data tab, summary cards display counts for:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Models', text: 'Total number of registered models synced from MLflow' },
        { bold: 'Active', text: 'Models in the Production lifecycle stage' },
        { bold: 'Staging', text: 'Models in the Staging lifecycle stage' },
        { bold: 'Experiments', text: 'Number of unique experiments associated with synced models' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Use the Refresh button to re-query the VerifyWise database. Note that this refreshes the display from local data, not from MLflow directly.',
    },
    {
      type: 'heading',
      id: 'data-table',
      level: 3,
      text: 'Data table',
    },
    {
      type: 'paragraph',
      text: 'The main table displays synced models with the following columns:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Model name', text: 'The registered model name from MLflow' },
        { bold: 'Version', text: 'Model version number' },
        { bold: 'Lifecycle status', text: 'Current stage (None, Staging, Production, Archived)' },
        { bold: 'Created date', text: 'When the model version was registered in MLflow' },
        { bold: 'Last updated', text: 'Most recent modification timestamp' },
        { bold: 'Description', text: 'Model description from MLflow' },
        { bold: 'Actions', text: 'View details button' },
      ],
    },
    {
      type: 'heading',
      id: 'detail-drawer',
      level: 3,
      text: 'Detail drawer',
    },
    {
      type: 'paragraph',
      text: 'Click on any table row to open the detail drawer, which displays comprehensive information about the model:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Model metadata', text: 'Version, lifecycle stage, run ID, creation timestamp' },
        { bold: 'Description', text: 'Full model description from MLflow' },
        { bold: 'Tags', text: 'Key-value tags attached to the model in MLflow' },
        { bold: 'Metrics', text: 'Training and evaluation metrics from the linked run' },
        { bold: 'Parameters', text: 'Hyperparameters and configuration used during training' },
        { bold: 'Experiment info', text: 'Experiment ID, name, and artifact storage location' },
      ],
    },
    {
      type: 'heading',
      id: 'manual-sync',
      level: 2,
      text: 'Manual sync',
    },
    {
      type: 'paragraph',
      text: 'If you need to sync immediately rather than waiting for the next scheduled run, use the Re-run Sync button on the Integrations page. This triggers an immediate sync from MLflow and updates the Last scheduled sync timestamp.',
    },
    {
      type: 'paragraph',
      text: 'The Refresh button on the MLflow data tab only refreshes the display from the VerifyWise database. To pull fresh data from MLflow, use Re-run Sync on the Integrations page.',
    },
    {
      type: 'heading',
      id: 'troubleshooting',
      level: 2,
      text: 'Troubleshooting',
    },
    {
      type: 'heading',
      id: 'no-data-after-connection',
      level: 3,
      text: 'Connection succeeds but no data appears',
    },
    {
      type: 'paragraph',
      text: 'If the connection test passes but no models appear in the MLflow data tab:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Verify the background worker process is running' },
        { text: 'Check that the service account has permissions to list models in MLflow' },
        { text: 'Wait for the next scheduled sync (hourly) or trigger a manual sync' },
        { text: 'Check API logs for BullMQ errors or sync failures' },
      ],
    },
    {
      type: 'heading',
      id: 'connection-errors',
      level: 3,
      text: 'Unable to reach MLflow backend',
    },
    {
      type: 'paragraph',
      text: 'If you see connection errors:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Increase the Request Timeout value in the configuration' },
        { text: 'Verify network connectivity between VerifyWise and the MLflow server' },
        { text: 'Check that the MLflow URL is correct and includes the protocol (http:// or https://)' },
        { text: 'Verify firewall rules allow outbound connections to the MLflow server' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The error card on the Integrations page displays the most recent failure reason, which can help diagnose connectivity issues.',
    },
    {
      type: 'heading',
      id: 'stale-data',
      level: 3,
      text: 'Data appears stale or outdated',
    },
    {
      type: 'paragraph',
      text: 'If the MLflow data tab shows outdated information:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Check the Last scheduled sync timestamp to confirm syncs are running' },
        { text: 'Use Re-run Sync to trigger an immediate refresh from MLflow' },
        { text: 'Verify the worker process has not stopped or encountered errors' },
      ],
    },
    {
      type: 'heading',
      id: 'best-practices',
      level: 2,
      text: 'Best practices',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Use a service account', text: 'Create a dedicated read-only account for VerifyWise rather than using personal credentials' },
        { bold: 'Monitor sync status', text: 'Regularly check the status cards to ensure syncs are completing successfully' },
        { bold: 'Keep worker running', text: 'Ensure the background worker process runs continuously for scheduled syncs' },
        { bold: 'Document models in MLflow', text: 'Add descriptions and tags in MLflow to enrich the data available in VerifyWise' },
        { bold: 'Review governance gaps', text: 'Use the synced data to identify models that need risk assessments or security reviews' },
      ],
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'ai-governance',
          articleId: 'model-inventory',
          title: 'Managing model inventory',
          description: 'Register and track AI models',
        },
        {
          collectionId: 'integrations',
          articleId: 'integration-overview',
          title: 'Integration overview',
          description: 'View available integrations',
        },
        {
          collectionId: 'integrations',
          articleId: 'api-access',
          title: 'API access',
          description: 'Programmatic access to VerifyWise',
        },
      ],
    },
  ],
};
