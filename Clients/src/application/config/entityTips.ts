export interface Tip {
  header: string;
  content: string;
}

export interface EntityTips {
  [entityName: string]: Tip[];
}

export const ENTITY_TIPS: EntityTips = {
  dashboard: [
    {
      header: "The Dashboard gives you a real-time snapshot of your AI governance health.",
      content: "Your dashboard automatically updates as tasks complete, risks change, and compliance deadlines approach. Use the overview cards to quickly identify areas needing attention. Click any metric to drill down into detailed views and take action.",
    },
    {
      header: "Quick actions are available from every dashboard card.",
      content: "Hover over any dashboard metric to reveal quick action buttons. You can add new items, view details, or export data without navigating away. This saves time when you need to act on urgent items.",
    },
    {
      header: "Dashboard widgets can be customized to match your workflow.",
      content: "The dashboard displays the most critical metrics for AI governance. As you use the system, you'll see trends and patterns that help predict compliance gaps before they become issues.",
    },
  ],
  tasks: [
    {
      header: "Tasks automatically track your AI governance workload.",
      content: "Tasks are generated from policies, frameworks, and risk assessments to ensure nothing falls through the cracks. Overdue tasks appear in red, and upcoming tasks help you plan ahead. Complete tasks on time to maintain compliance momentum.",
    },
    {
      header: "Task priorities help you focus on what matters most.",
      content: "High-priority tasks require immediate attention and often tie to regulatory deadlines or critical risks. Use filters to view tasks by priority, assignee, or due date. Completing high-priority tasks first reduces compliance risk.",
    },
    {
      header: "Bulk actions let you manage multiple tasks efficiently.",
      content: "Select multiple tasks to assign, update status, or change due dates in one action. This is especially useful when reorganizing workloads or responding to team changes. Use the checkbox column to select tasks.",
    },
    {
      header: "Tasks can be linked to evidence for audit trails.",
      content: "Attach files, notes, and evidence directly to tasks to create a complete audit trail. This documentation proves compliance during audits and makes it easier to train new team members on processes.",
    },
  ],
  overview: [
    {
      header: "Use Cases define where and how AI is used in your organization.",
      content: "Every AI deployment should have a documented use case. This creates visibility into AI activities and helps identify potential risks before deployment. Start by documenting your most critical or highest-risk AI systems.",
    },
    {
      header: "Use Cases connect to all other governance activities.",
      content: "When you create a use case, it automatically links to relevant risks, policies, and compliance requirements. This creates a connected governance ecosystem where changes in one area update related items. Think of use cases as the foundation of your AI governance.",
    },
    {
      header: "Use Case status tracking shows your AI lifecycle stages.",
      content: "Track use cases from planning through production to retirement. Status indicators help you see which AI systems are active, which are in development, and which need review. Regular status updates ensure governance stays current.",
    },
    {
      header: "Grouping use cases reveals patterns and shared risks.",
      content: "Use the group-by feature to organize use cases by department, risk level, or model type. This reveals patterns like departments with high AI adoption or common risk factors across systems. These insights inform governance strategy.",
    },
  ],
  framework: [
    {
      header: "Frameworks map your compliance requirements to actions.",
      content: "Each framework (like NIST AI RMF or EU AI Act) contains controls that translate regulatory requirements into specific tasks and policies. Select frameworks relevant to your industry to automatically generate compliance workstreams.",
    },
    {
      header: "Framework progress shows your compliance maturity.",
      content: "The completion percentage for each framework indicates how well you meet regulatory standards. Focus on frameworks with lower scores or upcoming deadlines. Gradual improvement is normal—aim for consistent progress rather than perfection.",
    },
    {
      header: "Sub-controls break complex requirements into manageable steps.",
      content: "Each framework control contains sub-controls that define specific actions needed for compliance. Click into any control to see what's required, assign owners, and track completion. This granular approach prevents overwhelming teams with massive compliance initiatives.",
    },
    {
      header: "Multiple frameworks can share controls for efficiency.",
      content: "Many regulatory frameworks have overlapping requirements. When you complete a control that maps to multiple frameworks, all related frameworks update automatically. This means you often accomplish more compliance than you realize with each completed item.",
    },
  ],
  vendors: [
    {
      header: "Vendor risk assessments protect your organization from third-party AI risks.",
      content: "AI vendors introduce unique risks around data handling, model bias, and security. Regular vendor assessments ensure these risks are identified and managed. Many frameworks require documented vendor due diligence, making this essential for compliance.",
    },
    {
      header: "Vendor reviews should happen at least annually.",
      content: "Set review dates for each vendor to ensure regular reassessment. Vendors change their practices, acquire new technology, or face security incidents. Annual reviews help you catch these changes before they impact your organization.",
    },
    {
      header: "Risk scores help prioritize vendor management efforts.",
      content: "High-risk vendors require more frequent review and stricter controls. Use risk scores to determine which vendors need enhanced due diligence, contract terms, or monitoring. This risk-based approach allocates your team's time effectively.",
    },
    {
      header: "Document vendor compliance certifications for audits.",
      content: "Upload vendor SOC 2 reports, ISO certifications, and security documentation to the vendor record. This creates a centralized repository of compliance evidence and makes audit responses faster. Update these documents when vendors provide new versions.",
    },
  ],
  "model-inventory": [
    {
      header: "Model Inventory creates visibility into all AI models in use.",
      content: "Many organizations don't know how many AI models they're using or where they're deployed. This registry provides that critical visibility. Start by inventorying production models, then expand to development and experimental models.",
    },
    {
      header: "Model metadata helps assess risk and performance.",
      content: "Documenting model type, version, training data, and use case enables better risk assessment and performance tracking. This information is essential for responding to model issues, planning updates, and demonstrating responsible AI practices.",
    },
    {
      header: "Version tracking prevents deployment of outdated models.",
      content: "Record each model version with its deployment date and changes. This helps you ensure only approved versions run in production and makes it easier to rollback if issues arise. Version history is also critical for audit trails.",
    },
    {
      header: "Link models to vendors for complete supply chain visibility.",
      content: "If you use third-party models or APIs, link them to vendor records. This connection helps track vendor risks, contract terms, and compliance requirements that affect model usage. It's essential for AI supply chain governance.",
    },
  ],
  "risk-management": [
    {
      header: "Risk identification is the foundation of responsible AI.",
      content: "AI systems introduce unique risks around bias, privacy, security, and accuracy. Proactively identifying these risks before deployment prevents incidents and builds stakeholder trust. Use risk templates to ensure you're considering all categories.",
    },
    {
      header: "Risk ratings determine mitigation priority.",
      content: "Not all risks require immediate action. High and critical risks need urgent mitigation, while lower risks can be monitored or accepted. This prioritization ensures your team focuses on what matters most. Review ratings quarterly as context changes.",
    },
    {
      header: "Mitigation plans turn risk awareness into action.",
      content: "Every identified risk should have a mitigation plan with clear owners and timelines. Without plans, risk registers become shelf-ware. Document specific controls, compensating measures, or monitoring approaches for each risk.",
    },
    {
      header: "Residual risk shows what remains after controls.",
      content: "Even with mitigations, some risk remains—this is residual risk. Tracking residual risk helps leadership make informed decisions about risk acceptance. If residual risk is too high, additional controls may be needed.",
    },
  ],
  "fairness-dashboard": [
    {
      header: "Bias testing ensures AI treats all groups fairly.",
      content: "AI models can perpetuate or amplify societal biases present in training data. Regular bias assessments identify these issues before they harm individuals or create legal liability. Many regulations now require bias testing for high-risk AI systems.",
    },
    {
      header: "Fairness metrics should align with your use case.",
      content: "Different fairness definitions exist (demographic parity, equalized odds, etc.), and the right metric depends on your application. Document which fairness metrics you're using and why. This shows thoughtful consideration during audits.",
    },
    {
      header: "Bias monitoring is ongoing, not one-time.",
      content: "Model behavior changes as real-world data evolves. Continuous bias monitoring catches issues that emerge post-deployment. Set up regular bias testing schedules and automated alerts for when fairness metrics degrade.",
    },
    {
      header: "Document bias findings and remediation actions.",
      content: "When you discover bias, document the finding, its severity, and how you addressed it. This creates an audit trail showing responsible AI practices. Even if you can't fully eliminate bias, showing mitigation efforts demonstrates due diligence.",
    },
  ],
  training: [
    {
      header: "Training records prove your team understands AI governance.",
      content: "Regulators and auditors want evidence that personnel are trained on AI policies and responsible practices. The training registry tracks who completed which training and when. This documentation is essential for compliance and reduces organizational risk.",
    },
    {
      header: "Annual training refreshers keep policies top of mind.",
      content: "Even well-trained teams forget policy details over time. Annual refresher training ensures everyone stays current on AI governance requirements. Many frameworks mandate annual training, making this a compliance necessity.",
    },
    {
      header: "Role-based training ensures relevant skills for each person.",
      content: "Different roles need different AI governance training. Developers need technical training on bias testing and security, while executives need strategic training on AI risk oversight. Tailor training to roles for maximum effectiveness.",
    },
    {
      header: "Track training completion for audit readiness.",
      content: "When auditors ask \"How do you ensure staff competence?\", point to training records showing completion dates, topics covered, and assessment scores. This objective evidence is much stronger than anecdotal responses.",
    },
  ],
  "file-manager": [
    {
      header: "Centralized evidence storage speeds up audits.",
      content: "When auditors request documentation, you need to find it quickly. Storing all AI governance evidence in one place—assessments, approvals, test results—makes audit responses faster and reduces stress. Tag files clearly for easy retrieval.",
    },
    {
      header: "Link evidence to related items for context.",
      content: "Connect evidence files to the policies, risks, or models they support. These links create a documented trail showing how evidence supports governance activities. Auditors follow these trails to verify your governance claims.",
    },
    {
      header: "Version control prevents using outdated documents.",
      content: "Upload new versions of documents when they're updated and mark old versions as superseded. This prevents teams from accidentally using outdated policies or procedures. Version history also shows how your practices evolved over time.",
    },
    {
      header: "Retention policies keep evidence available when needed.",
      content: "Different regulations have different retention requirements—some require 3 years, others 7 or more. Set retention policies for evidence based on regulatory requirements. Don't delete evidence prematurely, as you may need it for audits years later.",
    },
  ],
  reporting: [
    {
      header: "Reports communicate AI governance status to stakeholders.",
      content: "Executives, boards, and regulators need regular updates on AI governance activities. Pre-built reports summarize key metrics, risks, and compliance status. Schedule regular reporting to keep stakeholders informed and engaged.",
    },
    {
      header: "Export reports for presentations and documentation.",
      content: "Export reports to PDF or Excel for sharing in presentations, board meetings, or regulatory submissions. Customized reports show stakeholders exactly what they need to know without overwhelming them with details.",
    },
    {
      header: "Trend reports reveal governance progress over time.",
      content: "Month-over-month comparisons show whether your governance program is maturing. Look for trends like decreasing high-priority risks, increasing control completion, or faster task closure. These trends demonstrate program effectiveness.",
    },
    {
      header: "Custom reports can be created for specific needs.",
      content: "If standard reports don't meet your needs, create custom reports filtering by date range, department, risk level, or other criteria. Save custom reports to reuse them for regular stakeholder updates.",
    },
  ],
  "ai-trust-center": [
    {
      header: "The AI Trust Center builds public confidence in your AI.",
      content: "Transparency about AI use, safety measures, and governance practices builds trust with customers, regulators, and the public. The Trust Center publishes information about your AI practices externally. Use it to demonstrate responsible AI leadership.",
    },
    {
      header: "Public transparency can be a competitive advantage.",
      content: "Organizations that openly share their AI governance practices stand out in the market. Trust Center content shows customers you're serious about responsible AI. This transparency can differentiate you from competitors who hide their AI practices.",
    },
    {
      header: "Control what information is published externally.",
      content: "Not all governance information should be public. The Trust Center lets you selectively publish high-level information about policies, principles, and oversight while keeping sensitive details internal. Review published content regularly to ensure accuracy.",
    },
    {
      header: "Trust Center content should stay current.",
      content: "Outdated Trust Center information damages credibility. Update published content when policies change, new AI systems deploy, or governance practices evolve. Regular updates show ongoing commitment to responsible AI.",
    },
  ],
  policies: [
    {
      header: "Policies set clear expectations for responsible AI use.",
      content: "Without clear policies, teams make inconsistent AI decisions that create risk. Policy Manager helps you create, approve, and distribute AI governance policies. Start with essential policies like acceptable use, data handling, and bias testing.",
    },
    {
      header: "Policies have renewal dates to make it easier to prepare for compliance goals.",
      content: "It's a best practice to have personnel acknowledge policies at least once a year, and many frameworks require it. Tasks and tests are automated based on renewal dates to help you stay on top of your goals. Default renewal dates are 1 year from the last approval or creation date, but you can change them as needed.",
    },
    {
      header: "Policy acknowledgment creates accountability.",
      content: "Require team members to acknowledge policies after reading them. This acknowledgment creates individual accountability and provides audit evidence that policies were communicated. Track who has and hasn't acknowledged each policy.",
    },
    {
      header: "Link policies to controls for complete governance.",
      content: "Policies define \"what\" should happen, while controls define \"how\" to implement policies. Linking policies to framework controls ensures policies support compliance requirements. This connection creates a cohesive governance system.",
    },
  ],
  "ai-incident-managements": [
    {
      header: "Incident tracking helps you learn from AI failures.",
      content: "When AI systems fail, cause harm, or behave unexpectedly, document these incidents. Incident records help you identify patterns, improve systems, and demonstrate responsible practices to regulators. Every incident is a learning opportunity.",
    },
    {
      header: "Incident severity determines response requirements.",
      content: "Not all incidents require the same response. High-severity incidents need immediate action, stakeholder notification, and detailed investigation. Lower-severity incidents may just need documentation and monitoring. Use severity ratings to allocate response resources.",
    },
    {
      header: "Root cause analysis prevents recurring incidents.",
      content: "Document what caused each incident and what corrective actions you're taking. Root cause analysis helps prevent the same incident from happening again. Regulators want to see that you learn from incidents and improve over time.",
    },
    {
      header: "Incident response time affects impact.",
      content: "The faster you detect and respond to AI incidents, the less harm they cause. Track mean time to detection (MTTD) and mean time to resolution (MTTR) to measure response effectiveness. Set goals to improve these metrics over time.",
    },
  ],
  "event-tracker": [
    {
      header: "Event tracking creates a complete AI governance timeline.",
      content: "Events capture important milestones like model deployments, policy updates, audits, and training sessions. This timeline helps you understand how your governance program evolved and provides context for auditors reviewing your practices.",
    },
    {
      header: "Automated events reduce documentation burden.",
      content: "Many events are logged automatically when you complete tasks, approve policies, or update risks. This automation ensures consistent documentation without extra work. You can also manually log important events that happen outside the system.",
    },
    {
      header: "Event history supports audit responses.",
      content: "When auditors ask \"When did you implement this control?\" or \"How did you respond to that incident?\", event logs provide definitive answers. Detailed event history eliminates reliance on memory and creates objective evidence.",
    },
    {
      header: "Filter events to find relevant information quickly.",
      content: "With many events logged over time, filters help you find what you need. Filter by date range, event type, or related entity to quickly locate specific governance activities. Export filtered events for reports or documentation.",
    },
  ],
  settings: [
    {
      header: "Settings customize VerifyWise to your organization's needs.",
      content: "Configure user roles, notification preferences, and system defaults to match your governance workflows. Taking time to properly configure settings upfront saves time and reduces confusion later. Review settings periodically as your organization grows.",
    },
    {
      header: "User roles control access to sensitive information.",
      content: "Not everyone needs access to all governance data. Use roles to grant appropriate access levels—viewers for stakeholders, editors for governance team members, and admins for system owners. Role-based access protects sensitive information.",
    },
    {
      header: "Notification settings keep teams informed automatically.",
      content: "Configure notifications for task assignments, approaching deadlines, policy renewals, and high-priority risks. Automated notifications ensure nothing falls through the cracks. Adjust notification frequency to avoid overwhelming team members.",
    },
    {
      header: "Integration settings connect VerifyWise to your existing tools.",
      content: "If your organization uses other systems for task management, documentation, or communication, integration settings can connect them to VerifyWise. These connections reduce duplicate data entry and keep information synchronized across platforms.",
    },
  ],
};
