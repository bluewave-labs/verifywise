#!/usr/bin/env node

/**
 * Log Upload Script for Digital Ocean Spaces
 * 
 * This script uploads tenant log files to Digital Ocean Spaces for backup and archival purposes.
 * It can upload logs from specific dates or the previous day by default.
 * 
 * Usage:
 *   npx ts-node upload-logs-to-do.ts                    # Upload yesterday's logs
 *   npx ts-node upload-logs-to-do.ts --date 2025-09-09  # Upload logs for specific date
 *   npx ts-node upload-logs-to-do.ts --days 7           # Upload logs for last 7 days
 *   npx ts-node upload-logs-to-do.ts --tenant abc123    # Upload logs for specific tenant only
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { getLogBaseDirectory, getCurrentDateStringUTC } from '../tenant/tenantContext';
import dotenv from 'dotenv';
dotenv.config();

// Configuration from environment variables
const config = {
  region: process.env.DO_SPACES_REGION || 'nyc3',
  bucketName: process.env.DO_SPACES_BUCKET || 'verifywise',
  endpoint: process.env.DO_SPACES_ENDPOINT || `https://${process.env.DO_SPACES_REGION || 'nyc3'}.digitaloceanspaces.com`,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  s3Prefix: process.env.LOG_DO_PREFIX || 'tenant-logs/',
  compressionEnabled: process.env.LOG_COMPRESSION_ENABLED !== 'false',
};

// Initialize Digital Ocean Spaces client (S3-compatible)
const doClient = new S3Client({
  endpoint: config.endpoint,
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId!,
    secretAccessKey: config.secretAccessKey!,
  },
  forcePathStyle: false, // Digital Ocean Spaces uses virtual-hosted-style
});

interface UploadResult {
  tenant: string;
  date: string;
  filename: string;
  success: boolean;
  error?: string;
  size?: number;
  doKey?: string;
}

/**
 * Get date string for N days ago in UTC
 */
function getDateNDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Get all tenant directories in the logs folder
 */
function getAllTenants(): string[] {
  const logBaseDir = getLogBaseDirectory();

  if (!fs.existsSync(logBaseDir)) {
    console.log(`⚠️  Logs directory does not exist: ${logBaseDir}`);
    return [];
  }

  return fs.readdirSync(logBaseDir)
    .filter(item => {
      const itemPath = path.join(logBaseDir, item);
      return fs.statSync(itemPath).isDirectory();
    })
    .sort();
}

/**
 * Check if a file already exists in Digital Ocean Spaces
 */
