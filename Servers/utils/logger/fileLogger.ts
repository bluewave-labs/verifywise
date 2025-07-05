import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, printf, colorize } = format;
const isDev = process.env.NODE_ENV !== 'production';

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const rotatingFileTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs/app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '14d',
  level: 'info',
});

const consoleTransport = new transports.Console({
  level: 'debug',
  format: combine(colorize(), timestamp(), logFormat),
});

const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(timestamp(), logFormat),
  transports: isDev ? [consoleTransport, rotatingFileTransport] : [rotatingFileTransport],
});

export default logger;

let logId = 1;

export function logStructured(
  state: 'processing' | 'successful' | 'error',
  description: string,
  functionName: string,
  fileName: string
) {
  const timestamp = new Date().toISOString();
  const line = `${logId++}, ${timestamp}, ${state}, ${description}, ${functionName}, ${fileName}`;
  logger.info(line);
}
