export interface Automation {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: Trigger | null;
  actions: Action[];
  lastRun?: Date;
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export interface Trigger {
  id: string;
  type: TriggerType;
  name: string;
  description: string;
  configuration: Record<string, any>;
  conditions?: TriggerCondition[];
}

export interface Action {
  id: string;
  type: ActionType;
  name: string;
  description: string;
  configuration: Record<string, any>;
  order: number;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export type TriggerType =
  | 'vendor_added'
  | 'model_added'
  | 'vendor_review_date_approaching';

export type ActionType =
  | 'send_email';

export interface TriggerTemplate {
  type: TriggerType;
  name: string;
  description: string;
  category: 'project' | 'risk' | 'control' | 'vendor' | 'user' | 'assessment';
  icon: string;
  defaultConfiguration: Record<string, any>;
  configurationSchema: ConfigurationField[];
}

export interface ActionTemplate {
  type: ActionType;
  name: string;
  description: string;
  category: 'notification' | 'record' | 'workflow';
  icon: string;
  defaultConfiguration: Record<string, any>;
  configurationSchema: ConfigurationField[];
  compatibleTriggers?: TriggerType[];
}

export interface ConfigurationField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'date' | 'boolean' | 'textarea';
  required: boolean;
  options?: Array<{ value: any; label: string }>;
  placeholder?: string;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface AutomationExecutionLog {
  id: string;
  automationId: string;
  triggeredAt: Date;
  triggerData: Record<string, any>;
  actions: ActionExecutionResult[];
  status: 'success' | 'partial_success' | 'failure';
  errorMessage?: string;
}

export interface ActionExecutionResult {
  actionId: string;
  status: 'success' | 'failure';
  executedAt: Date;
  result?: any;
  errorMessage?: string;
}