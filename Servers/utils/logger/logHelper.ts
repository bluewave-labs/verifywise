import { logStructured } from './fileLogger';
import { logEvent } from './dbLogger';
import logger from './fileLogger';

type LogState = 'processing' | 'successful' | 'error';
type EventType = 'Create' | 'Read' | 'Update' | 'Delete' | 'Error';

interface LogProcessingParams {
  logState?: LogState;
  description: string;
  functionName: string;
  fileName: string;
}
interface LogSuccessParams extends LogProcessingParams {
  eventType: EventType;
}
interface LogFailureParams extends LogProcessingParams {
  error: Error;
}

export function logProcessing({
  logState = 'processing',
  description,
  functionName,
  fileName,
}: LogProcessingParams): void {
  logStructured(logState, description, functionName, fileName);
  logger.debug(`🔄 ${description}`);
}


export async function logSuccess({
  logState = 'successful',
  eventType,
  description,
  functionName,
  fileName,
}: LogSuccessParams): Promise<void> {
  logStructured(logState, description, functionName, fileName);
  logger.debug(`✅ ${description}`);
  try {
    await logEvent(eventType, description);
  } catch (error) {
    console.error('Failed to log success event to database:', error);
  }
}

export async function logFailure({
  logState = 'error',
  description,
  functionName,
  fileName,
  error,
}: LogFailureParams): Promise<void> {
  logStructured(logState, description, functionName, fileName);
  logger.error(`❌ ${description}:`, error);
  try {
    await logEvent('Error', `${description}: ${error.message}`);
  } catch (dbError) {
    console.error('Failed to log failure event to database:', dbError);
  }
}
