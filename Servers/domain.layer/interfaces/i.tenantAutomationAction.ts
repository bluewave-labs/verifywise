export interface ITenantAutomationAction {
  id?: number;
  automation_id: number;
  action_type_id: number;
  params?: Record<string, any>;
  order?: number;
}
