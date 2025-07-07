import { logStructured } from './fileLogger';
import { logEvent } from './dbLogger';
import logger from './fileLogger';

type LogState = 'processing' | 'successful' | 'error';
type EventType = 'Create' | 'Read' | 'Update' | 'Delete' | 'Error';

export function logProcessing(
  logState: LogState = 'processing',
  description: string,
  functionName: string,
  fileName: string
): void {
  logStructured(logState, description, functionName, fileName);
  logger.debug(`🔄 ${description}`);
}

export async function logSuccess(
  logState: LogState = 'successful',
  eventType: EventType,
  description: string,
  functionName: string,
  fileName: string
): Promise<void> {
  logStructured(logState, description, functionName, fileName);
  logger.debug(`✅ ${description}`);
  try {
    await logEvent(eventType, description);
  } catch (error) {
    console.error('Failed to log success event to database:', error);
  }
}

export async function logFailure(
  logState: LogState = 'error',
  description: string,
  functionName: string,
  fileName: string,
  error: Error
): Promise<void> {
  logStructured(logState, description, functionName, fileName);
  logger.error(`❌ ${description}:`, error);
  try {
    await logEvent('Error', `${description}: ${error.message}`);
  } catch (dbError) {
    console.error('Failed to log failure event to database:', dbError);
  }
}
