// Build replacement dict for policy
export function buildPolicyReplacements(policy: any): Record<string, any> {
  return {
    'policy.title': policy.title,
    'policy.content': policy.content_html || '',
    'policy.status': policy.status || '',
    'policy.tags': Array.isArray(policy.tags) ? policy.tags.join(', ') : '',
    'policy.next_review_date': policy.next_review_date ? new Date(policy.next_review_date).toLocaleDateString('en-US', { dateStyle: 'long' }) : '',
    'policy.author': policy.author_name || policy.author_id,
    'policy.reviewers': policy.reviewer_names || '',
    'date_and_time': new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
  };
}
