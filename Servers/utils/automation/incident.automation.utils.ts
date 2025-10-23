// Build replacement dict for incident
export function buildIncidentReplacements(incident: any): Record<string, any> {
  return {
    'incident.ai_project': incident.ai_project || '',
    'incident.type': incident.type || '',
    'incident.severity': incident.severity || '',
    'incident.status': incident.status || '',
    'incident.occurred_date': incident.occurred_date ? new Date(incident.occurred_date).toLocaleDateString('en-US', { dateStyle: 'long' }) : '',
    'incident.date_detected': incident.date_detected ? new Date(incident.date_detected).toLocaleDateString('en-US', { dateStyle: 'long' }) : '',
    'incident.reporter': incident.reporter || '',
    'incident.categories_of_harm': Array.isArray(incident.categories_of_harm) ? incident.categories_of_harm.join(', ') : '',
    'incident.affected_persons_groups': incident.affected_persons_groups || '',
    'incident.description': incident.description || '',
    'incident.relationship_causality': incident.relationship_causality || '',
    'incident.immediate_mitigations': incident.immediate_mitigations || '',
    'incident.planned_corrective_actions': incident.planned_corrective_actions || '',
    'incident.model_system_version': incident.model_system_version || '',
    'incident.approval_status': incident.approval_status || '',
    'incident.approved_by': incident.approved_by || '',
    'incident.approval_date': incident.approval_date ? new Date(incident.approval_date).toLocaleDateString('en-US', { dateStyle: 'long' }) : '',
    'incident.approval_notes': incident.approval_notes || '',
    'incident.interim_report': incident.interim_report ? 'Yes' : 'No',
    'date_and_time': new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
  };
}
