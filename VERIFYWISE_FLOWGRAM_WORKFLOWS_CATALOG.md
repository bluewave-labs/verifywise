# VerifyWise + FlowGram Workflow Catalog

## Overview

This document catalogs **39 verified workflow automation opportunities** for VerifyWise integration with FlowGram.ai. All workflows have been validated against existing API endpoints and backend functionality.

---

## 1. Risk Management Workflows (8 workflows)

### **1.1 Risk Creation & Owner Notification Workflow**

**FlowGram Flow:**
```
[POST /api/risks] → [Parse Risk Data] → [Extract Owner ID] → [Send Email] → [Send Slack] → [Create Task]
```

**API Endpoints:**
- ✅ `POST /api/risks` - Risk creation trigger
- ✅ `GET /api/risks/:id` - Risk data retrieval
- ✅ `POST /api/tasks` - Auto-create mitigation tasks
- ✅ `POST /api/slack-webhook/:id/send` - Slack notifications

**Workflow Logic:**
1. **Trigger**: Risk created via API call
2. **Data Extraction**:
   - `risk_owner` field for notification recipient
   - `risk_level_autocalculated` for priority determination
   - `risk_name` and `risk_description` for notification content
3. **Conditional Logic**:
   - **High/Very High Risk**: Immediate Slack + Email
   - **Medium Risk**: Email notification + delayed Slack
   - **Low Risk**: Email only
4. **Actions**:
   - Send email to risk owner using existing email service
   - Post Slack message to relevant channel
   - Auto-create mitigation task with `creator_id` = risk_owner

### **1.2 Risk Status Change Workflow**

**FlowGram Flow:**
```
[PUT /api/risks/:id] → [Compare Old/New Status] → [Determine Recipients] → [Multi-Channel Notification]
```

**API Endpoints:**
- ✅ `PUT /api/risks/:id` - Risk update trigger
- ✅ `GET /api/risks/by-projid/:id` - Project risk monitoring

**Workflow Logic:**
1. **Trigger**: Risk update via PUT request
2. **Data Processing**:
   - Compare previous vs current `mitigation_status`
   - Extract `approval_status` changes
   - Identify `current_risk_level` modifications
3. **Stakeholder Identification**:
   - Risk owner: Always notified
   - Project team: For status changes affecting project timeline
   - Management: For risk level increases
4. **Notification Logic**:
   - Status "Completed": Celebrate via Slack + notify project manager
   - Status "Requires review": Urgent notification to `risk_approval` person
   - Risk level increase: Escalate to management chain

### **1.3 Risk Deadline Monitoring Workflow**

**FlowGram Flow:**
```
[Daily Schedule] → [GET /api/risks] → [Filter by Deadline] → [Calculate Days Remaining] → [Send Notifications]
```

**API Endpoints:**
- ✅ `GET /api/risks` - All risks retrieval
- ✅ Email service - Existing emailService.ts
- ✅ Slack integration - slackWebhook.route.ts

**Workflow Logic:**
1. **Trigger**: Daily cron job (e.g., 9 AM daily)
2. **Data Collection**:
   - Fetch all active risks via `GET /api/risks`
   - Filter risks with `deadline` field populated
   - Calculate days until deadline
3. **Escalation Matrix**:
   - **30 days**: Initial planning reminder
   - **14 days**: Progress check email
   - **7 days**: Urgent email + Slack to risk owner
   - **3 days**: Manager notification + team Slack channel
   - **1 day**: Executive alert via email/Slack
   - **Overdue**: Automatic escalation workflow

### **1.4 Risk Level Change Escalation Workflow**

**FlowGram Flow:**
```
[Risk Level Increase] → [Severity Assessment] → [Management Notification] → [Approval Request]
```

**API Endpoints:**
- ✅ `PUT /api/risks/:id` - Risk level updates
- ✅ `GET /api/risks/by-frameworkid/:id` - Framework-specific risks

**Workflow Logic:**
1. **Level Change Detection**: Monitor `risk_level_autocalculated` field changes
2. **Escalation Rules**:
   - Low → Medium: Team lead notification
   - Medium → High: Department head + project manager notification
   - High → Very High: Executive notification + emergency response
3. **Approval Requirements**: High-risk items require management sign-off