async function fileExistsInDO(doKey: string): Promise<boolean> {
  try {
    await doClient.send(new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: doKey,
    }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Upload a single log file to Digital Ocean Spaces
 */
async function uploadLogFile(
  tenant: string,
  date: string,
  filename: string,
  filePath: string
): Promise<UploadResult> {
  const result: UploadResult = {
    tenant,
    date,
    filename,
    success: false,
  };

  try {
    // Check if file exists locally
    if (!fs.existsSync(filePath)) {
      result.error = 'File does not exist locally';
      return result;
    }

    const stats = fs.statSync(filePath);
    result.size = stats.size;

    // Skip empty files
    if (stats.size === 0) {
      result.error = 'File is empty';
      return result;
    }

    // Generate Digital Ocean Spaces key
    const doKey = `${config.s3Prefix}${tenant}/${date}/${filename}`;
    result.doKey = doKey;

    // // Check if file already exists in Digital Ocean Spaces
    // const existsInDO = await fileExistsInDO(doKey);
    // if (existsInDO) {
    //   result.error = 'File already exists in Digital Ocean Spaces';
    //   result.success = true; // Consider this a success since file is backed up
    //   return result;
    // }

    // Read file content
    const fileContent = fs.readFileSync(filePath);

    // Upload to Digital Ocean Spaces
    const uploadCommand = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: doKey,
      Body: fileContent,
      ContentType: 'text/plain',
      Metadata: {
        tenant: tenant,
        logDate: date,
        uploadDate: getCurrentDateStringUTC(),
        originalSize: stats.size.toString(),
        source: 'verifywise-backend',
      },
      // Make files publicly readable if needed
      ACL: 'private', // Change to 'public-read' if you want public access
    });

    await doClient.send(uploadCommand);

    result.success = true;
    console.log(`✅ Uploaded: ${doKey} (${(stats.size / 1024).toFixed(2)} KB)`);

    // Delete local file after successful upload
    try {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted local file: ${filename}`);
    } catch (deleteError: any) {
      console.warn(`⚠️  Failed to delete local file ${filename}: ${deleteError.message}`);
      // Don't fail the upload if deletion fails
    }

  } catch (error: any) {
    result.error = error.message;
    console.error(`❌ Failed to upload ${result.doKey}: ${error.message}`);
  }

  return result;
}

/**
 * Upload logs for a specific tenant and date
 */
async function uploadTenantLogsForDate(
  tenant: string,
  date: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const logBaseDir = getLogBaseDirectory();
  const tenantLogDir = path.join(logBaseDir, tenant);

  if (!fs.existsSync(tenantLogDir)) {
    console.log(`⚠️  No logs directory for tenant: ${tenant}`);
    return results;
  }

  // Look for log files for the specified date
  const logFileName = `app-${date}.log`;
  const logFilePath = path.join(tenantLogDir, logFileName);

  if (fs.existsSync(logFilePath)) {
    const result = await uploadLogFile(tenant, date, logFileName, logFilePath);
    results.push(result);
  } else {
    console.log(`📝 No log file found for ${tenant} on ${date}`);
  }

  return results;
}

/**
 * Main upload function
 */
async function uploadLogs(options: {
  date?: string;
  days?: number;
  tenant?: string;
}) {
  console.log('🚀 Starting log upload to Digital Ocean Spaces...');
  console.log(`📊 Configuration:
  - Bucket: ${config.bucketName}
  - Region: ${config.region}
  - Endpoint: ${config.endpoint}
  - Prefix: ${config.s3Prefix}
  `);

  // Validate credentials
  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error('Digital Ocean Spaces credentials not configured. Please set DO_SPACES_KEY and DO_SPACES_SECRET environment variables.');
  }

  const allResults: UploadResult[] = [];
  let tenants: string[];
  let dates: string[];

  // Determine which tenants to process
  if (options.tenant) {
    tenants = [options.tenant];
    console.log(`🎯 Processing specific tenant: ${options.tenant}`);
  } else {
    tenants = getAllTenants();
    console.log(`🏢 Found ${tenants.length} tenants: ${tenants.join(', ')}`);
  }

  // Determine which dates to process
  if (options.date) {
    dates = [options.date];
    console.log(`📅 Processing specific date: ${options.date}`);
  } else if (options.days) {
    dates = [];
    for (let i = 1; i <= options.days; i++) {
      dates.push(getDateNDaysAgo(i));
    }
    console.log(`📅 Processing last ${options.days} days: ${dates.join(', ')}`);
  } else {
    // Default: yesterday's logs
    dates = [getDateNDaysAgo(1)];
    console.log(`📅 Processing yesterday's logs: ${dates[0]}`);
  }

  // Process each tenant and date combination
  for (const tenant of tenants) {
    for (const date of dates) {
      console.log(`\n📂 Processing ${tenant} for ${date}...`);
      const results = await uploadTenantLogsForDate(tenant, date);
      allResults.push(...results);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Print summary
  console.log('\n📈 Upload Summary:');
  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);
  const totalSize = successful.reduce((sum, r) => sum + (r.size || 0), 0);

  console.log(`✅ Successful uploads: ${successful.length}`);
  console.log(`❌ Failed uploads: ${failed.length}`);
  console.log(`📊 Total size uploaded: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  if (failed.length > 0) {
    console.log('\n❌ Failed uploads:');
    failed.forEach(f => {
      console.log(`  - ${f.tenant}/${f.date}/${f.filename}: ${f.error}`);
    });
  }

  console.log('\n🏁 Log upload completed!');

  // Return results for programmatic use
  return {
    successful: successful.length,
    failed: failed.length,
    totalSize,
    results: allResults,
  };
}

// Main execution
if (require.main === module) {
  uploadLogs({
    date: new Date().toISOString().split('T')[0],
  })
    .then((results) => {
      if (results.failed > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.log(error);

      console.error('💥 Upload failed:', error.message);
      process.exit(1);
    });
}

export { uploadLogs, getAllTenants, uploadTenantLogsForDate };

