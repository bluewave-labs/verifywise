# VerifyWise AI Governance Features

## Comprehensive Feature List with Business Value

> **Note**: This document is based on codebase analysis and official documentation. Claims are verified against actual implementation.

---

## Supported Compliance Frameworks

VerifyWise provides built-in support for the following regulatory frameworks:
- **EU AI Act** - Full implementation with risk categories, controls, and assessment tracker
- **ISO 42001** - AI management system standard with clauses and annexes
- **ISO 27001** - Information security management with controls mapping

---

## 1. PROJECT RISKS

**Explanation:**
Comprehensive risk assessment framework tracking AI governance risks throughout the entire AI lifecycle. Tracks risks across 7 AI lifecycle phases: Problem definition, Data collection, Model development, Model validation, Deployment, Monitoring, and Decommissioning. Features automatic risk level calculation based on likelihood and severity matrices, mitigation tracking with evidence documentation, and approval workflows.

**Implementation Details:**
- Database model: `project_risks` table with comprehensive risk fields
- API endpoints: `/api/projectRisks` with full CRUD operations
- Soft delete capability for audit trail preservation
- Automatic risk level calculation: Likelihood × Severity matrix
- Mitigation status tracking: Not Started, In Progress, Monitoring, Completed, Requires review
- Evidence attachment for mitigation documentation
- Risk approval workflow with designated approvers

**Business Case:**
Organizations deploying AI systems face increasing regulatory requirements to demonstrate systematic risk management. The EU AI Act Article 9 requires documented risk management systems for high-risk AI systems. Without structured risk assessment, companies risk regulatory non-compliance, inability to demonstrate due diligence during audits, and potential deployment of unsafe AI systems.

**Benefit:**
- Ensures compliance with EU AI Act risk management requirements
- Provides auditable trail of risk decisions with approval workflows
- Enables systematic mitigation tracking across AI project lifecycle
- Supports executive visibility into AI risk exposure across all projects
- Facilitates regulatory audit preparation with complete documentation

---

## 2. REPORTS

**Explanation:**
Automated report generation system producing compliance documentation in DOCX format across multiple report types. Supports 10+ report categories including project risks, vendor assessments, compliance trackers, ISO clause mapping (27001 & 42001), model inventories, training registries, and policy documentation. Features markdown-to-DOCX conversion with organization branding.

**Implementation Details:**
- Supported report types: Project Risk, Vendor, Assessment Tracker, Compliance Tracker, ISO Clauses, ISO Annexes, Model Reports, Training Registry, Policy Manager, and Multi-report exports
- Database model: `reporting` table tracking generated reports
- API endpoints: `/api/reporting` for generation and retrieval
- Markdown generation with automatic DOCX conversion
- File storage integration for report downloads
- Customizable report names and organization branding

**Business Case:**
Regulatory audits (ISO 27001, EU AI Act compliance reviews) and board reporting require comprehensive documentation. Manual report compilation is time-consuming, error-prone, and diverts resources from value-adding activities. Organizations need on-demand reporting capability to respond to audit requests and demonstrate governance maturity.

**Benefit:**
- Significantly reduces report generation time (from days/weeks to minutes)
- Ensures consistency and accuracy in compliance documentation
- Enables on-demand reporting for audits and board meetings
- Supports multiple regulatory frameworks with pre-built templates
- Maintains professional formatting with organization branding

---

## 3. EVIDENCE CENTER

**Explanation:**
Centralized document repository for compliance evidence, audit trails, and governance documentation. Features organization-wide file sharing, role-based access control, comprehensive audit logging of all file operations, metadata management, and integration with project-specific files and risk documentation.

**Implementation Details:**
- Database models: `file_manager` and `file_access_log` tables
- API endpoints: `/api/file-manager` for uploads, downloads, and metadata
- Access logging for all file operations (uploads, downloads, views)
- Organization-scoped file visibility
- File size and MIME type tracking
- Integration with risk mitigation evidence and project documentation

**Business Case:**
During regulatory audits or AI system certifications, organizations must produce evidence of compliance activities (testing results, approvals, assessments, policies). Scattered evidence across email, shared drives, and personal folders creates audit risk and slows responses to regulators. Complete audit trails are increasingly required for regulatory compliance.

