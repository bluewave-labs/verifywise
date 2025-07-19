export const INITIAL_SUBPROCESSORS = [
  { id: 1, company: 'Google', url: 'https://google.com', purpose: 'We use Gemini', location: 'San Francisco' },
  { id: 2, company: 'Meta', url: 'https://meta.com', purpose: 'We use their OS LLM', location: 'San Francisco' },
  { id: 3, company: 'Microsoft', url: 'https://microsoft.com', purpose: 'We use their Azure AI foundry', location: 'Redmond' },
  { id: 4, company: 'Nvidia', url: 'https://nvidia.com', purpose: 'We use their AI services', location: 'Santa Clara' },
];

export const TABLE_COLUMNS = [
  { id: 'company', label: 'COMPANY NAME' },
  { id: 'url', label: 'URL' },
  { id: 'purpose', label: 'PURPOSE' },
  { id: 'location', label: 'LOCATION' },
  { id: 'action', label: 'ACTION' },
];

export const WARNING_MESSAGES = {
  deleteTitle: "Are you sure you want to remove this subprocessor?",
  deleteMessage: "If you delete this subprocessor, it will be removed from the table and won't be visible in the public AI Trust Center.",
}; 