### **1.5 Risk Mitigation Task Creation Workflow**

**FlowGram Flow:**
```
[New High Risk] → [Generate Mitigation Plan] → [Create Tasks] → [Assign Owners] → [Set Deadlines]
```

**API Endpoints:**
- ✅ `POST /api/risks` - New risk trigger
- ✅ `POST /api/tasks` - Mitigation task creation

**Workflow Logic:**
1. **High-Risk Detection**: Filter risks with high severity levels
2. **Task Generation**: Auto-create mitigation tasks based on risk category
3. **Assignment Logic**: Assign to risk owner or specialized teams
4. **Timeline Setting**: Set aggressive deadlines for high-risk mitigation

### **1.6 Risk Review Reminder Workflow**

**FlowGram Flow:**
```
[Periodic Schedule] → [Review Due Calculation] → [Owner Notification] → [Manager Escalation]
```

**API Endpoints:**
- ✅ `GET /api/risks` - Risk review status monitoring

**Workflow Logic:**
1. **Review Schedule**: Monthly/quarterly review reminders
2. **Due Date Calculation**: Based on last review date and risk level
3. **Reminder Sequence**: Owner → Manager → Executive escalation

### **1.7 Risk Assessment Progress Tracking Workflow**

**FlowGram Flow:**
```
[Assessment Updates] → [Progress Calculation] → [Milestone Notifications] → [Completion Actions]
```

**API Endpoints:**
- ✅ `GET /api/risks/by-projid/:id` - Project risk tracking

**Workflow Logic:**
1. **Progress Monitoring**: Track risk assessment completion across projects
2. **Milestone Alerts**: Notify stakeholders of assessment progress
3. **Completion Actions**: Trigger next phase activities upon assessment completion

### **1.8 Cross-Project Risk Correlation Workflow**

**FlowGram Flow:**
```
[Risk Creation] → [Similar Risk Detection] → [Correlation Analysis] → [Stakeholder Notification]
```

**API Endpoints:**
- ✅ `GET /api/risks` - All risks for correlation analysis

**Workflow Logic:**
1. **Pattern Matching**: Identify similar risks across projects
2. **Correlation Analysis**: Detect related risks and common causes
3. **Knowledge Sharing**: Notify teams working on similar risks
4. **Best Practice Distribution**: Share successful mitigation strategies

---

## 2. Vendor Management Workflows (6 workflows)

### **2.1 New Vendor Registration Workflow**

**FlowGram Flow:**
```
[POST /api/vendors] → [Extract Vendor Data] → [Assign Reviewer] → [Create Review Tasks] → [Send Notifications]
```

**API Endpoints:**
- ✅ `POST /api/vendors` - New vendor creation
- ✅ `GET /api/vendors/:id` - Vendor data retrieval
- ✅ `PATCH /api/vendors/:id` - Vendor updates

**Workflow Logic:**
1. **Trigger**: New vendor created
2. **Data Extraction**:
   - `vendor_name` and `vendor_provides` for categorization
   - `assignee` field for initial assignment
   - `website` for due diligence research
3. **Auto-Assignment Logic**:
   - Technology vendors → IT security team
   - Financial vendors → Finance team
   - Critical vendors → Senior management review
4. **Task Creation**:
   - Due diligence checklist task
   - Contract review task
   - Security assessment task
5. **Timeline Setup**:
   - Set `review_status` to "Not started"
   - Create 30-day review deadline
   - Schedule periodic review reminders

### **2.2 Vendor Review Status Workflow**

**FlowGram Flow:**
```
[PATCH /api/vendors/:id] → [Status Change Detection] → [Workflow Routing] → [Next Step Actions]
```

**API Endpoints:**
- ✅ `PATCH /api/vendors/:id` - Vendor status updates
- ✅ `GET /api/vendors/project-id/:id` - Project vendor tracking

**Workflow Logic:**
1. **Status Transitions**:
   - **"Not started" → "In review"**:
     - Notify assigned reviewer
     - Send vendor questionnaire
     - Create documentation task
   - **"In review" → "Reviewed"**:
     - Notify project stakeholders
     - Update project compliance status
     - Archive review documents
   - **"Reviewed" → "Requires follow-up"**:
     - Create follow-up task
     - Set follow-up deadline
     - Notify vendor contact person

