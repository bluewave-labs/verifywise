# Post-Market Monitoring Domain

## Overview

Post-Market Monitoring (PMM) is a systematic compliance feature that enables organizations to conduct periodic reviews of AI use cases to ensure continued compliance with EU AI Act requirements (Articles 9, 72). PMM automates recurring questionnaires, tracks responses, generates audit-ready PDF reports, and implements escalation workflows.

## Key Features

- Configurable monitoring frequency per use case
- Periodic questionnaires for stakeholder assessment
- Risk, model, and vendor context tracking
- Automated reminder and escalation notifications
- PDF report generation for audit trails
- Flag concerns for immediate attention

## Database Schema

### PMM Configuration

```
post_market_monitoring_configs
├── id (PK)
├── project_id (FK, UNIQUE)
├── is_active (BOOLEAN)
├── frequency_value (INTEGER, default: 30)
├── frequency_unit (days/weeks/months)
├── start_date (DATE, optional)
├── reminder_days (INTEGER, default: 3)
├── escalation_days (INTEGER, default: 7)
├── escalation_contact_id (FK → users)
├── notification_hour (INTEGER, default: 9)
├── created_by (FK → users)
├── created_at
└── updated_at
```

### PMM Questions

```
post_market_monitoring_questions
├── id (PK)
├── config_id (FK, nullable for global templates)
├── question_text
├── question_type (yes_no/multi_select/multi_line_text)
├── options (JSONB, for multi_select)
├── suggestion_text (shown when "No")
├── is_required (BOOLEAN)
├── is_system_default (BOOLEAN)
├── allows_flag_for_concern (BOOLEAN)
├── display_order (INTEGER)
├── eu_ai_act_article (e.g., "Article 9")
└── created_at
```

### PMM Cycles

```
post_market_monitoring_cycles
├── id (PK)
├── config_id (FK)
├── cycle_number (INTEGER)
├── status (pending/in_progress/completed/escalated)
├── started_at
├── due_at
├── reminder_sent_at
├── escalation_sent_at
├── completed_at
├── completed_by (FK → users)
├── assigned_stakeholder_id (FK → users)
└── created_at
```

### PMM Responses

```
post_market_monitoring_responses
├── id (PK)
├── cycle_id (FK)
├── question_id (FK)
├── response_value (JSONB)
├── is_flagged (BOOLEAN)
├── created_at
├── updated_at
└── UNIQUE(cycle_id, question_id)
```

### PMM Reports

```
post_market_monitoring_reports
├── id (PK)
├── cycle_id (FK, UNIQUE)
├── file_id (FK → files)
├── context_snapshot (JSONB)
├── generated_at
└── generated_by (FK → users)
```

## Configuration

### Frequency Settings

| Setting | Description | Default |
|---------|-------------|---------|
| frequency_value | Number of units | 30 |
| frequency_unit | days/weeks/months | days |
| start_date | When to start cycles | Now |

### Notification Settings

| Setting | Description | Default |
|---------|-------------|---------|
| reminder_days | Days before due to remind | 3 |
| escalation_days | Days after due to escalate | 7 |
| notification_hour | Hour to send (0-23) | 9 |
| escalation_contact_id | User for escalations | Admin |

## Default Questions

PMM is seeded with 7 default questions:

1. **Risk Review** (yes_no, required)
   - "Have you reviewed all identified risks and their mitigations for this use case?"
   - Article: 9

2. **Model Review** (yes_no, required)
   - "Have you reviewed the connected AI models and their associated risks?"
   - Article: 9

3. **Vendor Review** (yes_no, required)
   - "Have you reviewed the connected vendors and their associated risks?"
   - Article: 72

4. **Incident Reporting** (yes_no, required)
   - "Have there been any incidents, malfunctions, or unexpected behaviors to report?"
   - Article: 72

5. **System Changes** (yes_no, required)
   - "Have any changes been made to the AI system or its operating environment since the last review?"
   - Article: 9

6. **Documentation** (yes_no, required)
   - "Are all required technical documentation and logs up to date?"
   - Article: 9

7. **Additional Concerns** (multi_line_text, optional)
   - "Any additional concerns or observations to report?"

## Cycle Lifecycle

```
[Cycle Created]
    ↓
[Pending] → Initial notification sent
    ↓
[In Progress] → Stakeholder completes questionnaire
    ↓
[Completed] → Report generated, completion email sent

Alternative path:
[Pending/In Progress]
    ↓ (overdue)
[Escalated] → Escalation notification to admin
```

### Status Transitions

| From | To | Trigger |
|------|-----|---------|
| (new) | Pending | Cycle created |
| Pending | In Progress | First response saved |
| In Progress | Completed | All required answered + submit |
| Pending/In Progress | Escalated | Overdue + escalation_days |

## Notification Workflow

### Email Templates

| Template | Trigger | Recipient | Color |
|----------|---------|-----------|-------|
| pmm-initial-notification | Cycle starts | Stakeholder | Green |
| pmm-reminder | Days until due ≤ reminder_days | Stakeholder | Orange |
| pmm-escalation | Days overdue ≥ escalation_days | Admin | Red |
| pmm-flagged-concern | Response flagged | Admin | Red |
| pmm-completed | Cycle submitted | Stakeholder | Green |

### Scheduler

Runs hourly via BullMQ automation queue:
- Cron pattern: `0 * * * *` (every hour)
- Checks configs matching current notification_hour
- Creates new cycles if none active
- Processes pending cycles for notifications

### Notification Data

