import { logStructured } from './fileLogger';
import { logEvent } from './dbLogger';
import logger from './fileLogger';

type LogState = 'processing' | 'successful' | 'error';
type EventType = 'Create' | 'Read' | 'Update' | 'Delete' | 'Error';

export function logProcessing(
  description: string,
  functionName: string,
  fileName: string
): void {
  logStructured('processing', description, functionName, fileName);
  logger.debug(`🔄 ${description}`);
}

export async function logSuccess(
  eventType: EventType,
  description: string,
  functionName: string,
  fileName: string
): Promise<void> {
  logStructured('successful', description, functionName, fileName);
  logger.debug(`✅ ${description}`);
  await logEvent(eventType, description);
}

export async function logFailure(
  description: string,
  functionName: string,
  fileName: string,
  error: Error
): Promise<void> {
  logStructured('error', description, functionName, fileName);
  logger.error(`❌ ${description}:`, error);
  await logEvent('Error', `${description}: ${error.message}`);
}