### **2.3 Vendor Due Diligence Workflow**

**FlowGram Flow:**
```
[Vendor Assignment] → [Due Diligence Checklist] → [Evidence Collection] → [Review Process]
```

**API Endpoints:**
- ✅ `GET /api/vendors/:id` - Vendor information retrieval
- ✅ `PATCH /api/vendors/:id` - Due diligence updates

**Workflow Logic:**
1. **Checklist Generation**: Create vendor-specific due diligence tasks
2. **Evidence Collection**: Track document collection and validation
3. **Review Process**: Route completed due diligence for approval
4. **Documentation**: Maintain audit trail of review process

### **2.4 Vendor Review Scheduling Workflow**

**FlowGram Flow:**
```
[Vendor Creation] → [Calculate Review Date] → [Schedule Reminder] → [Assign Reviewer]
```

**API Endpoints:**
- ✅ `GET /api/vendors` - Vendor review monitoring

**Workflow Logic:**
1. **Review Frequency**: Determine review schedule based on vendor risk level
2. **Calendar Integration**: Schedule review dates and reminders
3. **Reviewer Assignment**: Auto-assign reviewers based on vendor category
4. **Preparation Tasks**: Create review preparation tasks and materials

### **2.5 Vendor Performance Monitoring Workflow**

**FlowGram Flow:**
```
[Performance Data] → [Metric Evaluation] → [Threshold Analysis] → [Action Triggers]
```

**API Endpoints:**
- ✅ `GET /api/vendors/project-id/:id` - Project vendor performance

**Workflow Logic:**
1. **Performance Tracking**: Monitor vendor deliverables and SLA compliance
2. **Threshold Monitoring**: Alert on performance degradation
3. **Escalation Actions**: Trigger reviews or contract modifications
4. **Relationship Management**: Notify account managers of performance issues

### **2.6 Vendor Contract Renewal Workflow**

**FlowGram Flow:**
```
[Contract Expiry Monitoring] → [Renewal Decision] → [Stakeholder Notification] → [Process Initiation]
```

**API Endpoints:**
- ✅ `GET /api/vendors` - Contract monitoring

**Workflow Logic:**
1. **Expiry Monitoring**: Track contract end dates and renewal windows
2. **Decision Support**: Provide vendor performance data for renewal decisions
3. **Process Automation**: Initiate renewal or termination processes
4. **Stakeholder Communication**: Keep relevant parties informed of contract status

---

## 3. Control Management Workflows (7 workflows)

### **3.1 Control Implementation Assignment Workflow**

**FlowGram Flow:**
```
[POST /api/controls] → [Parse Control Data] → [Assign Owner] → [Create Implementation Plan] → [Set Monitoring]
```

**API Endpoints:**
- ✅ `POST /api/controls` - Control creation
- ✅ `PUT /api/controls/:id` - Control updates
- ✅ `GET /api/controls/all/bycategory/:id` - Category-based controls

**Workflow Logic:**
1. **Control Creation Trigger**:
   - Extract `control_category_id` for specialized assignment
   - Parse `title` and `description` for complexity assessment
   - Set initial `status` to "Waiting"
2. **Owner Assignment Logic**:
   - Technical controls → IT team members
   - Policy controls → Compliance team
   - Physical controls → Security team
3. **Implementation Planning**:
   - Create implementation task via `POST /api/tasks`
   - Set `due_date` based on control complexity
   - Assign `reviewer` for approval process
4. **Notification Chain**:
   - Email owner with control details
   - Slack notification to relevant team
   - Add to project dashboard

### **3.2 Control Status Progress Workflow**

**FlowGram Flow:**
```
[PUT /api/controls/:id] → [Status Evaluation] → [Progress Tracking] → [Next Phase Trigger]
```

**API Endpoints:**
- ✅ `PUT /api/controls/:id` - Control status updates
- ✅ `PATCH /api/controls/saveControls/:id` - Control evidence upload

**Workflow Logic:**
1. **Status Monitoring**:
   - **"Waiting" → "In progress"**:
     - Start implementation timeline
     - Notify project manager of progress
     - Set interim milestone reminders
   - **"In progress" → "Done"**:
     - Trigger review assignment
     - Request evidence upload
     - Notify compliance team
