# Incident Management Domain

## Overview

Incident Management in VerifyWise provides a comprehensive system for tracking, investigating, and resolving AI-related incidents. It supports EU AI Act Article 73 compliance for serious incident reporting, with approval workflows, change tracking, and integration with CE marking documentation.

## Key Features

- Incident lifecycle management (Open → Investigating → Mitigated → Closed)
- Multi-level severity classification (Minor, Serious, Very Serious)
- Approval workflow with audit trail
- Harm category tracking
- Field-level change history
- CE marking integration for regulatory compliance
- Automation triggers for notifications
- AI advisor integration for analytics

## Database Schema

### Incident Management Table

```
ai_incident_managements
├── id (PK, SERIAL)
├── incident_id (TEXT, UNIQUE) -- Auto-generated: INC-[sequence]
├── ai_project (TEXT NOT NULL)
├── type (ENUM)
├── severity (ENUM)
├── occurred_date (TIMESTAMPTZ NOT NULL)
├── date_detected (TIMESTAMPTZ NOT NULL)
├── reporter (TEXT NOT NULL)
├── status (ENUM, default: Open)
├── categories_of_harm (JSON NOT NULL)
├── affected_persons_groups (TEXT)
├── description (TEXT NOT NULL)
├── relationship_causality (TEXT)
├── immediate_mitigations (TEXT)
├── planned_corrective_actions (TEXT)
├── model_system_version (TEXT)
├── interim_report (BOOLEAN, default: false)
├── approval_status (ENUM, default: Pending)
├── approved_by (TEXT)
├── approval_date (TIMESTAMPTZ)
├── approval_notes (TEXT)
├── archived (BOOLEAN, default: false)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### Incident Change History Table

```
incident_change_history
├── id (PK, SERIAL)
├── incident_id (FK → ai_incident_managements)
├── action (created/updated/deleted)
├── field_name (VARCHAR)
├── old_value (TEXT)
├── new_value (TEXT)
├── changed_by_user_id (FK → users)
├── changed_at (TIMESTAMP)
└── created_at (TIMESTAMP)
```

### CE Marking Incidents Table

```
ce_marking_incidents (junction table)
├── id (PK, SERIAL)
├── ce_marking_id (FK → ce_markings)
├── incident_id (FK → ai_incident_managements)
├── linked_at (TIMESTAMP)
└── linked_by (INTEGER)
```

## Enumerations

### Incident Status

```typescript
enum AIIncidentManagementStatus {
  OPEN = "Open"
  INVESTIGATING = "Investigating"
  MITIGATED = "Mitigated"
  CLOSED = "Closed"
}
```

### Approval Status

```typescript
enum AIIncidentManagementApprovalStatus {
  PENDING = "Pending"
  APPROVED = "Approved"
  REJECTED = "Rejected"
  NOT_REQUIRED = "Not required"
}
```

### Severity

```typescript
enum Severity {
  MINOR = "Minor"
  SERIOUS = "Serious"
  VERY_SERIOUS = "Very serious"
}
```

### Incident Type

```typescript
enum IncidentType {
  MALFUNCTION = "Malfunction"
  UNEXPECTED_BEHAVIOR = "Unexpected behavior"
  MODEL_DRIFT = "Model drift"
  MISUSE = "Misuse"
  DATA_CORRUPTION = "Data corruption"
  SECURITY_BREACH = "Security breach"
  PERFORMANCE_DEGRADATION = "Performance degradation"
}
```

### Harm Category

```typescript
enum HarmCategory {
  HEALTH = "Health"
  SAFETY = "Safety"
  FUNDAMENTAL_RIGHTS = "Rights"
  PROPERTY = "Property"
  ENVIRONMENT = "Environment"
}
```

## API Endpoints

### Incident CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/aiIncidentManagement/` | Get all incidents |
| GET | `/aiIncidentManagement/:id` | Get incident by ID |
| POST | `/aiIncidentManagement/` | Create incident |
| PATCH | `/aiIncidentManagement/:id` | Update incident |
| PATCH | `/aiIncidentManagement/:id/archive` | Archive incident |
| DELETE | `/aiIncidentManagement/:id` | Delete incident |

### Change History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/incident-change-history/:incidentId` | Get change history |

Query params: `limit`, `offset` for pagination

## Create Incident Request

```typescript
POST /aiIncidentManagement/
{
  ai_project: "Customer Service Chatbot",
  type: "Unexpected behavior",
  severity: "Serious",
  occurred_date: "2025-01-15T10:30:00Z",
  date_detected: "2025-01-15T11:00:00Z",
  reporter: "John Smith",
  status: "Open",
  categories_of_harm: ["Safety", "Rights"],
  affected_persons_groups: "End users",
  description: "AI provided incorrect medical advice...",
  relationship_causality: "Direct causal relationship",
  immediate_mitigations: "Service temporarily suspended",
  planned_corrective_actions: "Implement guardrails",
  model_system_version: "GPT-4-turbo v1.2"
}
```

## Incident Lifecycle

### Status Workflow

```
[Open] → [Investigating] → [Mitigated] → [Closed]
                             ↓
                      (Cannot reopen)
```

### Business Rules

- `date_detected` must be >= `occurred_date`
- Closed incidents cannot be reopened
- Archived incidents remain in database (soft delete)

### Approval Workflow

```
[Pending] → [Approved] → (approval_date set)
    ↓
[Rejected]
    ↓
[Not Required]
```

