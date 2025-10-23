// Build replacement dict for task
export function buildTaskReplacements(task: any): Record<string, any> {
  return {
    'task.id': task.id,
    'task.title': task.title,
    'task.description': task.description || '',
    'task.creator': task.creator_name || task.creator_id,
    'task.assignees': task.assignee_names || '',
    'task.due_date': task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { dateStyle: 'long' }) : '',
    'task.priority': task.priority,
    'task.status': task.status,
    'task.categories': Array.isArray(task.categories) ? task.categories.join(', ') : '',
    'date_and_time': new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
  };
}
