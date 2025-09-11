import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import * as fs from "fs";
import * as path from "path";
import { getTenantLogDirectory, getCurrentDateStringUTC } from "./tenant/tenantContext";

export const getEventsQuery = async (
  tenant: string
) => {
  const events = await sequelize.query(
    `SELECT * FROM "${tenant}".event_logs ORDER BY timestamp DESC`,
    {
      type: QueryTypes.SELECT,
    }
  );
  return events;
};

export const getLogsQuery = async (tenant: string) => {
  try {
    // Get current date in YYYY-MM-DD format using UTC
    const currentDate = getCurrentDateStringUTC();
    const logFileName = `app-${currentDate}.log`;

    // Use the new tenant-aware log directory path
    const tenantLogDir = getTenantLogDirectory(tenant);
    const logFilePath = path.join(tenantLogDir, logFileName);

    console.log("logFilePath ==>", logFilePath);
    // Check if the current day's log file exists
    if (!fs.existsSync(logFilePath)) {
      return {
        success: false,
        message: `Log file for today (${currentDate}) not found for tenant ${tenant}`,
        data: null,
      };
    }

    // Read the entire file
    const fileContent = fs.readFileSync(logFilePath, "utf8");
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

    // Get the last 500 lines (or all lines if less than 500)
    const lastLines = lines.slice(-500);

    return {
      success: true,
      message: `Successfully read last ${lastLines.length} lines`,
      data: lastLines,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error reading log file: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }
};

/**
 * Get logs for a specific date and tenant
 * @param tenant - The tenant ID
 * @param date - Date in YYYY-MM-DD format (optional, defaults to today)
 * @param maxLines - Maximum number of lines to return (optional, defaults to 500)
 */
export const getLogsByDateQuery = async (
  tenant: string,
  date?: string,
  maxLines: number = 500
) => {
  try {
    const targetDate = date || getCurrentDateStringUTC();
    const logFileName = `app-${targetDate}.log`;

    // Use the new tenant-aware log directory path
    const tenantLogDir = getTenantLogDirectory(tenant);
    const logFilePath = path.join(tenantLogDir, logFileName);

    console.log("logFilePath ==>", logFilePath);

    // Check if the log file exists
    if (!fs.existsSync(logFilePath)) {
      return {
        success: false,
        message: `Log file for ${targetDate} not found for tenant ${tenant}`,
        data: null,
      };
    }

    // Read the entire file
    const fileContent = fs.readFileSync(logFilePath, "utf8");
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

    // Get the last N lines (or all lines if less than N)
    const lastLines = lines.slice(-maxLines);

    return {
      success: true,
      message: `Successfully read last ${lastLines.length} lines from ${targetDate}`,
      data: lastLines,
      totalLines: lines.length,
      date: targetDate,
      tenant: tenant,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error reading log file: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }
};

/**
 * Get list of available log files for a tenant
 * @param tenant - The tenant ID
 */
export const getAvailableLogFilesQuery = async (tenant: string) => {
  try {
    const tenantLogDir = getTenantLogDirectory(tenant);

    // Check if tenant directory exists
    if (!fs.existsSync(tenantLogDir)) {
      return {
        success: false,
        message: `No logs directory found for tenant ${tenant}`,
        data: [],
      };
    }

    // Get all .log files in the directory
    const files = fs.readdirSync(tenantLogDir)
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(tenantLogDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          lastModified: stats.mtime,
          date: file.match(/app-(\d{4}-\d{2}-\d{2})\.log/)?.[1] || 'unknown'
        };
      })
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    return {
      success: true,
      message: `Found ${files.length} log files for tenant ${tenant}`,
      data: files,
      tenant: tenant,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error listing log files: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: [],
    };
  }
};
