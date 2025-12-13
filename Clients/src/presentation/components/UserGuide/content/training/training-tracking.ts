import type { ArticleContent } from '@User-guide-content/contentTypes';

export const trainingTrackingContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The Training Registry in VerifyWise helps you track AI-related training programs across your organization. Maintaining a record of training activities demonstrates that your team has the knowledge and skills needed to develop, deploy, and govern AI systems responsibly.',
    },
    {
      type: 'paragraph',
      text: 'Training records are essential for compliance with AI regulations that require organizations to ensure staff competency. The registry provides a central place to document what training has been completed, who participated, and what programs are planned for the future.',
    },
    {
      type: 'heading',
      id: 'why-track-training',
      level: 2,
      text: 'Why track AI training?',
    },
    {
      type: 'paragraph',
      text: 'AI governance requires more than policies and technical controls. People need the knowledge and skills to implement governance effectively. Tracking training helps ensure your organization builds and maintains the competencies needed for responsible AI development and use.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Compliance requirements', text: 'Many AI regulations require documented evidence of staff training on AI risks, ethics, and governance' },
        { bold: 'Competency assurance', text: 'Demonstrate that teams working with AI systems have appropriate knowledge and skills' },
        { bold: 'Audit readiness', text: 'Provide auditors with clear records of training activities and participation' },
        { bold: 'Gap identification', text: 'Identify where additional training is needed based on roles and responsibilities' },
        { bold: 'Continuous improvement', text: 'Track training over time to ensure knowledge stays current as AI technology evolves' },
      ],
    },
    {
      type: 'heading',
      id: 'training-registry-screen',
      level: 2,
      text: 'The training registry screen',
    },
    {
      type: 'paragraph',
      text: 'The Training Registry displays all training programs in a table format. Each row represents a training program with key information visible at a glance.',
    },
    {
      type: 'paragraph',
      text: 'The table displays the following columns:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Training name', text: 'The title of the training program' },
        { bold: 'Duration', text: 'How long the training takes (in hours or days)' },
        { bold: 'Provider', text: 'Who delivers the training (internal team, external vendor, online platform)' },
        { bold: 'Department', text: 'Which department the training is for or organized by' },
        { bold: 'Status', text: 'Current state of the training (Planned, In Progress, Completed)' },
        { bold: 'People', text: 'Number of participants in the training' },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/training-registry.png',
      alt: 'AI Training Registry page showing a table of training programs with columns for training name, duration, provider, department, status, and number of participants',
      caption: 'The Training Registry displays all AI-related training programs across your organization.',
    },
    {
      type: 'heading',
      id: 'training-status',
      level: 2,
      text: 'Training status workflow',
    },
    {
      type: 'paragraph',
      text: 'Training programs progress through a simple lifecycle that helps you track their current state:',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'Calendar',
          title: 'Planned',
          description: 'Training is scheduled but has not yet started. Use this for upcoming training programs.',
        },
        {
          icon: 'PlayCircle',
          title: 'In progress',
          description: 'Training is currently being conducted. Participants are actively engaged in the program.',
        },
        {
          icon: 'CheckCircle',
          title: 'Completed',
          description: 'Training has finished. All sessions have been delivered and participants have completed the program.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'adding-training',
      level: 2,
      text: 'Adding a training program',
    },
    {
      type: 'paragraph',
      text: 'To add a new training program to the registry:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click "Add training" in the toolbar' },
        { text: 'Enter the training name that clearly describes the program' },
        { text: 'Specify the duration of the training' },
        { text: 'Enter the provider (who delivers the training)' },
        { text: 'Select the department associated with this training' },
        { text: 'Set the current status (Planned, In Progress, or Completed)' },
        { text: 'Enter the number of people participating' },
        { text: 'Add a description with details about the training content and objectives' },
        { text: 'Save the training record' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Only users with Admin or Editor roles can add new training programs to the registry.',
    },
    {
      type: 'heading',
      id: 'training-fields',
      level: 2,
      text: 'Training record fields',
    },
    {
      type: 'paragraph',
      text: 'Each training record includes the following information:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Training name', text: 'A clear, descriptive title for the training program' },
        { bold: 'Duration', text: 'The length of the training (e.g., 2 hours, 1 day, 2 weeks)' },
        { bold: 'Provider', text: 'The organization or team delivering the training' },
        { bold: 'Department', text: 'The department organizing or participating in the training' },
        { bold: 'Status', text: 'Current lifecycle stage (Planned, In Progress, Completed)' },
        { bold: 'Number of people', text: 'How many participants are enrolled or have completed the training' },
        { bold: 'Description', text: 'Detailed information about the training content, objectives, and outcomes' },
      ],
    },
    {
      type: 'heading',
      id: 'filtering-searching',
      level: 2,
      text: 'Filtering and searching',
    },
    {
      type: 'paragraph',
      text: 'The training registry provides several ways to find specific training programs:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Filter', text: 'Filter by training name, status, provider, department, or duration' },
        { bold: 'Group by', text: 'Group training programs by status, provider, or department for easier navigation' },
        { bold: 'Search', text: 'Search for training programs by name' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Finding relevant training',
      text: 'Use the Group by feature to organize training by department to quickly see what training each team has completed. Group by status to identify planned training that needs scheduling or in-progress training that needs monitoring.',
    },
    {
      type: 'heading',
      id: 'editing-deleting',
      level: 2,
      text: 'Editing and deleting training records',
    },
    {
      type: 'paragraph',
      text: 'To edit a training record, click on it in the table to open the detail view. Make your changes and save. Common updates include changing status as training progresses or updating the participant count.',
    },
    {
      type: 'paragraph',
      text: 'To delete a training record, use the delete action in the training table. Consider whether you want to keep completed training records for historical reference and audit purposes before deleting.',
    },
    {
      type: 'heading',
      id: 'common-training-types',
      level: 2,
      text: 'Common AI training topics',
    },
    {
      type: 'paragraph',
      text: 'Organizations typically track training across several AI-related topics:',
    },
    {
      type: 'checklist',
      items: [
        'AI fundamentals and concepts for non-technical staff',
        'AI ethics and responsible AI development',
        'AI risk management and assessment',
        'Regulatory compliance (EU AI Act, ISO 42001, etc.)',
        'Bias detection and mitigation techniques',
        'AI security and privacy considerations',
        'Model development and testing best practices',
        'AI incident response and escalation',
        'Human oversight of AI systems',
        'AI transparency and explainability',
      ],
    },
    {
      type: 'heading',
      id: 'best-practices',
      level: 2,
      text: 'Best practices',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Document all AI training', text: 'Record both formal training programs and informal learning activities related to AI governance' },
        { bold: 'Track by role', text: 'Ensure training is appropriate for different roles (developers, managers, compliance staff)' },
        { bold: 'Update status promptly', text: 'Keep training status current so the registry reflects the actual state of training activities' },
        { bold: 'Include external training', text: 'Record training from external providers and conferences, not just internal programs' },
        { bold: 'Link to compliance', text: 'Note which training programs satisfy specific regulatory or framework requirements' },
        { bold: 'Plan ahead', text: 'Use Planned status to schedule future training and ensure continuous development' },
      ],
    },
    {
      type: 'heading',
      id: 'faq',
      level: 2,
      text: 'Frequently asked questions',
    },
    {
      type: 'heading',
      id: 'faq-required',
      level: 3,
      text: 'What training is required for AI compliance?',
    },
    {
      type: 'paragraph',
      text: 'Training requirements vary by regulation and your organization\'s AI activities. The EU AI Act requires providers of high-risk AI systems to ensure staff have sufficient AI literacy. ISO 42001 requires organizations to determine necessary competence for roles affecting AI management. Start by identifying regulatory requirements that apply to you, then assess what training your teams need to meet those requirements.',
    },
    {
      type: 'heading',
      id: 'faq-frequency',
      level: 3,
      text: 'How often should AI training be refreshed?',
    },
    {
      type: 'paragraph',
      text: 'AI technology and regulations evolve rapidly, so training should be refreshed more frequently than traditional corporate training. Consider annual refresher training for core topics and additional training when significant regulatory changes occur or new AI technologies are adopted. Track training dates in the registry to identify when refreshers are due.',
    },
    {
      type: 'heading',
      id: 'faq-who',
      level: 3,
      text: 'Who needs AI training?',
    },
    {
      type: 'paragraph',
      text: 'Anyone involved in developing, deploying, using, or governing AI systems should receive appropriate training. This includes data scientists and engineers building AI, product managers overseeing AI features, compliance and legal staff assessing AI risks, and executives making AI governance decisions. Training content should be tailored to each role\'s responsibilities.',
    },
    {
      type: 'heading',
      id: 'faq-evidence',
      level: 3,
      text: 'How do we demonstrate training compliance to auditors?',
    },
    {
      type: 'paragraph',
      text: 'The training registry provides the documentation auditors need. Export or share the registry to show what training has been completed, who participated, and when it occurred. Keep training materials and attendance records as supporting evidence. The registry serves as a summary view with details available on request.',
    },
    {
      type: 'heading',
      id: 'faq-external',
      level: 3,
      text: 'Should we track external training and certifications?',
    },
    {
      type: 'paragraph',
      text: 'Yes. External training, conferences, certifications, and self-directed learning all contribute to your organization\'s AI competency. Record these in the training registry with the provider field indicating the external source. This gives a complete picture of your team\'s AI knowledge development.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'compliance',
          articleId: 'iso-42001',
          title: 'ISO 42001 certification',
          description: 'Competence requirements for AI management systems',
        },
        {
          collectionId: 'policies',
          articleId: 'policy-management',
          title: 'Policy management basics',
          description: 'Create training-related policies',
        },
      ],
    },
  ],
};
