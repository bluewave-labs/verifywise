import type { ArticleContent } from '../../contentTypes';

export const quickStartContent: ArticleContent = {
  blocks: [
    {
      type: 'time-estimate',
      text: '**Time to complete:** Less than 10 minutes',
    },
    {
      type: 'heading',
      id: 'what-youll-accomplish',
      level: 2,
      text: "What you'll accomplish",
    },
    {
      type: 'paragraph',
      text: "This guide walks you through setting up your first AI governance use case in VerifyWise. By the end, you'll have a working use case with a compliance framework, controls to track, and your first piece of evidence uploaded.",
    },
    {
      type: 'checklist',
      items: [
        'Create a new AI use case',
        'Link it to a compliance framework like EU AI Act or ISO 42001',
        'Understand how controls and assessments work',
        'Upload your first evidence document',
        'See your compliance progress on the dashboard',
      ],
    },
    {
      type: 'heading',
      id: 'step-1',
      level: 2,
      text: 'Step 1: Create your first use case',
    },
    {
      type: 'paragraph',
      text: 'Use cases in VerifyWise represent individual AI systems that you want to govern. Each use case has its own compliance tracking, risk assessments, and evidence collection.',
    },
    {
      type: 'ordered-list',
      items: [
        { bold: '', text: 'From the dashboard, click the **"New use case"** button' },
        { bold: '', text: 'Enter a name that describes your AI system (e.g., "Customer Support Chatbot")' },
        { bold: '', text: 'Add a brief description of what the system does and its purpose' },
        { bold: '', text: 'Click **"Create"** to set up the use case' },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/create-use-case.png',
      alt: 'Create new use case modal showing fields for title, owner, start date, geography, applicable regulations, AI risk classification, goal, and description',
      caption: 'The create use case form captures essential information about your AI use case.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Tip',
      text: "Choose a clear, descriptive name for your use case. You'll see it on the dashboard and in reports, so make it easy to identify at a glance.",
    },
    {
      type: 'heading',
      id: 'step-2',
      level: 2,
      text: 'Step 2: Select a compliance framework',
    },
    {
      type: 'paragraph',
      text: 'Compliance frameworks define the requirements you need to meet. VerifyWise comes with several built-in frameworks that you can apply to your use case.',
    },
    {
      type: 'grid-cards',
      items: [
        { icon: 'Shield', title: 'EU AI Act', description: 'European Union AI regulation requirements' },
        { icon: 'FileText', title: 'ISO 42001', description: 'AI management system standard' },
        { icon: 'Shield', title: 'ISO 27001', description: 'Information security management' },
        { icon: 'AlertTriangle', title: 'NIST AI RMF', description: 'US AI risk management framework' },
      ],
    },
    {
      type: 'ordered-list',
      items: [
        { bold: '', text: 'In your new use case, navigate to **Assurance → Compliance tracker**' },
        { bold: '', text: 'Click **"Add framework"**' },
        { bold: '', text: 'Select the framework that applies to your AI system' },
        { bold: '', text: 'VerifyWise will automatically populate the required controls and assessments' },
      ],
    },
    {
      type: 'heading',
      id: 'step-3',
      level: 2,
      text: 'Step 3: Review your controls',
    },
    {
      type: 'paragraph',
      text: "Controls are the specific requirements you need to implement. When you add a framework, VerifyWise creates a set of controls based on that framework's requirements.",
    },
    {
      type: 'ordered-list',
      items: [
        { bold: '', text: 'Go to **Assurance → Controls** to see the full list' },
        { bold: '', text: 'Each control shows its title, description, and current status' },
        { bold: '', text: 'Click on a control to see its sub-controls and detailed requirements' },
        { bold: '', text: 'Mark controls as "In progress" or "Implemented" as you address them' },
      ],
    },
    {
      type: 'paragraph',
      text: "Don't worry about completing everything right away. The goal is to understand the structure and start tracking your progress over time.",
    },
    {
      type: 'heading',
      id: 'step-4',
      level: 2,
      text: 'Step 4: Add evidence',
    },
    {
      type: 'paragraph',
      text: "Evidence demonstrates that you've implemented a control. This could be documentation, screenshots, policies, test results, or any other artifact that proves compliance.",
    },
    {
      type: 'ordered-list',
      items: [
        { bold: '', text: 'Navigate to **Governance → Evidence hub**' },
        { bold: '', text: 'Click **"Upload evidence"**' },
        { bold: '', text: 'Select a file from your computer (PDF, DOCX, images, etc.)' },
        { bold: '', text: 'Add a title and description explaining what this evidence demonstrates' },
        { bold: '', text: 'Link it to the relevant control(s)' },
        { bold: '', text: 'Click **"Save"** to upload' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Tip',
      text: "Start with evidence you already have — existing policies, data processing agreements, or model documentation. You don't need to create new documents right away.",
    },
    {
      type: 'heading',
      id: 'step-5',
      level: 2,
      text: 'Step 5: Check your progress',
    },
    {
      type: 'paragraph',
      text: "Return to the dashboard to see how your use case is tracking. The use case card will now show your compliance percentage based on the controls you've addressed.",
    },
    {
      type: 'info-box',
      icon: 'FolderKanban',
      title: 'Your use case card now shows',
      items: [
        'Compliance percentage — increases as you implement controls',
        'Assessment progress — tracks completed vs. total assessments',
        'Control status — shows how many controls are in each state',
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/project-overview.png',
      alt: 'Use case overview page showing owner, status, EU AI Act completion progress, and risk summary cards',
      caption: 'The use case overview displays your compliance progress at a glance.',
    },
    {
      type: 'heading',
      id: 'whats-next',
      level: 2,
      text: "What's next",
    },
    {
      type: 'paragraph',
      text: "Congratulations! You've set up your first AI governance use case. Here are some suggested next steps to continue building out your governance program:",
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Add team members', text: 'Invite colleagues to collaborate on governance tasks' },
        { bold: 'Register AI models', text: 'Track the specific models used in your use case' },
        { bold: 'Conduct a risk assessment', text: 'Identify and document potential risks' },
        { bold: 'Set up vendor tracking', text: 'Monitor third-party AI tools and services' },
        { bold: 'Create policies', text: 'Document your internal AI governance policies' },
      ],
    },
    {
      type: 'callout',
      variant: 'success',
      title: "You're off to a great start!",
      text: "AI governance is an ongoing process. VerifyWise helps you track progress over time, so don't feel pressured to complete everything at once. Focus on one area at a time and build from there.",
    },
  ],
};