**Benefit:**
- Accelerates audit response by centralizing all evidence
- Provides complete audit trail of document access
- Ensures evidence preservation for regulatory retention requirements
- Enables role-based access control to protect sensitive information
- Reduces risk of evidence loss or missing documentation

---

## 4. VENDOR & RISK MODULE

**Explanation:**
Third-party AI vendor assessment and ongoing risk monitoring system. Features impact/likelihood evaluation matrices, action plan tracking, risk owner assignment, soft-delete audit capability, and multi-project vendor visibility. Supports comprehensive vendor due diligence and supply chain risk management.

**Implementation Details:**
- Database models: `vendors` and `vendor_risks` tables
- API endpoints: `/api/vendorRisks` with filtering capabilities
- Risk assessment: Impact (Negligible to Critical) × Likelihood (Rare to Almost certain)
- Action owner assignment and tracking
- Multi-project vendor risk visibility
- Soft delete with audit trail preservation

**Business Case:**
Organizations increasingly rely on third-party AI models (OpenAI, Anthropic, cloud providers) and face supply chain risks under EU AI Act Article 28. Failure to assess vendor risks can result in data breaches, service disruptions, compliance violations, and liability for vendor failures. Systematic vendor assessment is required for due diligence.

**Benefit:**
- Ensures compliance with EU AI Act supply chain requirements
- Provides systematic vendor risk assessment methodology
- Enables cross-project visibility into vendor dependencies
- Provides auditable vendor due diligence documentation
- Supports risk-based vendor management decisions

---

## 5. BIAS & FAIRNESS CHECK

**Explanation:**
ML-powered bias detection and fairness evaluation system using LLM-based analysis. Separate Python FastAPI service with support for multiple LLM providers (OpenAI, Ollama, HuggingFace). Features automated testing, fairness metric calculation, bias pattern visualization, and integration with assessment tracker.

**Implementation Details:**
- Separate Python FastAPI service at `/BiasAndFairnessModule/`
- Multiple LLM providers: OpenAI, Ollama, HuggingFace
- Inference engine with custom prompting system
- Visualization capabilities for bias metrics
- API proxy integration: `/api/bias_and_fairness`
- Database migration for evaluation tracking

**Business Case:**
AI bias creates legal liability (discrimination claims), reputational damage, and regulatory risk (EU AI Act Article 10 on data governance). Manual bias testing is inconsistent, requires specialized ML expertise, and doesn't scale across model iterations. Automated bias detection enables proactive risk mitigation before deployment.

**Benefit:**
- Reduces legal risk of discrimination claims through pre-deployment testing
- Automates technical bias testing without requiring specialized ML expertise
- Provides quantitative fairness metrics for regulatory compliance
- Enables continuous monitoring across model versions
- Protects brand reputation through proactive bias mitigation

---

## 6. AI POLICY MANAGER

**Explanation:**
Governance policy lifecycle management system with HTML content editing, version tracking, reviewer assignment, review scheduling, and status management. Supports policy creation, multi-reviewer approval workflows, and scheduled reviews. Features tag-based organization and policy status tracking (Draft, Active, Deprecated).

**Implementation Details:**
- Database model: `policy_manager` table
- API endpoints: `/api/policies` with full CRUD operations
- HTML content editing capability
- Multiple reviewer assignment (array of reviewer IDs)
- Scheduled review dates with automated tracking
- Tag-based categorization
- Status management workflow
- Author and last-updated-by tracking

**Business Case:**
Organizations need documented AI policies to demonstrate governance maturity for customers, partners, regulators, and investors. Without centralized policy management, policies become outdated, scattered across departments, inconsistently applied, and forgotten during review cycles. Evidence of documented AI principles is increasingly required for enterprise sales and regulatory compliance.

**Benefit:**
- Ensures policies remain current through automated review scheduling
- Provides single source of truth for AI governance policies
- Demonstrates governance maturity to customers and investors
- Supports multi-stakeholder review and approval workflows
- Enables policy versioning for audit trail

---

## 7. MODEL INVENTORY AND RISKS

**Explanation:**
Complete AI model registry with lifecycle tracking. Features provider/version management, security assessment tracking, bias and limitation documentation, approval workflows, and model-specific risk management. Links models to compliance frameworks (ISO 27001, ISO 42001, EU AI Act) with comprehensive metadata.

