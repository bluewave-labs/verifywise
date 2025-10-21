// Build replacement dict for model
export function buildModelReplacements(model: any): Record<string, any> {
  return {
    'model.id': model.id,
    'model.provider': model.provider,
    'model.name': model.model,
    'model.version': model.version,
    'model.provider_model': model.provider_model,
    'model.approver': model.approver,
    'model.capabilities': model.capabilities,
    'model.security_assessment': model.security_assessment ? 'Yes' : 'No',
    'model.status': model.status,
    'model.status_date': model.status_date ? new Date(model.status_date).toLocaleDateString('en-US', { dateStyle: 'long' }) : '',
    'model.reference_link': model.reference_link,
    'model.biases': model.biases,
    'model.limitations': model.limitations,
    'model.hosting_provider': model.hosting_provider,
    'model.used_in_projects': model.used_in_projects,
    'model.created_at': model.created_at ? new Date(model.created_at).toLocaleDateString('en-US', { dateStyle: 'long' }) : '',
    'date_and_time': new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
  };
}
