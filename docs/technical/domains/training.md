# Training Registry Domain

## Overview

The Training Registry in VerifyWise provides a centralized system for tracking organizational AI training programs. It supports training lifecycle management with status tracking, participant counts, department associations, and integration with reporting and automation systems.

## Key Features

- Training program registration and tracking
- Status lifecycle (Planned → In Progress → Completed)
- Participant count management
- Department and provider categorization
- Filtering, grouping, and search
- Report generation integration
- Automation triggers for notifications

## Database Schema

### Training Register Table

```
trainingregistar
├── id (PK, SERIAL)
├── training_name (VARCHAR NOT NULL)
├── duration (VARCHAR) -- e.g., "2 hours", "3 days"
├── provider (VARCHAR) -- e.g., "Internal", "External Vendor"
├── department (VARCHAR)
├── status (ENUM)
├── people (INTEGER) -- Maps to numberOfPeople in API
├── description (VARCHAR, optional)
├── is_demo (BOOLEAN, default: false)
├── createdAt (DATE)
└── updatedAt (DATE)
```

## Enumerations

### Training Status

```typescript
enum TrainingStatus {
  PLANNED = "Planned"
  IN_PROGRESS = "In Progress"
  COMPLETED = "Completed"
}
```

### Progress Percentage

| Status | Percentage |
|--------|------------|
| Planned | 0% |
| In Progress | 50% |
| Completed | 100% |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/training/` | Get all training records |
| GET | `/training/training-id/:id` | Get training by ID |
| POST | `/training/` | Create training |
| PATCH | `/training/:id` | Update training |
| DELETE | `/training/:id` | Delete training |

All endpoints require JWT authentication.

## Create Training Request

```typescript
POST /training/
{
  training_name: "AI Ethics Fundamentals",
  duration: "4 hours",
  provider: "Internal Training",
  department: "Engineering",
  status: "Planned",
  numberOfPeople: 25,
  description: "Introduction to AI ethics principles and best practices"
}
```

## Training Interface

```typescript
interface ITrainingRegister {
  id?: number;
  training_name: string;
  duration: string;
  provider: string;
  department: string;
  status: "Planned" | "In Progress" | "Completed";
  numberOfPeople: number;
  description: string;
}
```

## Validation Rules

### Field Validation

| Field | Rule |
|-------|------|
| training_name | 2-255 characters |
| department | 1-100 characters |
| provider | 1-255 characters |
| duration | 1-1000 characters, include time units |
| numberOfPeople | 1-1000 (warning if > 500) |
| description | 1-2000 characters (optional) |

### Business Rules

| Rule | Description |
|------|-------------|
| No restart | Cannot change "Completed" back to "Planned" |
| No completion from cancelled | Cannot mark "Cancelled" as completed |
| No participant reduction | Cannot reduce participants for "In Progress" or "Completed" |

```typescript
validateTrainingRegistrarUpdateBusinessRules(old, new) {
  if (old.status === "Completed" && new.status === "Planned") {
    throw Error("Cannot change completed training back to planned");
  }
  if ((old.status === "In Progress" || old.status === "Completed")
      && new.numberOfPeople < old.numberOfPeople) {
    throw Error("Cannot reduce participant count");
  }
}
```

## Status Lifecycle

```
[Planned] → [In Progress] → [Completed]
    ↓
(Cannot revert from Completed)
```

## Frontend Structure

### Main Page

**Location:** `pages/TrainingRegistar/index.tsx`

**Features:**
- CRUD operations with modal forms
- Filtering by status, provider, department
- GroupBy (status, provider, department)
- Search functionality
- Export to CSV/Excel
- Pagination with configurable rows
- Permission checks (Admin/Editor for creation)
- URL parameter support for direct edit

### Key Components

| Component | Purpose |
|-----------|---------|
| `TrainingRegistar` | Main page |
| `TrainingTable` | Sortable, paginated table |
| `NewTraining` | Create/edit modal |
| `TrainingSteps` | User onboarding tour |

### Table Features

- Sortable columns (name, duration, provider, department, status, participants)
- Clickable rows to edit
- Delete with confirmation
- Pagination (10, 15, 25 rows)
- localStorage persistence for sort state
- Status badges with color coding
- Loading/empty states

### Modal Form Fields

| Field | Type | Required |
|-------|------|----------|
| Training name | Text | Yes |
| Duration | Text | Yes |
| Provider | Text | Yes |
| Department | Text | Yes |
| Status | Select | Yes |
| Number of people | Number | Yes |
| Description | Textarea | No |

## Dashboard Integration

Training metrics displayed on main dashboard:
- Total training count
- Distribution by status
- Completion percentage
- Total participants tracked
- Recent trainings list

## Report Integration

Training data included in organization reports:

```typescript
interface TrainingRegistrySectionData {
  totalRecords: number;
  records: {
    id: number;
    trainingName: string;
    completionDate?: string;
    status: string;
    assignee?: string;
  }[];
}
```

Report sections:
- Standalone training registry reports
- Combined organization reports
- Custom section selection

## Automation Triggers

| Trigger | Event |
|---------|-------|
| `training_added` | New training created |
| `training_updated` | Training modified |
| `training_deleted` | Training deleted |

### Template Variables

For training notifications:
- `training.name` - Training name
- `training.description` - Description
- `training.duration` - Duration
- `training.provider` - Provider name
- `training.department` - Department name
- `training.status` - Current status
- `training.number_of_people` - Participant count
- `old_training.*` - Previous values (on update)
- `changes_summary` - Formatted list of changes
- `date_and_time` - Current timestamp

## Search Integration

Training records searchable via Wise Search:
- Search type: `training_registar` → "Training"
- Search results can open edit modal
- Uses `trainingId` URL parameter

## API Response Mapping

Database to API field mapping:

| Database | API |
|----------|-----|
| `people` | `numberOfPeople` |

Controller handles mapping before updates.

## Model Methods

### Static Methods

```typescript
static createNewTrainingRegister(data)
static findByIdWithValidation(id, tenant)
static findByStatus(status, tenant)
static findByDepartment(department, tenant)
```

### Instance Methods

```typescript
isPlanned(): boolean
isInProgress(): boolean
isCompleted(): boolean
getProgressPercentage(): number
getSummary(): object
validateTrainingRegisterData(): void
```

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `domain.layer/models/trainingRegistar/trainingRegistar.model.ts` | Model |
| `domain.layer/interfaces/i.trainingRegister.ts` | Interface |
| `utils/trainingRegistar.utils.ts` | Queries |
| `utils/validations/trainingValidation.utils.ts` | Validation |
| `utils/automation/training.automation.utils.ts` | Automation |
| `controllers/trainingRegistar.ctrl.ts` | Controller |
| `routes/trainingRegistar.route.ts` | Routes |

### Frontend

| File | Purpose |
|------|---------|
| `domain/models/Common/trainingRegistar/trainingRegistar.model.ts` | Client model |
| `domain/enums/status.enum.ts` | Status enum |
| `application/repository/trainingregistar.repository.ts` | API calls |
| `pages/TrainingRegistar/index.tsx` | Main page |
| `pages/TrainingRegistar/trainingTable.tsx` | Table |
| `components/Modals/NewTraining/index.tsx` | Modal |

## Related Documentation

- [Reporting](./reporting.md)
- [Automations](../infrastructure/automations.md)
- [Use Cases](./use-cases.md)
