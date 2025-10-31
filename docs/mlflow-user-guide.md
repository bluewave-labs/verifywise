# VerifyWise + MLflow Integration User Guide

## Introduction
The VerifyWise MLflow integration keeps your centralized model inventory in sync with the models that data science teams register inside MLflow. Once connected, VerifyWise periodically ingests model metadata, lifecycle stages, training evidence, and experiment context so governance and compliance teams can review the same source of truth that engineers see in MLflow. This guide explains how to configure the integration on the **Integrations** page and how to work with the synchronized data that appears in **Model Inventory → MLFlow data**.

## Why it matters
Connecting VerifyWise to MLflow closes the gap between experimentation and oversight by eliminating manual exports, ensuring every production-relevant version is captured with run metrics, and surfacing governance gaps when a model lacks bias, security, or privacy evidence. Scheduled syncs also create a defensible audit trail that shows when VerifyWise last contacted MLflow and whether any errors occurred, reducing the operational risk of silent failures or idle BullMQ queues.

## Prerequisites
Before configuring the integration you need:

- **VerifyWise admin access.** Only admins can open `/integrations`, edit the MLflow card, or start connection tests.
- **MLflow tracking server details.** Collect the base URL (e.g., `https://mlflow.company.com:5000`), authentication method, and any credentials. The integration is read-only, but the MLflow account must list/describe models and runs.
- **Background worker availability.** Ensure the VerifyWise BullMQ worker process is running in the same environment as the API so scheduled sync jobs execute after you complete a successful connection test.

VerifyWise supports one MLflow configuration per organization. Each tenant stores its own credentials, test history, and sync state so multi-tenant deployments stay isolated.

## Configuring MLflow in the Integrations page
1. Navigate to **Integrations → MLflow** (or use the shortcut card on the dashboard). Non-admin users will not see this page.
2. Fill in the **Tracking server URL** and **Request timeout**. The timeout controls how long VerifyWise waits before declaring the MLflow API unreachable; increase it for slower on-prem clusters.
3. Choose an **Authentication method**:
   - `None` – use when the server allows anonymous read access.
   - `Basic auth` – prompts for username and password fields directly under the selector.
   - `API token` – prompts for a personal access token or service token field.
4. If your authentication method requires extras (passwords or tokens), enter them in the newly displayed inputs. Everything you type is stored encrypted and never logged.
5. Click **Test connection**. Successful tests immediately update the *Connection status* chip, record the timestamp in the “Last successful test” card, and enable scheduled syncs. Failures surface the error, keep syncs disabled, and allow you to retry without refreshing the page.
6. After a successful test, click **Save configuration** to persist the settings. VerifyWise enforces a “test-before-save” rule to prevent stale credentials from enabling the sync scheduler.

### Status cards on the Integrations page
The MLflow card at the top of the page mirrors the compact cards used inside Model Inventory so you get the same at-a-glance health signals:

- **Connection status** shows `Connected`, `Action required`, or `Error`, using VerifyWise chip colors.
- **Last error** records the most recent failure reason (timeout, authorization, DNS, etc.). It clears itself after the next successful test or sync.
- **Last successful test** and **Last scheduled sync** display their timestamps in muted text, with icons in the top-right corner similar to the Model Overview cards.
- **Upcoming sync** indicates when the hourly (or temporarily accelerated) BullMQ job will run next.

Use the **Re-run sync** button to enqueue an immediate job without waiting for the next cron window. A slim spacer keeps the button close to the cards so the action remains visible.

## Scheduled sync behavior
- VerifyWise schedules an hourly BullMQ job per organization after the first successful test. (During debugging you can temporarily switch to minute-level intervals, but production defaults back to hourly.)
- Jobs run inside the dedicated worker process; on production deployments, ensure `npm run worker` (or its PM2/systemd equivalent) is started alongside the API so queues never sit idle.
- The job pulls registered models, versions, and their linked runs via the MLflow REST API, then upserts them into VerifyWise’s `mlflow_model_records` table with an organization-specific unique key. Duplicate inserts are suppressed, and only material changes update the record timestamps.
- Every attempt stamps the “Last scheduled sync” card and writes to the sync history table, even when no models changed, which helps audit teams prove monitoring coverage.

## Working with Model Inventory → MLFlow data
Once a sync runs, your model governance users can navigate to **Model Inventory → MLFlow data** to inspect the ingested catalog.

### Summary cards and refresh control
Four header cards (“Models”, “Active”, “Staging”, “Experiments”) appear at the top of the tab. They re-use VerifyWise’s dashboard card component, including muted icons and hover states, and summarize what is currently stored for your organization. A **Refresh** button above the cards re-triggers the API call that fetches data from the VerifyWise backend (not MLflow directly), so it is safe to click multiple times without spamming the remote MLflow server.

### Data table
The table lists each synchronized model version with columns for Model Name, Version, Lifecycle Status, Created date, Last Updated date, Description, and Actions. Pagination controls—identical to the Model Risks table—live directly beneath the grid and show “Rows per page”, an inline selector, page counts, and navigation arrows. Click any row to open the detail drawer, which includes:

- High-level metadata (version, lifecycle stage, run ID, creation time).
- Description text, tags, metrics, and parameters pulled from the MLflow run.
- Experiment information (ID, name, artifact location) so you can trace lineage.

Use the action button in the last column to inspect a model in more depth without leaving VerifyWise.

## Operational guidance and troubleshooting
- **Connection succeeds but no data appears?** Confirm the worker job is running and that the MLflow service account has permission to list registered models. The “Last scheduled sync” card should advance every hour; if it does not, expand the API logs for BullMQ worker errors.
- **Seeing `Unable to reach the MLflow backend` warnings?** Increase the Request timeout field, verify network access between VerifyWise and MLflow, and re-test the connection. The error card will capture the latest failure reason so you can share it with infrastructure teams.
- **Multi-tenant deployments:** Each tenant repeats the configuration steps above. Their cards, sync history, and model data remain isolated because VerifyWise scopes records by `organization_id`.
- **Manual refresh vs. re-run sync:** The Refresh button on the MLFlow data tab only re-queries VerifyWise’s database; use Re-run sync on the Integrations page when you need VerifyWise to pull fresh data from MLflow immediately.

With these steps, VerifyWise admins can confidently connect MLflow, monitor the health of scheduled syncs, and empower governance teams to review production model evidence directly from the Model Inventory experience.
