// Build replacement dict for training
export function buildTrainingReplacements(training: any): Record<string, any> {
  return {
    'training.name': training.training_name,
    'training.description': training.description || '',
    'training.duration': training.duration || '',
    'training.provider': training.provider || '',
    'training.department': training.department || '',
    'training.status': training.status || '',
    'training.number_of_people': training.numberOfPeople || training.people || '',
    'date_and_time': new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
  };
}
