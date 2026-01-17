# Compliance Frameworks Domain

## Overview

VerifyWise supports four major compliance frameworks for AI governance: EU AI Act, ISO 42001, ISO 27001, and NIST AI RMF. Each framework has a distinct structure, but all share common patterns for progress tracking, status management, and risk linking.

## Supported Frameworks

| Framework | ID | Purpose |
|-----------|-----|---------|
| EU AI Act | 1 | European AI regulation |
| ISO 42001 | 2 | AI management system |
| ISO 27001 | 3 | Information security management |
| NIST AI RMF | 4 | AI risk management |

## Framework Structures

### EU AI Act

```
Control Categories (13)
└── Controls
    ├── SubControls
    └── Risk Links

Topics (Assessment)
└── SubTopics
    └── Answers
```

**13 Control Categories:**
1. AI literacy
2. Transparency and provision of information
3. Human oversight
4. Corrective actions and duty of information
5. Responsibilities along the AI value chain
6. Obligations of deployers of high-risk AI systems
7. Fundamental rights impact assessments
8. Transparency obligations for providers
9. Registration
10. EU database for high-risk AI
11. Post-market monitoring by providers
12. Reporting serious incidents
13. General-purpose AI models

### ISO 42001 / ISO 27001

```
Clauses (4-10)
└── SubClauses
    ├── Implementation Details
    ├── Evidence Links
    └── Risk Links

Annexes
└── Annex Categories / Controls
    ├── Implementation Details
    └── Evidence Links
```

**Clause Numbers:** 4, 5, 6, 7, 8, 9, 10

### NIST AI RMF

```
Functions (4)
└── Categories
    └── Subcategories
        ├── Implementation Details
        ├── Evidence Links
        └── Risk Links
```

**Four Core Functions:**
- **GOVERN** - Establish policies, processes, accountability
- **MAP** - Identify AI systems and risk context
- **MEASURE** - Assess, analyze, track risks
- **MANAGE** - Prioritize, respond to, monitor risks

## Database Models

### Project-Framework Link

```
project_frameworks
├── project_id (FK)
├── framework_id (FK)
└── is_demo
```

### EU AI Act Tables

```
controls_eu
├── id (PK)
├── control_meta_id
├── projects_frameworks_id (FK)
├── status (Waiting, In progress, Done)
├── risk_review (Acceptable, Residual, Unacceptable)
├── owner (FK → users)
├── reviewer (FK → users)
├── approver (FK → users)
├── due_date
└── implementation_details

subcontrols_eu
├── id (PK)
├── control_id (FK)
├── title
└── status

answers_eu
├── id (PK)
├── topic_id
├── projects_frameworks_id (FK)
├── status (Not started, In progress, Done)
└── evidence_links (JSONB)
```

### ISO 42001/27001 Tables

```
subclauses_iso / iso27001_subclauses
├── id (PK)
├── subclause_struct_id (FK)
├── projects_frameworks_id (FK)
├── implementation_description
├── evidence_links (JSONB)
├── status (Status enum)
├── owner / reviewer / approver (FK → users)
├── due_date
└── auditor_feedback

annexcategories_iso / iso27001_annexcontrols
├── id (PK)
├── annex_struct_id (FK)
├── projects_frameworks_id (FK)
├── is_applicable
├── justification_for_exclusion
├── implementation_description
├── evidence_links (JSONB)
└── status
```

### NIST AI RMF Tables

```
nist_ai_rmf_functions
├── id (PK)
├── type (Govern, Map, Measure, Manage)
├── title
├── description
└── framework_id

nist_ai_rmf_categories
├── id (PK)
├── function_id (FK)
├── title
├── index
└── description

nist_ai_rmf_subcategories
├── id (PK)
├── category_id (FK)
├── projects_frameworks_id (FK)
├── title
├── index
├── description
├── implementation_description
├── evidence_links (JSONB)
├── tags (ARRAY)
├── status
├── owner / reviewer / approver (FK → users)
└── due_date
```

## Status Enumerations

### Implementation Status (ISO frameworks)

```typescript
enum Status {
  NOT_STARTED = "Not started"
  DRAFT = "Draft"
  IN_PROGRESS = "In progress"
  AWAITING_REVIEW = "Awaiting review"
  AWAITING_APPROVAL = "Awaiting approval"
  IMPLEMENTED = "Implemented"
  NEEDS_REWORK = "Needs rework"
}
```

### Compliance Status (EU AI Act)

```typescript
enum StatusCompliance {
  WAITING = "Waiting"
  IN_PROGRESS = "In progress"
  DONE = "Done"
}
```

### Assessment Status