2. **Evidence Handling**:
   - Use file upload capability from saveControls endpoint
   - Validate evidence completeness
   - Route for approval review
3. **Review Process**:
   - Assign to designated `reviewer`
   - Set review deadline (5 business days)
   - Send review checklist

### **3.3 Control Approval Workflow**

**FlowGram Flow:**
```
[Control Review Complete] → [Reviewer Decision] → [Approval/Rejection Actions] → [Status Updates]
```

**API Endpoints:**
- ✅ `PUT /api/controls/:id` - Control approval updates
- ✅ Control file management via saveControls endpoint

**Workflow Logic:**
1. **Review Decision Points**:
   - Evidence adequate → Approve control
   - Evidence inadequate → Request additional documentation
   - Implementation insufficient → Return to owner
2. **Approval Actions**:
   - Update `status` to final approved state
   - Update `risk_review` to "Acceptable risk"
   - Notify stakeholders of completion
   - Update project compliance metrics
3. **Rejection Actions**:
   - Create remediation task
   - Set new implementation deadline
   - Notify owner and project manager

### **3.4 Control Compliance Monitoring Workflow**

**FlowGram Flow:**
```
[Control Implementation] → [Compliance Check] → [Gap Detection] → [Remediation Actions]
```

**API Endpoints:**
- ✅ `POST /api/controls/compliance/:id` - Compliance verification
- ✅ `GET /api/controls` - Control monitoring

**Workflow Logic:**
1. **Compliance Verification**: Regular checks against control requirements
2. **Gap Detection**: Identify controls not meeting compliance standards
3. **Remediation Planning**: Create tasks to address compliance gaps
4. **Continuous Monitoring**: Ongoing compliance status tracking

### **3.5 Control Evidence Collection Workflow**

**FlowGram Flow:**
```
[Evidence Request] → [Collection Tracking] → [Validation Process] → [Archive Management]
```

**API Endpoints:**
- ✅ `PATCH /api/controls/saveControls/:id` - Evidence upload with file support

**Workflow Logic:**
1. **Evidence Requirements**: Define required evidence for each control
2. **Collection Tracking**: Monitor evidence submission progress
3. **Validation Process**: Verify evidence completeness and quality
4. **Archive Management**: Organize and store evidence for audit purposes

### **3.6 Control Review Cycle Workflow**

**FlowGram Flow:**
```
[Review Schedule] → [Control Assessment] → [Updates Required] → [Next Review Planning]
```

**API Endpoints:**
- ✅ `GET /api/controls` - Control review monitoring

**Workflow Logic:**
1. **Review Scheduling**: Periodic review cycles based on control criticality
2. **Assessment Process**: Evaluate control effectiveness and implementation
3. **Update Management**: Handle required control modifications
4. **Cycle Planning**: Schedule next review period and prepare materials

### **3.7 Control Category Management Workflow**

**FlowGram Flow:**
```
[Category Assignment] → [Template Application] → [Workflow Customization] → [Team Notification]
```

**API Endpoints:**
- ✅ `GET /api/controls/all/bycategory/:id` - Category-specific control management

**Workflow Logic:**
1. **Category-Based Processing**: Apply category-specific workflows and templates
2. **Team Routing**: Route controls to appropriate teams based on category
3. **Template Application**: Use predefined templates for common control types
4. **Workflow Customization**: Adapt workflows based on control category requirements

---

## 4. Task Management Workflows (6 workflows)

### **4.1 Task Creation & Assignment Workflow**

**FlowGram Flow:**
```
[POST /api/tasks] → [Parse Task Data] → [Assignment Logic] → [Priority Handling] → [Notification Delivery]
```

**API Endpoints:**
- ✅ `POST /api/tasks` - Task creation
- ✅ `PUT /api/tasks/:id` - Task updates
- ✅ `GET /api/tasks` - Task monitoring

**Workflow Logic:**
1. **Task Data Processing**:
   - Extract `title`, `description`, `priority`
   - Validate `creator_id` and `organization_id`
   - Set default `status` to "Open"
2. **Assignment Logic**:
   - Use `assignee_ids` field for direct assignment
   - Priority-based notification urgency
   - Workload balancing considerations