**Implementation Details:**
- Database models: `model_inventories`, `model_risks`, and `model_inventories_projects_frameworks` tables
- API endpoints: `/api/modelInventory` and `/api/modelRisks`
- Model fields: Provider, model name, version, capabilities, security assessment, status, biases, limitations, hosting provider
- Model status: Pending, Approved, Deprecated, Under Review
- Risk categorization: Performance, Data Quality, Ethical, Security, Compliance, Operational
- Risk status: Open, In Progress, Resolved, Closed, Under Review
- Framework linkage for compliance mapping
- Soft delete with audit trail

**Business Case:**
Organizations lose track of AI models in production (shadow AI), lack visibility into model risks and dependencies, and cannot demonstrate which models require high-risk AI controls under EU AI Act. Model inventory gaps create security vulnerabilities, compliance violations, and inability to respond to model-related incidents. Complete model visibility is required for AI governance.

**Benefit:**
- Provides complete visibility into all AI models across the organization
- Enables EU AI Act compliance through systematic model classification
- Reduces shadow AI risk by creating centralized model registry
- Supports model risk management with integrated risk tracking
- Facilitates incident response with comprehensive model documentation

---

## 8. TASKS

**Explanation:**
AI governance task management system with priority levels (Low, Medium, High), status tracking (Open, In Progress, Completed, Overdue), multiple assignee support, due date management, tag-based organization, and comprehensive task descriptions. Integrates with governance workflows.

**Implementation Details:**
- Database models: `tasks` and `task_assignees` tables
- API endpoints: `/api/tasks` with full CRUD operations
- Priority levels: Low, Medium, High
- Status tracking: Open, In Progress, Completed, Overdue, Deleted
- Multiple assignees (JSONB array)
- Tag-based categorization (JSONB array)
- Due date tracking with overdue detection
- Organization-scoped tasks

**Business Case:**
AI governance requires coordinating activities across multiple teams (data science, legal, compliance, security) with clear accountability and deadlines. Without systematic task tracking, governance activities fall through the cracks, compliance deadlines are missed, and responsibility for critical controls is unclear. Task management ensures governance execution.

**Benefit:**
- Ensures accountability for governance activities with clear assignees
- Prevents missed compliance deadlines through overdue tracking
- Enables cross-functional coordination across AI governance teams
- Provides visibility into governance workload and bottlenecks
- Supports audit evidence of systematic governance execution

---

## 9. AI TRUST CENTER

**Explanation:**
Public-facing trust portal with customizable content sections. Features company description, compliance badges, subprocessor transparency, resource links, and terms/contracts sections. Includes custom branding (logo, header colors), section visibility toggles, URL hashing for public access, and authentication-free public pages.

**Implementation Details:**
- Database models: Multiple `ai_trust_center_*` tables for different sections
- API endpoints: `/api/aiTrustCentre` with public and authenticated routes
- Customizable sections: Intro, Company Description, Compliance Badges, Resources, Subprocessors, Terms & Contracts
- Custom branding: Logo upload, header color customization
- Section visibility toggles for granular control
- Public access via hash-based URLs (no authentication required)
- Logo and resource file management

**Business Case:**
Enterprise customers and partners require transparency into AI vendors' governance practices before signing contracts or sharing data. Sales teams face delays when prospects cannot verify security and compliance claims. Public transparency is increasingly expected by regulators and consumers. Building custom trust portals requires engineering resources and ongoing maintenance.

**Benefit:**
- Accelerates enterprise sales cycles by providing self-service due diligence
- Reduces security questionnaire burden by publishing compliance information
- Builds customer trust through transparency in AI governance practices
- Differentiates from competitors lacking governance transparency
- Reduces support burden by enabling self-service compliance information access

---

## 10. AUDIT LOGS

**Explanation:**
Comprehensive activity tracking system capturing all user actions, system events, API calls, and automation executions. Features structured logging with categories and levels, timestamp tracking, event type categorization (CRUD operations), error tracking, and both database and file-based logging. Includes automation execution logs with detailed action results and performance metrics.

