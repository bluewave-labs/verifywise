/**
 * Interface for a single message in an advisor conversation
 */
export interface IAdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string; // ISO timestamp
  chartData?: unknown; // Optional chart data for assistant messages
}

/**
 * Interface for an advisor conversation
 */
export interface IAdvisorConversation {
  id?: number;
  user_id: number;
  domain: string;
  messages: IAdvisorMessage[];
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Valid advisor domains (matching frontend advisorConfig.ts)
 */
export type AdvisorDomain =
  | 'risk-management'
  | 'model-inventory'
  | 'model-risks'
  | 'vendors'
  | 'ai-incident-managements'
  | 'tasks'
  | 'policies'
  | 'use-cases'
  | 'datasets'
  | 'frameworks'
  | 'training'
  | 'evidence'
  | 'reporting'
  | 'ai-trust-center'
  | 'agent-discovery';

/**
 * Maximum number of messages to store per conversation
 */
export const MAX_MESSAGES_PER_CONVERSATION = 50;