3. **Priority-Based Actions**:
   - **High Priority**: Immediate Slack + Email
   - **Medium Priority**: Email notification within 1 hour
   - **Low Priority**: Daily digest inclusion
4. **Calendar Integration**:
   - Create calendar events for tasks with `due_date`
   - Send calendar invites to assignees
   - Set automated reminders

### **4.2 Task Status Change Workflow**

**FlowGram Flow:**
```
[PUT /api/tasks/:id] → [Status Comparison] → [Stakeholder Notification] → [Project Updates]
```

**API Endpoints:**
- ✅ `PUT /api/tasks/:id` - Task status updates
- ✅ TaskStatus enum support for status tracking

**Workflow Logic:**
1. **Status Transition Handling**:
   - **Open → In Progress**: Notify stakeholders of start
   - **In Progress → Completed**: Trigger completion workflow
   - **Any → Overdue**: Escalation to manager
2. **Progress Tracking**:
   - Update project completion percentages
   - Notify dependent task owners
   - Adjust project timeline if needed
3. **Completion Actions**:
   - Quality review assignment (if required)
   - Archive task documentation
   - Update project metrics

### **4.3 Task Deadline Monitoring Workflow**

**FlowGram Flow:**
```
[Daily Schedule] → [GET /api/tasks] → [Deadline Analysis] → [Escalation Matrix] → [Automated Actions]
```

**API Endpoints:**
- ✅ `GET /api/tasks` - Task deadline monitoring
- ✅ TaskPriority enum for priority-based escalation

**Workflow Logic:**
1. **Daily Scan Process**:
   - Fetch all active tasks
   - Filter by `due_date` proximity
   - Group by `priority` level
2. **Escalation Timing**:
   - **High Priority Tasks**: 3, 2, 1 day warnings
   - **Medium Priority Tasks**: 5, 2 day warnings
   - **Low Priority Tasks**: 1 day warning only
3. **Automated Actions**:
   - Send reminder emails to assignees
   - Notify managers of overdue high-priority tasks
   - Create follow-up tasks for missed deadlines

### **4.4 Task Dependency Management Workflow**

**FlowGram Flow:**
```
[Task Completion] → [Dependency Check] → [Downstream Task Updates] → [Timeline Adjustment]
```

**API Endpoints:**
- ✅ `PUT /api/tasks/:id` - Task completion updates
- ✅ `GET /api/tasks` - Dependency tracking

**Workflow Logic:**
1. **Dependency Tracking**: Monitor task interdependencies
2. **Completion Triggers**: Automatically start dependent tasks
3. **Timeline Management**: Adjust schedules based on dependency completion
4. **Resource Coordination**: Manage shared resources across dependent tasks

### **4.5 Task Escalation Workflow**

**FlowGram Flow:**
```
[Overdue Detection] → [Escalation Rules] → [Manager Notification] → [Resource Reallocation]
```

**API Endpoints:**
- ✅ `GET /api/tasks` - Overdue task detection
- ✅ `PUT /api/tasks/:id` - Task priority updates

**Workflow Logic:**
1. **Overdue Detection**: Identify tasks past due date
2. **Escalation Matrix**: Progressive escalation based on task priority and overdue duration
3. **Manager Involvement**: Notify managers of chronic overdue tasks
4. **Resource Support**: Offer additional resources for critical overdue tasks

### **4.6 Task Quality Assurance Workflow**

**FlowGram Flow:**
```
[Task Completion] → [Quality Check] → [Approval Process] → [Final Completion]
```

**API Endpoints:**
- ✅ `PUT /api/tasks/:id` - Task completion and approval

**Workflow Logic:**
1. **Quality Gates**: Define quality requirements for task completion
2. **Review Process**: Route completed tasks for quality review
3. **Approval Workflow**: Require approval for critical tasks
4. **Rework Management**: Handle tasks that don't meet quality standards

---

## 5. Model Inventory Workflows (4 workflows)

### **5.1 Model Registration Workflow**

**FlowGram Flow:**
```
[POST /api/model-inventory] → [Model Classification] → [Governance Assignment] → [Monitoring Setup]
```

**API Endpoints:**
- ✅ `POST /api/model-inventory` - Model registration
- ✅ `PATCH /api/model-inventory/:id` - Model updates
- ✅ `GET /api/model-inventory` - Model monitoring