```typescript
enum StatusAnswers {
  NOT_STARTED = "Not started"
  IN_PROGRESS = "In progress"
  DONE = "Done"
}
```

## Implementation Workflow

### ISO 42001/27001 Workflow

```
[Not started]
    ↓
[Draft] → Create implementation description
    ↓
[In progress] → Add evidence links
    ↓
[Awaiting review] → Reviewer evaluates
    ↓
[Awaiting approval] or [Needs rework]
    ↓
[Implemented] ← Approver confirms
```

### EU AI Act Workflow

```
[Waiting]
    ↓
[In progress] → Implementation work
    ↓
[Done] ← Control completed
```

## API Endpoints

### Framework Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/frameworks/` | List all frameworks |
| GET | `/frameworks/:id` | Get framework |
| POST | `/frameworks/toProject` | Add to project |
| DELETE | `/frameworks/fromProject` | Remove from project |

### ISO 42001

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/iso-42001/clauses` | All clauses |
| GET | `/iso-42001/clauses/struct/byProjectId/:id` | Structure |
| GET | `/iso-42001/clauses/byProjectId/:id` | Project clauses |
| GET | `/iso-42001/subClauses/byClauseId/:id` | SubClauses |
| GET | `/iso-42001/subClause/byId/:id` | Single subclause |
| GET | `/iso-42001/subclauses/:id/risks` | Linked risks |
| GET | `/iso-42001/annexes` | All annexes |
| GET | `/iso-42001/annexes/byProjectId/:id` | Project annexes |
| GET | `/iso-42001/annexCategories/byAnnexId/:id` | Categories |
| GET | `/iso-42001/annexCategories/:id/risks` | Linked risks |
| GET | `/iso-42001/clauses/progress/:id` | Progress |
| GET | `/iso-42001/annexes/progress/:id` | Progress |
| GET | `/iso-42001/clauses/assignments/:id` | Assignments |
| PATCH | `/iso-42001/saveClauses/:id` | Save clauses |
| PATCH | `/iso-42001/saveAnnexes/:id` | Save annexes |
| DELETE | `/iso-42001/clauses/byProjectId/:id` | Delete |

### ISO 27001

Same structure as ISO 42001 with `/iso-27001` prefix.

### NIST AI RMF

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nist-ai-rmf/functions` | All functions |
| GET | `/nist-ai-rmf/functions/:id` | Single function |
| GET | `/nist-ai-rmf/categories/:title` | Categories |
| GET | `/nist-ai-rmf/subcategories/byId/:id` | Subcategory |
| GET | `/nist-ai-rmf/subcategories/:id/risks` | Linked risks |
| GET | `/nist-ai-rmf/overview` | Full hierarchy |
| GET | `/nist-ai-rmf/progress` | Total counts |
| GET | `/nist-ai-rmf/progress-by-function` | By function |
| GET | `/nist-ai-rmf/status-breakdown` | By status |
| GET | `/nist-ai-rmf/assignments` | Assignments |
| PATCH | `/nist-ai-rmf/subcategories/:id` | Update |
| PATCH | `/nist-ai-rmf/subcategories/:id/status` | Status only |

### EU AI Act

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/eu-ai-act/controlCategories` | All categories |
| GET | `/eu-ai-act/controls/byControlCategoryId/:id` | Controls |
| GET | `/eu-ai-act/topics` | Assessment topics |
| GET | `/eu-ai-act/topicById` | Single topic |
| GET | `/eu-ai-act/controlById` | Single control |
| GET | `/eu-ai-act/compliances/byProjectId/:id` | Compliance |
| GET | `/eu-ai-act/assessments/byProjectId/:id` | Assessments |
| GET | `/eu-ai-act/compliances/progress/:id` | Progress |
| GET | `/eu-ai-act/assessments/progress/:id` | Progress |
| PATCH | `/eu-ai-act/saveControls/:id` | Save controls |
| PATCH | `/eu-ai-act/saveAnswer/:id` | Save answer |
| DELETE | `/eu-ai-act/compliances/byProjectId/:id` | Delete |
| DELETE | `/eu-ai-act/assessments/byProjectId/:id` | Delete |

## Progress Tracking

### Progress Calculation

```typescript
// Completion
Total Items = COUNT(*)
Completed Items = COUNT(*) WHERE status = 'Implemented' (ISO) or 'Done' (EU)
Completion % = (Completed / Total) × 100

// Assignment
Assigned Items = COUNT(*) WHERE owner IS NOT NULL
Assignment % = (Assigned / Total) × 100
```

### Progress Response

```typescript
{
  total: number,
  completed: number,
  completionPercentage: number,
  assigned: number,
  assignmentPercentage: number
}
```

## Risk Linking

Controls and subclauses can be linked to organizational risks through junction tables:

```
subclauses_iso__risks
├── subclause_id (FK)
└── risk_id (FK)