**Implementation Details:**
- Database models: `event_logs` and `automation_execution_logs` tables
- API endpoints: `/api/logger` for events and logs retrieval
- Logging utilities: File logger, database logger, log helper functions
- Event categorization: Create, Read, Update, Delete operations
- Execution tracking: Trigger data, action results, status, execution time
- Error message capture for failed operations
- Function and file name tracking for troubleshooting

**Business Case:**
Regulatory frameworks require audit logs for compliance. During security incidents or compliance audits, organizations must produce evidence of who did what and when. Without comprehensive logging, organizations cannot investigate incidents, demonstrate compliance, detect insider threats, or satisfy regulatory audit trail requirements.

**Benefit:**
- Enables compliance with regulatory audit trail requirements
- Supports security incident investigation and forensics
- Provides accountability for all system activities and changes
- Facilitates troubleshooting of system issues and automation failures
- Creates defensible audit trail for regulatory examinations

---

## 11. AI TRAINING REGISTER

**Explanation:**
Training program tracking system documenting AI governance training initiatives. Features participant count tracking, training provider management, department ownership, status management (Planned, In Progress, Completed), duration tracking, and comprehensive training descriptions.

**Implementation Details:**
- Database model: `trainingregistar` table (legacy naming)
- API endpoints: `/api/training` with full CRUD operations
- Training fields: Name, duration, provider, department, description
- Status tracking: Planned, In Progress, Completed
- Participant count tracking
- Validation for all fields

**Business Case:**
Effective AI governance requires trained staff who understand policies, risks, and controls. Regulations increasingly require documented AI training (EU AI Act Article 4 on staff competence). Organizations cannot demonstrate governance program effectiveness without evidence of staff training. Documentation of training programs supports compliance and continuous improvement.

**Benefit:**
- Demonstrates compliance with staff competence requirements
- Enables tracking of training completion rates and coverage gaps
- Provides audit evidence of governance program investment
- Supports continuous improvement of AI governance capabilities
- Ensures consistent governance knowledge across the organization

---

## 12. AI INCIDENT MANAGEMENT

**Explanation:**
Comprehensive incident tracking system for AI-related issues. Features incident type categorization (Data Breach, Model Failure, Bias Detected, Security Incident), severity assessment (5 levels: Critical, High, Medium, Low, Info), approval workflows, root cause analysis tracking, affected parties documentation, categories of harm tracking (bias, privacy, security), immediate mitigation recording, planned corrective action tracking, and archival capability.

**Implementation Details:**
- Database model: `ai_incident_managements` table
- API endpoints: `/api/ai-incident-managements` with full CRUD plus approve/archive
- Incident types: Data Breach, Model Failure, Bias Detected, Security Incident, Privacy Violation, Compliance Issue, Safety Incident
- Severity levels: Critical, High, Medium, Low, Info
- Status tracking: Open, In Review, Resolved, Closed, On Hold
- Approval workflow: Approval status, approver, date, notes
- Comprehensive fields: Occurred date, detected date, reporter, harm categories, affected persons, root cause, mitigations
- Model/system version tracking
- Interim report flag
- Archive capability for closed incidents

**Business Case:**
AI systems fail in unique ways (model drift, bias incidents, data poisoning) requiring specialized incident management. EU AI Act Article 62 requires mandatory incident reporting for high-risk AI systems. Without systematic incident tracking, organizations repeat mistakes, lack trend visibility, cannot demonstrate corrective actions to regulators, and risk penalties for unreported serious incidents.

**Benefit:**
- Ensures compliance with mandatory AI incident reporting requirements
- Prevents repeat incidents through documented root cause analysis
- Provides trend analysis to identify systemic AI governance weaknesses
- Supports continuous improvement through corrective action tracking
- Creates defensible incident response documentation for regulators

---

## 13. AUTOMATIONS

**Explanation:**
Workflow automation engine enabling event-based triggers and multi-action workflows. Features execution logging, detailed result tracking per action, error handling, status tracking (success/partial/failure), execution timing metrics, active/inactive toggle, and comprehensive execution history and statistics.

**Implementation Details:**
- Database models: `automations`, `automation_triggers`, `automation_actions`, `tenant_automation_actions`, `automation_execution_logs` tables
- API endpoints: `/api/automations` with trigger/action discovery and execution history
- Event-based trigger system
- Multiple actions per automation
- Transactional automation creation
- Execution logging with: trigger data, action results array, status, error messages, execution time
- Statistics and history tracking
- Active/inactive toggle
- Creator tracking and tenant isolation