**Workflow Logic:**
1. **Model Registration**:
   - Extract model metadata and classification
   - Assign governance team based on model type
   - Set up monitoring requirements
2. **Risk Assessment**:
   - Create model risk assessment task
   - Assign compliance review
   - Set periodic review schedule
3. **Documentation Requirements**:
   - Create documentation tasks
   - Set evidence collection requirements
   - Establish audit trail

### **5.2 Model Update & Change Management Workflow**

**FlowGram Flow:**
```
[PATCH /api/model-inventory/:id] → [Change Detection] → [Impact Assessment] → [Approval Process]
```

**API Endpoints:**
- ✅ `PATCH /api/model-inventory/:id` - Model updates
- ✅ Model risk integration via modelRisk.route.ts

**Workflow Logic:**
1. **Change Detection**:
   - Monitor model version updates
   - Track performance metric changes
   - Detect deployment environment changes
2. **Impact Assessment**:
   - Assess risk level changes
   - Evaluate compliance implications
   - Determine approval requirements
3. **Change Management**:
   - Route for appropriate approvals
   - Update risk assessments
   - Notify stakeholders

### **5.3 Model Lifecycle Management Workflow**

**FlowGram Flow:**
```
[Model Phase Change] → [Lifecycle Validation] → [Stakeholder Notification] → [Documentation Update]
```

**API Endpoints:**
- ✅ `GET /api/model-inventory/:id` - Model lifecycle tracking
- ✅ `PATCH /api/model-inventory/:id` - Lifecycle updates

**Workflow Logic:**
1. **Lifecycle Tracking**: Monitor model progression through development phases
2. **Phase Validation**: Ensure requirements are met before phase transitions
3. **Stakeholder Communication**: Keep relevant parties informed of lifecycle changes
4. **Documentation Management**: Maintain up-to-date model documentation

### **5.4 Model Governance Review Workflow**

**FlowGram Flow:**
```
[Review Schedule] → [Governance Assessment] → [Compliance Check] → [Action Items]
```

**API Endpoints:**
- ✅ `GET /api/model-inventory` - Model governance monitoring

**Workflow Logic:**
1. **Review Scheduling**: Periodic governance reviews based on model risk level
2. **Assessment Process**: Evaluate model compliance and governance
3. **Issue Identification**: Detect governance gaps and compliance issues
4. **Action Planning**: Create tasks to address identified issues

---

## 6. Project Coordination Workflows (5 workflows)

### **6.1 Project Status Orchestration Workflow**

**FlowGram Flow:**
```
[PATCH /api/projects/:id/status] → [Status Change Processing] → [Cross-Entity Updates] → [Stakeholder Communication]
```

**API Endpoints:**
- ✅ `PATCH /api/projects/:id/status` - Project status updates
- ✅ `GET /api/projects/stats/:id` - Project statistics
- ✅ Project progress tracking endpoints

**Workflow Logic:**
1. **Status Change Processing**:
   - Update all related risks, controls, and tasks
   - Recalculate project completion metrics
   - Adjust timelines and deadlines
2. **Cross-Entity Synchronization**:
   - Update risk statuses for project closure
   - Archive completed controls
   - Generate final compliance reports
3. **Communication Cascade**:
   - Notify all project stakeholders
   - Update executive dashboards
   - Archive project documentation

### **6.2 Project Risk Calculation Workflow**

**FlowGram Flow:**
```
[GET /api/projects/calculateProjectRisks/:id] → [Risk Aggregation] → [Threshold Analysis] → [Alert Generation]
```

**API Endpoints:**
- ✅ `GET /api/projects/calculateProjectRisks/:id` - Project risk calculations
- ✅ `GET /api/projects/calculateVendorRisks/:id` - Vendor risk calculations

**Workflow Logic:**
1. **Risk Aggregation**:
   - Collect all project risks
   - Calculate overall project risk score
   - Identify risk concentration areas
2. **Threshold Monitoring**:
   - Compare against risk appetite
   - Identify escalation triggers
   - Generate risk heat maps
3. **Automated Responses**:
   - High risk projects: Executive alerts
   - Medium risk: Enhanced monitoring
   - Risk trending up: Preventive actions