annexcategories_iso__risks
├── annexcategory_id (FK)
└── risk_id (FK)

controls_eu__risks
├── control_id (FK)
└── risk_id (FK)
```

### Risk Link Data

```typescript
{
  risk_id: number,
  risk_name: string,
  risk_description: string,
  risk_level: string,
  risk_owner: number
}
```

## Assignment Management

Each implementation item can have three role assignments:

| Role | Purpose |
|------|---------|
| Owner | Primary responsibility |
| Reviewer | Technical review |
| Approver | Final approval |

### Assignment Endpoints

```
GET /iso-42001/clauses/assignments/:projectFrameworkId
GET /iso-42001/annexes/assignments/:projectFrameworkId
GET /nist-ai-rmf/assignments
GET /nist-ai-rmf/assignments-by-function
```

## Evidence Management

Evidence is stored as JSONB arrays in `evidence_links` columns:

```typescript
evidence_links: [
  {
    file_id: number,
    file_name: string,
    uploaded_at: string,
    uploaded_by: number
  }
]
```

### Upload Pattern

Evidence files are uploaded via multipart form data to save endpoints:
- `PATCH /iso-42001/saveClauses/:id`
- `PATCH /nist-ai-rmf/subcategories/:id`
- `PATCH /eu-ai-act/saveControls/:id`

## Frontend Structure

### Framework Dashboard

**Location:** `pages/Framework/`

**Components:**
- `FrameworkProgressCard` - Overall completion
- `AnnexOverviewCard` - Annex/category overview
- `ControlCategoriesCard` - Category breakdown
- `AssignmentStatusCard` - Assignment tracking
- `NISTFunctionsOverviewCard` - NIST function breakdown
- `StatusBreakdownCard` - Status distribution

### Framework Views

| View | Location |
|------|----------|
| ISO 42001 Clauses | `Framework/ISO42001/Clause/` |
| ISO 42001 Annexes | `Framework/ISO42001/Annex/` |
| ISO 27001 Clauses | `Framework/ISO27001/Clause/` |
| ISO 27001 Annexes | `Framework/ISO27001/Annex/` |
| NIST Functions | `Framework/NIST-AI-RMF/` |
| EU AI Act | `Framework/EU-AI-Act/` |
| Framework Risks | `Framework/FrameworkRisks/` |

### View Features

- Hierarchical navigation
- Status indicators
- Implementation detail editor
- Evidence upload
- Assignment UI
- Due date picker
- Workflow status buttons
- Auditor feedback

## Adding Framework to Project

### Request

```typescript
POST /frameworks/toProject?frameworkId=2&projectId=5
```

### Process

1. Validate framework and project exist
2. Create `project_frameworks` record
3. Initialize tenant-specific schema tables
4. Clone framework structure to project
5. Populate demo data if applicable
6. Return success

### Remove Framework

```typescript
DELETE /frameworks/fromProject?frameworkId=2&projectId=5
```

Cascades deletion of all implementation data.

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `domain.layer/models/frameworks/` | Core models |
| `domain.layer/frameworks/ISO-42001/` | ISO 42001 models |
| `domain.layer/frameworks/ISO-27001/` | ISO 27001 models |
| `domain.layer/frameworks/NIST-AI-RMF/` | NIST models |
| `domain.layer/frameworks/EU-AI-Act/` | EU AI Act models |
| `utils/framework.utils.ts` | Framework queries |
| `utils/iso42001.utils.ts` | ISO 42001 queries |
| `utils/nistAiRmfCorrect.utils.ts` | NIST queries |
| `utils/eu.utils.ts` | EU AI Act queries |
| `routes/iso-42001.route.ts` | ISO 42001 routes |
| `routes/nist-ai-rmf.route.ts` | NIST routes |
| `routes/eu-ai-act.route.ts` | EU AI Act routes |

### Frontend

| File | Purpose |
|------|---------|
| `pages/Framework/index.tsx` | Main dashboard |
| `pages/Framework/Dashboard/` | Dashboard components |
| `pages/Framework/ISO42001/` | ISO 42001 views |
| `pages/Framework/NIST-AI-RMF/` | NIST views |
| `utils/frameworkDataUtils.ts` | Data utilities |
| `constants/frameworks.ts` | Framework constants |

## Related Documentation

- [Use Cases](./use-cases.md)
- [Risk Management](./risk-management.md)
- [Evidence](./evidence.md)
- [Adding New Framework Guide](../guides/adding-new-framework.md)
