export const MITIGATION_STATUS_COLORS: Record<string, string> = {
  'Not Started': '#A0AEC0',
  'In Progress': '#3182CE',
  'Completed': '#38A169',
  'On Hold': '#ED8936',
  'Deferred': '#D69E2E',
  'Canceled': '#E53E3E',
  'Requires review': '#805AD5',
};

export const getMitigationStatusColor = (status: string): string => 
  MITIGATION_STATUS_COLORS[status] || '#B0B0B0'; 