export const INITIAL_RESOURCES = [
  { id: 1, name: 'AI Ethics and Principles', type: 'Continuous Learning and Model Update Policy', visible: true, file: { name: 'ethics.pdf', size: '1.2MB' }, uploaded: true },
  { id: 2, name: 'Algorithmic Transparency Report', type: 'AI Governance Framework', visible: false, file: { name: 'transparency.pdf', size: '1.1MB' }, uploaded: true },
  { id: 3, name: 'Bias and Fairness Assessment', type: 'Data Annotation and Labeling Standards', visible: false, file: null, uploaded: false },
  { id: 4, name: 'Risk management', type: 'Ethical AI Use Cases and Exclusions', visible: true, file: { name: 'risk.pdf', size: '1.3MB' }, uploaded: true },
];

export const TABLE_COLUMNS = [
  { id: 'name', label: 'RESOURCE NAME' },
  { id: 'type', label: 'TYPE OR PURPOSE OF RESOURCE' },
  { id: 'visible', label: 'VISIBILITY' },
  { id: 'action', label: 'ACTION' },
];

export const WARNING_MESSAGES = {
  deleteTitle: "Delete this resource?",
  deleteMessage: "When you delete this resource, all data related to this resource will be removed. This action is non-recoverable.",
}; 