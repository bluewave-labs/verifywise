# Digital Ocean Spaces Log Upload System

This system automatically uploads tenant log files to Digital Ocean Spaces for backup and archival purposes.

## Overview

The log upload system consists of three main components:

1. **`upload-logs-to-do.ts`** - Main TypeScript script for uploading logs
2. **`upload-logs-wrapper.sh`** - Shell wrapper for easier execution and environment management
3. **`setup-cron.sh`** - Automated cron job setup and management

## Features

- ✅ **Multi-tenant support** - Uploads logs for all tenants automatically
- ✅ **Date-based organization** - Organizes logs by tenant and date in Digital Ocean Spaces
- ✅ **Duplicate prevention** - Skips files that already exist in Digital Ocean Spaces
- ✅ **Flexible scheduling** - Upload logs for specific dates, date ranges, or specific tenants
- ✅ **Automated cron jobs** - Easy setup for daily/periodic uploads
- ✅ **Error handling** - Comprehensive error handling and logging
- ✅ **Environment validation** - Validates configuration before running
- ✅ **UTC consistency** - Uses UTC dates for consistent file naming

## Quick Setup

### 1. Install Dependencies

The system requires Node.js and TypeScript:

```bash
cd /path/to/verifywise/Servers
npm install @aws-sdk/client-s3 ts-node typescript @types/node
```

### 2. Configure Digital Ocean Spaces

Create your Digital Ocean Spaces bucket and get your API credentials:

1. Go to Digital Ocean Control Panel → Spaces
2. Create a new Space (e.g., `verifywise-logs`)
3. Go to API → Spaces Keys
4. Generate new Access Key and Secret

### 3. Set Up Environment

```bash
# Create environment file
./scripts/setup-cron.sh env

# Edit the created file with your credentials
nano scripts/log-upload.env
```

Edit `log-upload.env`:

```bash
DO_SPACES_KEY=your-access-key-here
DO_SPACES_SECRET=your-secret-key-here
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=verifywise-logs
```

### 4. Test Configuration

```bash
./scripts/setup-cron.sh test
```

### 5. Set Up Automated Upload

```bash
# Set up daily upload at 2 AM
./scripts/setup-cron.sh cron

# Or custom schedule (every 6 hours)
./scripts/setup-cron.sh cron "0 */6 * * *"
```

## Manual Usage

### Upload Yesterday's Logs

```bash
./scripts/upload-logs-wrapper.sh upload
```

### Upload Logs for Specific Date

```bash
./scripts/upload-logs-wrapper.sh upload --date 2025-09-09
```

### Upload Last 7 Days

```bash
./scripts/upload-logs-wrapper.sh upload --days 7
```

### Upload Specific Tenant Only

```bash
./scripts/upload-logs-wrapper.sh upload --tenant abc123
```

### Test Configuration

```bash
./scripts/upload-logs-wrapper.sh test
```

## Digital Ocean Spaces Structure

Logs are organized in Digital Ocean Spaces as follows:

```
your-bucket/
├── tenant-logs/
│   ├── default/
│   │   ├── 2025-09-09/
│   │   │   └── app-2025-09-09.log
│   │   └── 2025-09-10/
│   │       └── app-2025-09-10.log
│   ├── tenant_abc123/
│   │   ├── 2025-09-09/
│   │   │   └── app-2025-09-09.log
│   │   └── 2025-09-10/
│   │       └── app-2025-09-10.log
│   └── tenant_xyz789/
│       └── 2025-09-10/
│           └── app-2025-09-10.log
```

## Environment Variables

| Variable             | Description                     | Default           | Required |
| -------------------- | ------------------------------- | ----------------- | -------- |
| `DO_SPACES_KEY`      | Digital Ocean Spaces access key | -                 | ✅       |
| `DO_SPACES_SECRET`   | Digital Ocean Spaces secret key | -                 | ✅       |
| `DO_SPACES_REGION`   | Digital Ocean region            | `nyc3`            | ❌       |
| `DO_SPACES_BUCKET`   | Spaces bucket name              | `verifywise-logs` | ❌       |
| `DO_SPACES_ENDPOINT` | Custom endpoint URL             | Auto-generated    | ❌       |
| `LOG_DO_PREFIX`      | Object key prefix               | `tenant-logs/`    | ❌       |

## Cron Job Management

### View Current Cron Jobs

```bash
./scripts/setup-cron.sh list
```

### Remove Cron Job

```bash
./scripts/setup-cron.sh remove
```

### Common Cron Schedules

| Schedule      | Description                   |
| ------------- | ----------------------------- |
| `0 2 * * *`   | Daily at 2:00 AM              |
| `0 */6 * * *` | Every 6 hours                 |
| `30 1 * * 0`  | Weekly on Sunday at 1:30 AM   |
| `0 3 1 * *`   | Monthly on the 1st at 3:00 AM |

## Logging and Monitoring

### Cron Job Logs

```bash
tail -f /var/log/verifywise-log-upload.log
```

### Manual Execution Logs

Logs are printed to stdout/stderr when running manually.

### Log Upload Status

The script provides detailed output including:

- Number of files uploaded
- Total size uploaded
- Failed uploads with reasons
- Summary statistics

## Troubleshooting

### Common Issues

**1. Credentials Not Found**

```
Error: Digital Ocean Spaces credentials not configured
```

Solution: Set `DO_SPACES_KEY` and `DO_SPACES_SECRET` environment variables.

**2. Bucket Access Denied**

```
Error: Access Denied
```

Solution: Verify bucket name and permissions. Ensure the API key has read/write access to the bucket.

**3. TypeScript Not Found**

```
Error: ts-node not found
```

Solution: Install TypeScript dependencies:

```bash
npm install --save-dev ts-node typescript @types/node
```

**4. Cron Job Not Running**

```
No output in log file
```

Solution: Check cron service status and verify paths in cron script.

### Debug Mode

For detailed debugging, you can run the TypeScript script directly:

```bash
cd /path/to/verifywise/Servers
npx ts-node scripts/upload-logs-to-do.ts --help
```

## Security Considerations

1. **Credentials Security**: Store Digital Ocean credentials securely
2. **File Permissions**: Ensure log files have appropriate permissions
3. **Network Security**: Consider VPC/firewall rules for Digital Ocean Spaces access
4. **Log Retention**: Configure appropriate retention policies in Digital Ocean Spaces

## Integration with Docker

When running in Docker, mount the logs volume and provide environment variables:

```yaml
services:
  backend:
    volumes:
      - app_logs:/app/logs
    environment:
      - DO_SPACES_KEY=${DO_SPACES_KEY}
      - DO_SPACES_SECRET=${DO_SPACES_SECRET}
      - DO_SPACES_BUCKET=verifywise-logs
```

## Cost Optimization

- **Lifecycle Policies**: Set up Digital Ocean Spaces lifecycle policies to automatically delete old logs
- **Compression**: Enable compression for larger log files
- **Selective Upload**: Use tenant-specific uploads for large deployments
- **Schedule Optimization**: Adjust upload frequency based on log volume

## Monitoring and Alerting

Consider setting up monitoring for:

- Upload success/failure rates
- Digital Ocean Spaces storage usage
- Network transfer costs
- Cron job execution status

You can integrate with monitoring tools by parsing the script output or checking exit codes.
