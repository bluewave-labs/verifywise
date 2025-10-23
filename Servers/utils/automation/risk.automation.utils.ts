// Build replacement dict for risk
export function buildRiskReplacements(risk: any): Record<string, any> {
  return {
    'risk.id': risk.id,
    'risk.name': risk.risk_name,
    'risk.description': risk.risk_description || '',
    'risk.owner': risk.owner_name || risk.risk_owner,
    'risk.ai_lifecycle_phase': risk.ai_lifecycle_phase || '',
    'risk.category': Array.isArray(risk.risk_category) ? risk.risk_category.join(', ') : '',
    'risk.impact': risk.impact || '',
    'risk.assessment_mapping': risk.assessment_mapping || '',
    'risk.controls_mapping': risk.controls_mapping || '',
    'risk.likelihood': risk.likelihood || '',
    'risk.severity': risk.severity || '',
    'risk.risk_level': risk.risk_level_autocalculated || '',
    'risk.review_notes': risk.review_notes || '',
    'risk.mitigation_status': risk.mitigation_status || '',
    'risk.current_risk_level': risk.current_risk_level || '',
    'risk.deadline': risk.deadline ? new Date(risk.deadline).toLocaleDateString('en-US', { dateStyle: 'long' }) : '',
    'risk.mitigation_plan': risk.mitigation_plan || '',
    'risk.implementation_strategy': risk.implementation_strategy || '',
    'risk.mitigation_evidence_document': risk.mitigation_evidence_document || '',
    'risk.likelihood_mitigation': risk.likelihood_mitigation || '',
    'risk.risk_severity': risk.risk_severity || '',
    'risk.final_risk_level': risk.final_risk_level || '',
    'risk.approver': risk.approver_name || risk.risk_approval,
    'risk.approval_status': risk.approval_status || '',
    'risk.date_of_assessment': risk.date_of_assessment ? new Date(risk.date_of_assessment).toLocaleDateString('en-US', { dateStyle: 'long' }) : '',
    'date_and_time': new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
  };
}