When approved:
- `approved_by` populated with approver name
- `approval_date` set to current timestamp
- `approval_notes` optional comments

## Change Tracking

All incident modifications are tracked:

| Event | Recorded |
|-------|----------|
| Creation | All initial field values |
| Update | Field-by-field changes (old → new) |
| Deletion | Deletion event |
| Archival | Archived flag change |

### Change History Entry

```typescript
{
  incident_id: number,
  action: "created" | "updated" | "deleted",
  field_name: string,
  old_value: string,
  new_value: string,
  changed_by_user_id: number,
  changed_at: Date
}
```

## Frontend Structure

### Main Page

**Location:** `pages/IncidentManagement/index.tsx`

**Features:**
- Incident list with filtering
- Filter by: incident_id, ai_project, type, severity, status, approval_status
- Group by support
- Search functionality
- Role-based create (Admin/Editor only)
- Export functionality

### Key Components

| Component | Purpose |
|-----------|---------|
| `IncidentManagement` | Main page |
| `IncidentTable` | Sortable, paginated table |
| `NewIncident` | Create/edit/view modal |
| `IncidentStatusCard` | Metrics display |
| `IncidentManagementSteps` | User onboarding tour |

### Incident Modal Sections

The modal is organized into 4 sections:

1. **Incident Information**
   - Project, type, severity
   - Status, dates
   - Reporter, model version

2. **Impact Assessment**
   - Harm categories (multi-select)
   - Affected persons/groups
   - Description
   - Relationship/causality

3. **Response & Actions**
   - Immediate mitigations
   - Planned corrective actions

4. **Approval & Reporting**
   - Approval status
   - Approver, approval date
   - Approval notes
   - Interim report toggle

### Table Features

- 8 sortable columns
- Pagination with localStorage persistence
- Sort state persistence
- Row options: 5, 10, 15, 25
- Color-coded status/severity chips
- Edit, archive, view actions
- Confirmation dialogs

## Validation Rules

### Field Validation

| Field | Rule |
|-------|------|
| description | 5-1000 characters |
| categories_of_harm | At least one required |
| relationship_causality | 3-255 characters |
| ai_project | 2-255 characters |
| reporter | 2-100 characters |
| severity | Valid enum value |
| status | Valid enum value |
| approval_status | Valid enum value |
| occurred_date | Required |
| date_detected | Required, >= occurred_date |

### Business Rule Validation

```typescript
// Creation rules
validateIncidentCreationBusinessRules(data) {
  if (date_detected < date_occurred) {
    throw Error("Detection date cannot be before occurrence date");
  }
}

// Update rules
validateIncidentUpdateBusinessRules(old, new) {
  if (old.status === "Closed" && new.status !== "Closed") {
    throw Error("Cannot reopen closed incidents");
  }
}
```

## CE Marking Integration

Incidents can be linked to CE marking records for regulatory compliance:

```
Incident ──── ce_marking_incidents ──── CE Marking
```

This supports EU AI Act Article 73 requirements for documenting serious incidents alongside conformity assessments.

## Automation Triggers

| Trigger | Event |
|---------|-------|
| `incident_added` | New incident created |
| `incident_updated` | Incident modified |
| `incident_deleted` | Incident deleted |

### Email Template Variables

For incident notifications:
- `incident.*` - Current values
- `old_incident.*` - Previous values (for updates)
- `changes_summary` - Markdown list of all changes
- `date_and_time` - Current timestamp

## AI Advisor Integration

### Available Tools

| Tool | Purpose |
|------|---------|
| `fetch_incidents` | Query with filters |
| `get_incident_analytics` | Analytics dashboard |
| `get_incident_executive_summary` | High-level overview |

### Analytics Capabilities

- Type distribution
- Severity distribution
- Status distribution
- Harm categories breakdown
- Incidents by project
- Resolution progress metrics

## EU AI Act Compliance

The incident management system supports Article 73 requirements:

- **Serious Incident Reporting**: Track incidents with severity levels
- **Harm Documentation**: Categories align with EU AI Act harm types
- **Audit Trail**: Complete change history for regulatory review
- **CE Marking Link**: Associate incidents with conformity assessments
- **Interim Reports**: Flag for ongoing incident reporting

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `domain.layer/models/incidentManagement/incidemtManagement.model.ts` | Model |
| `domain.layer/interfaces/i.aiIncidentManagement.ts` | Interface |
| `domain.layer/enums/ai-incident-management.enum.ts` | Enums |
| `utils/incidentManagement.utils.ts` | Queries |
| `utils/validations/incidentManagementValidation.utils.ts` | Validation |
| `utils/incidentChangeHistory.utils.ts` | History tracking |
| `utils/automation/incident.automation.utils.ts` | Automation |
| `controllers/incident-management.ctrl.ts` | Controller |
| `routes/aiIncidentManagement.route.ts` | Routes |
| `advisor/tools/incidentTools.ts` | AI tools |

### Frontend

| File | Purpose |
|------|---------|
| `pages/IncidentManagement/index.tsx` | Main page |
| `pages/IncidentManagement/IncidentTable.tsx` | Table component |
| `components/Modals/NewIncident/index.tsx` | Modal |
| `domain/enums/aiIncidentManagement.enum.ts` | Client enums |
| `domain/models/Common/incidentManagement/` | Client model |

## Related Documentation

- [Risk Management](./risk-management.md)
- [Use Cases](./use-cases.md)
- [Compliance Frameworks](./compliance-frameworks.md)
