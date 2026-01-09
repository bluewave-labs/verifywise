export interface IAutomationAction {
  id?: number;
  key: string;
  label: string;
  description?: string;
  default_params?: Record<string, any>;
}