**Business Case:**
Manual AI governance processes don't scale as organizations deploy more AI systems. Governance teams become bottlenecks, routine tasks consume resources, and manual processes introduce errors and delays. Without automation, governance overhead increases linearly with AI system count, making governance economically challenging at scale.

**Benefit:**
- Reduces governance overhead by automating routine compliance tasks
- Scales governance programs without proportional headcount increases
- Ensures consistent application of governance controls through automation
- Frees governance teams to focus on high-value risk activities
- Provides execution metrics to optimize governance processes

---

## 14. VENDOR TRANSPARENCY (Subprocessors)

**Explanation:**
Public disclosure of third-party AI subprocessors integrated into AI Trust Center. Provides detailed information about data processors, service providers, and vendor relationships. Customer-facing transparency for supply chain visibility.

**Implementation Details:**
- Database model: `ai_trust_center_subprocessors` table
- API endpoints: `/api/aiTrustCentre/subprocessors` with public access
- Integration with AI Trust Center for public display
- Detailed subprocessor information management
- Public visibility for customer due diligence

**Business Case:**
GDPR Article 28 and other data protection regulations require disclosure of subprocessors who handle personal data. Enterprise customers require transparency into vendor supply chains before signing contracts. Lack of subprocessor transparency blocks enterprise sales and creates contractual compliance issues.

**Benefit:**
- Ensures GDPR compliance with subprocessor disclosure requirements
- Accelerates enterprise contract negotiations through transparency
- Reduces legal review burden with pre-published subprocessor information
- Builds customer trust through supply chain transparency
- Differentiates from competitors lacking vendor transparency

---

## Technical Architecture Summary

**Frontend:**
- React.js with TypeScript
- Material-UI components
- Repository pattern for API integration

**Backend:**
- Node.js with Express
- Sequelize ORM with PostgreSQL
- RESTful API architecture
- JWT authentication
- Role-based access control (RBAC)

**Database:**
- PostgreSQL with 60+ tables
- Comprehensive foreign key relationships
- Soft delete pattern for audit compliance
- JSONB columns for flexible data storage

**Specialized Services:**
- Python FastAPI service for Bias & Fairness Module
- Markdown-to-DOCX conversion for reporting
- File storage integration
- Email service abstraction layer

**Security & Compliance:**
- JWT-based authentication with refresh tokens
- Role-based authorization
- Soft deletes for audit trail preservation
- Tenant-based data isolation
- Input validation on all endpoints
- File access logging

---

## Integration Capabilities

**Current Integrations:**
- **Slack**: Notifications and workflow integration
- **MLflow**: Model tracking and registry
- **Google OAuth2**: Authentication
- **Email Services**: SMTP providers with TLS enforcement

**Integration with External Tools:**
- MIT AI Risk Repository (referenced for risk categorization)
- Multiple LLM providers (OpenAI, Ollama, HuggingFace) for bias evaluation

---

## Deployment Options

- **On-premises deployment**: Full control over data and infrastructure
- **Private cloud deployment**: Flexibility with security
- **Docker support**: Containerized deployment
- **Source available license (BSL 1.1)**: Transparency and customization
- **Dual licensing available**: For enterprise needs

---

## Summary

VerifyWise provides comprehensive AI governance capabilities across 14 major feature areas, with strong emphasis on regulatory compliance (EU AI Act, ISO 42001, ISO 27001), systematic risk management, and operational efficiency. The platform combines automated workflows, comprehensive documentation, and audit trail preservation to enable scalable AI governance programs.

**Key Differentiators:**
- Built-in support for major AI regulations and standards
- Automated bias and fairness evaluation with ML
- Public-facing AI Trust Center for transparency
- Comprehensive automation engine for workflow efficiency
- Complete audit trail and evidence management
- Source-available architecture for security and customization

**Target Use Cases:**
- Organizations deploying high-risk AI systems under EU AI Act
- Companies requiring ISO 42001 or ISO 27001 compliance
- Enterprises needing systematic AI vendor risk management
- Organizations requiring public AI governance transparency
- Teams seeking to automate AI governance workflows