```typescript
interface IPMMNotificationData {
  stakeholder_name: string;
  stakeholder_email: string;
  use_case_title: string;
  use_case_id: number;
  cycle_number: number;
  due_date: string;
  days_remaining: number;
  monitoring_link: string;
  organization_name: string;
}

interface IPMMEscalationData extends IPMMNotificationData {
  escalation_contact_name: string;
  escalation_contact_email: string;
  days_overdue: number;
}
```

## PDF Report Generation

### Report Contents

- **Header**: Organization logo + VerifyWise branding
- **Metadata**: Use case, cycle number, date, submitter
- **Context Snapshot**: Risk/model/vendor counts at report time
- **Questions & Responses**: With flag indicators
- **EU AI Act References**: Article citations
- **Footer**: Page numbers

### Context Snapshot

```typescript
interface IPMMContextSnapshot {
  use_case_title: string;
  use_case_status: string;
  total_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  total_models: number;
  model_risks: number;
  total_vendors: number;
  vendor_risks: number;
  captured_at: Date;
}
```

### Generation Process

1. Cycle submitted
2. Context snapshot captured
3. EJS template rendered to HTML
4. Playwright converts to PDF (A4, 0.75in margins)
5. File uploaded via file service
6. Report record created

## API Endpoints

### Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pmm/config/:projectId` | Get config |
| POST | `/pmm/config` | Create config |
| PUT | `/pmm/config/:configId` | Update config |
| DELETE | `/pmm/config/:configId` | Delete config |

### Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pmm/config/:configId/questions` | Get questions |
| GET | `/pmm/org/questions` | Get org template |
| POST | `/pmm/config/:configId/questions` | Add question |
| PUT | `/pmm/questions/:questionId` | Update question |
| DELETE | `/pmm/questions/:questionId` | Delete question |
| POST | `/pmm/questions/reorder` | Reorder |

### Cycles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pmm/active-cycle/:projectId` | Get active cycle |
| GET | `/pmm/cycles/:cycleId` | Get cycle details |
| GET | `/pmm/cycles/:cycleId/responses` | Get responses |
| POST | `/pmm/cycles/:cycleId/responses` | Save responses |
| POST | `/pmm/cycles/:cycleId/submit` | Submit cycle |
| POST | `/pmm/cycles/:cycleId/flag` | Flag concern |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pmm/reports` | List reports |
| GET | `/pmm/reports/:reportId/download` | Download PDF |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pmm/cycles/:cycleId/reassign` | Reassign stakeholder |
| POST | `/pmm/projects/:projectId/start-cycle` | Manual cycle start |

## Frontend Structure

### Pages

| Page | Location | Purpose |
|------|----------|---------|
| MonitoringForm | `pages/PostMarketMonitoring/MonitoringForm/` | Stakeholder questionnaire |
| ReportsArchive | `pages/PostMarketMonitoring/ReportsArchive/` | Report listing |
| Configuration | `pages/ProjectView/PostMarketMonitoring/` | PMM settings |

### MonitoringForm Features

- Question display by type
- Autosave for partial responses
- Flag concern button
- Submit with validation
- Progress tracking
- Breadcrumb navigation

### ReportsArchive Features

- Paginated report table
- Date range filtering
- Flagged concerns filter
- PDF download button
- Responsive design

### Configuration Features

- Enable/disable toggle
- Frequency settings
- Notification timing
- Escalation contact picker
- Drag-and-drop question ordering
- Question editor modal
- Question type selection

## Question Types

### yes_no

```typescript
{
  question_type: "yes_no",
  response_value: true | false
}
```

Displays as radio buttons (Yes/No).

### multi_select

```typescript
{
  question_type: "multi_select",
  options: ["Option 1", "Option 2", "Option 3"],
  response_value: ["Option 1", "Option 3"]
}
```

Displays as checkboxes.

### multi_line_text

```typescript
{
  question_type: "multi_line_text",
  response_value: "Free text response..."
}
```

Displays as textarea.

## Flag for Concern

When `allows_flag_for_concern` is true:
- Checkbox appears next to question
- Flagging triggers immediate notification
- Report marks flagged responses
- Admin receives alert

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `domain.layer/interfaces/i.postMarketMonitoring.ts` | Interfaces |
| `routes/postMarketMonitoring.route.ts` | Routes |
| `controllers/postMarketMonitoring.ctrl.ts` | Controller |
| `utils/postMarketMonitoring.utils.ts` | Queries |
| `services/postMarketMonitoring/pmmScheduler.ts` | Scheduler |
| `services/postMarketMonitoring/pmmPdfGenerator.ts` | PDF gen |
| `services/postMarketMonitoring/defaultQuestions.ts` | Defaults |
| `templates/pmm-*.mjml` | Email templates |
| `templates/reports/pmm-report.ejs` | PDF template |

### Frontend

| File | Purpose |
|------|---------|
| `domain/types/PostMarketMonitoring.ts` | Types |
| `infrastructure/api/postMarketMonitoringService.ts` | API service |
| `pages/PostMarketMonitoring/MonitoringForm/` | Form page |
| `pages/PostMarketMonitoring/ReportsArchive/` | Reports page |
| `pages/ProjectView/PostMarketMonitoring/` | Config page |

## Integration Points

- **File Upload Service**: PDF report storage
- **Automation Queue**: Scheduled notifications
- **Email Service**: MJML template rendering
- **User Service**: Stakeholder lookups
- **Project Service**: Use case relationships

## EU AI Act Compliance

- Questions reference specific articles (9, 72)
- Reports include article citations
- Context captures risk/model/vendor state
- Audit trail with timestamps

## Related Documentation

- [Use Cases](./use-cases.md)
- [Risk Management](./risk-management.md)
- [Email Service](../infrastructure/email-service.md)
- [PDF Generation](../infrastructure/pdf-generation.md)
