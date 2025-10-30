import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { getTenantIdForLogging, ensureTenantLogDirectory, getCurrentDateStringUTC } from '../tenant/tenantContext';

const { combine, timestamp, printf, colorize } = format;
const isDev = process.env.NODE_ENV !== 'production';

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

/**
 * Create a tenant-specific rotating file transport
 * Uses UTC timezone to ensure consistent date-based file naming across different server timezones
 */
function createTenantRotatingFileTransport(tenantId: string): DailyRotateFile {
  const tenantLogDir = ensureTenantLogDirectory(tenantId);

  return new DailyRotateFile({
    filename: path.join(tenantLogDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '14d',
    level: 'info',
    utc: true, // Force UTC timezone to prevent date inconsistencies
  });
}

const consoleTransport = new transports.Console({
  level: 'debug',
  format: combine(colorize(), timestamp(), logFormat),
});

// Create default logger with console transport
const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(timestamp(), logFormat),
  transports: isDev ? [consoleTransport] : [],
});

/**
 * Get or create a tenant-specific logger
 */
function getTenantLogger(tenantId: string = 'default') {
  // For development, use console + file logging
  // For production, use only file logging in tenant-specific directories
  const fileTransport = createTenantRotatingFileTransport(tenantId);

  return createLogger({
    level: isDev ? 'debug' : 'info',
    format: combine(timestamp({ format: () => new Date().toISOString() }), logFormat),
    transports: isDev ? [consoleTransport, fileTransport] : [fileTransport],
  });
}

export default logger;

let logId = 1;

export function logStructured(
  state: 'processing' | 'successful' | 'error',
  description: string,
  functionName: string,
  fileName: string
) {
  // Use UTC timestamp to ensure consistency across timezones
  const timestamp = new Date().toISOString();
  const line = `${logId++}, ${timestamp}, ${state}, ${description}, ${functionName}, ${fileName}`;

  // Get the tenant ID from context, fallback to 'default'
  const tenantId = getTenantIdForLogging();
  const tenantLogger = getTenantLogger(tenantId);

  tenantLogger.info(line);
}

/**
 * Get a tenant-aware logger instance for general logging
 * This can be used for non-structured logging throughout the application
 */
export function getTenantAwareLogger() {
  const tenantId = getTenantIdForLogging();
  return getTenantLogger(tenantId);
}