### **6.3 Project Compliance Progress Workflow**

**FlowGram Flow:**
```
[GET /api/projects/compliance/progress/:id] → [Progress Analysis] → [Gap Identification] → [Action Planning]
```

**API Endpoints:**
- ✅ `GET /api/projects/compliance/progress/:id` - Project compliance tracking
- ✅ `GET /api/projects/all/compliance/progress` - Organization-wide compliance

**Workflow Logic:**
1. **Progress Monitoring**: Track compliance implementation across projects
2. **Gap Analysis**: Identify areas falling behind compliance requirements
3. **Resource Allocation**: Assign additional resources to lagging areas
4. **Stakeholder Reporting**: Provide compliance status updates to leadership

### **6.4 Project Assessment Progress Workflow**

**FlowGram Flow:**
```
[GET /api/projects/assessment/progress/:id] → [Assessment Tracking] → [Completion Analysis] → [Next Steps]
```

**API Endpoints:**
- ✅ `GET /api/projects/assessment/progress/:id` - Project assessment tracking
- ✅ `GET /api/projects/all/assessment/progress` - Organization-wide assessments

**Workflow Logic:**
1. **Assessment Monitoring**: Track assessment completion across projects
2. **Progress Analysis**: Identify bottlenecks in assessment processes
3. **Resource Support**: Provide assistance for delayed assessments
4. **Completion Actions**: Trigger post-assessment activities

### **6.5 Project Statistics Monitoring Workflow**

**FlowGram Flow:**
```
[GET /api/projects/stats/:id] → [Metric Analysis] → [Trend Detection] → [Stakeholder Reports]
```

**API Endpoints:**
- ✅ `GET /api/projects/stats/:id` - Project statistics
- ✅ `GET /api/projects` - All projects monitoring

**Workflow Logic:**
1. **Metric Collection**: Gather comprehensive project statistics
2. **Trend Analysis**: Identify patterns in project performance
3. **Alerting**: Notify stakeholders of significant metric changes
4. **Reporting**: Generate automated project status reports

---

## 7. Communication & Integration Workflows (4 workflows)

### **7.1 Multi-Channel Notification Orchestration**

**FlowGram Flow:**
```
[Event Trigger] → [Channel Selection Logic] → [Message Customization] → [Delivery & Tracking]
```

**API Endpoints:**
- ✅ Email service via emailService.ts
- ✅ `POST /api/slack-webhook/:id/send` - Slack notifications
- ✅ Slack configuration via slackWebhook.route.ts

**Workflow Logic:**
1. **Channel Selection Logic**:
   - **Critical alerts**: Slack + Email
   - **Urgent notifications**: Slack + Email
   - **Standard updates**: Email only
   - **Daily summaries**: Digest emails
2. **Message Customization**:
   - Template selection based on event type
   - Personalization based on recipient role
   - Branding and formatting consistency
3. **Delivery Tracking**:
   - Monitor delivery success rates
   - Track engagement metrics
   - Handle delivery failures

### **7.2 Slack Integration Workflow**

**FlowGram Flow:**
```
[VerifyWise Event] → [Slack Channel Routing] → [Message Formatting] → [Interactive Elements]
```

**API Endpoints:**
- ✅ `GET /api/slack-webhook` - Slack webhook management
- ✅ `POST /api/slack-webhook` - Webhook creation
- ✅ `POST /api/slack-webhook/:id/send` - Message sending

**Workflow Logic:**
1. **Channel Routing Logic**:
   - Risk alerts → Security team channels
   - Task assignments → Project team channels
   - Compliance updates → Compliance team channels
   - Executive summaries → Leadership channels
2. **Interactive Message Features**:
   - Action buttons for task completion
   - Status update confirmations
   - Link back to VerifyWise for details
3. **Message Threading**: Organize related notifications in Slack threads

### **7.3 Email Notification Workflow**

**FlowGram Flow:**
```
[Event Trigger] → [Recipient Determination] → [Template Selection] → [Email Delivery]
```

**API Endpoints:**
- ✅ Existing email service integration via emailService.ts
- ✅ Multi-provider email support (Resend, SMTP, Exchange, AWS SES)

