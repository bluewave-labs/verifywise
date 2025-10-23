// Build replacement dict for project
export function buildProjectReplacements(project: any): Record<string, any> {
  return {
    'project.id': project.id,
    'project.title': project.project_title,
    'project.goal': project.goal,
    'project.owner': project.owner_name || project.owner,
    'project.start_date': project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', { dateStyle: 'long' }) : '',
    'project.ai_risk_classification': project.ai_risk_classification,
    'project.type_of_high_risk_role': project.type_of_high_risk_role,
    'project.status': project.status,
    'date_and_time': new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
  };
}