**Workflow Logic:**
1. **Recipient Targeting**: Determine email recipients based on event type and user roles
2. **Template Management**: Select appropriate email templates for different event types
3. **Delivery Optimization**: Use appropriate email provider based on priority and volume
4. **Tracking**: Monitor email delivery and engagement metrics

### **7.4 Notification Preference Management Workflow**

**FlowGram Flow:**
```
[User Preferences] → [Channel Filtering] → [Frequency Control] → [Delivery Customization]
```

**API Endpoints:**
- ✅ User management via user.route.ts
- ✅ Slack webhook per-user configuration

**Workflow Logic:**
1. **Preference Tracking**: Maintain user notification preferences
2. **Channel Selection**: Respect user preferences for notification channels
3. **Frequency Management**: Control notification frequency based on user settings
4. **Content Filtering**: Filter notifications based on user role and interests

---

## 8. File & Document Management Workflows (3 workflows)

### **8.1 Document Upload & Classification Workflow**

**FlowGram Flow:**
```
[POST /api/files] → [File Analysis] → [Classification] → [Access Control] → [Notification]
```

**API Endpoints:**
- ✅ `POST /api/files` - File upload handling
- ✅ `GET /api/files` - File access monitoring

**Workflow Logic:**
1. **Upload Processing**: Handle file uploads and metadata extraction
2. **Classification**: Categorize files based on content and purpose
3. **Access Control**: Set appropriate permissions based on file type and sensitivity
4. **Stakeholder Notification**: Notify relevant teams of important file uploads

### **8.2 File Access Monitoring Workflow**

**FlowGram Flow:**
```
[File Access Event] → [Access Logging] → [Security Analysis] → [Alert Generation]
```

**API Endpoints:**
- ✅ `GET /api/files` - File access tracking

**Workflow Logic:**
1. **Access Tracking**: Log all file access events
2. **Pattern Analysis**: Detect unusual access patterns
3. **Security Alerts**: Generate alerts for suspicious file access
4. **Compliance Reporting**: Maintain audit trail for compliance purposes

### **8.3 Document Lifecycle Management Workflow**

**FlowGram Flow:**
```
[Document Updates] → [Version Control] → [Review Cycles] → [Archival Process]
```

**API Endpoints:**
- ✅ File management endpoints for document tracking

**Workflow Logic:**
1. **Version Management**: Track document versions and changes
2. **Review Scheduling**: Periodic document review and update cycles
3. **Retention Management**: Handle document retention and archival
4. **Compliance Tracking**: Ensure documents meet regulatory requirements

---

## Technical Implementation Summary

### **API Endpoint Verification Results:**

**✅ Fully Supported Workflows: 39 workflows**
- **Risk Management**: 8 workflows - All endpoints verified
- **Vendor Management**: 6 workflows - Complete CRUD available
- **Control Management**: 7 workflows - Including file upload support
- **Task Management**: 6 workflows - Full lifecycle support
- **Model Inventory**: 4 workflows - Complete CRUD operations
- **Project Coordination**: 5 workflows - Advanced calculation endpoints
- **Communication Integration**: 4 workflows - Robust Slack/Email support
- **File Management**: 3 workflows - Document handling capabilities

### **Integration Architecture Requirements:**

1. **Database Triggers**: PostgreSQL triggers on main tables to initiate workflows
2. **Webhook Handlers**: Endpoints for FlowGram to call VerifyWise APIs
3. **Authentication Bridge**: JWT token management for FlowGram system calls
4. **Event Queue**: Message queue for reliable workflow execution
5. **State Management**: Workflow execution state tracking and recovery

### **FlowGram Node Types Required:**

- **Trigger Nodes**: API endpoint triggers, schedule triggers
- **Condition Nodes**: Data comparison, threshold evaluation, status checking
- **Action Nodes**: Email sending, Slack messaging, API calls, task creation
- **Data Processing Nodes**: JSON parsing, field extraction, calculations
- **Integration Nodes**: VerifyWise API connectors, external system integrations

This comprehensive catalog demonstrates VerifyWise's robust API coverage supporting 39 distinct automation workflows across all major GRC processes, providing excellent foundation for FlowGram integration.

---

*Document Version: 1.0*
*Last Updated: 2025-01-26*
*Status: Verified Against Backend APIs*