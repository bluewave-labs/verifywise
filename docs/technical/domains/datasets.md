# Dataset Inventory Domain

## Overview

The Dataset Inventory domain provides a centralized registry for tracking datasets used in AI/ML model development. It supports data governance, PII management, bias documentation, and compliance with data protection regulations. Datasets exist as a tab within the Model Inventory and can be linked to models and projects.

## Key Features

- Centralized dataset registry
- Data classification and PII tracking
- Bias documentation and mitigation records
- Dataset-model relationship tracking
- Dataset-project relationship tracking
- Change history and audit trails
- Lifecycle status management

## Database Schema

### Datasets Table

```
datasets
├── id (PK)
├── name (VARCHAR 255, NOT NULL)
├── description (TEXT, NOT NULL)
├── version (VARCHAR 50, NOT NULL)
├── owner (VARCHAR 255, NOT NULL)
├── type (ENUM, NOT NULL)
├── function (TEXT, NOT NULL)
├── source (VARCHAR 255, NOT NULL)
├── license (VARCHAR 255, NULL)
├── format (VARCHAR 100, NULL)
├── classification (ENUM, NOT NULL)
├── contains_pii (BOOLEAN, DEFAULT false)
├── pii_types (TEXT, NULL)
├── status (ENUM, DEFAULT 'Draft')
├── status_date (TIMESTAMP, NOT NULL)
├── known_biases (TEXT, NULL)
├── bias_mitigation (TEXT, NULL)
├── collection_method (TEXT, NULL)
├── preprocessing_steps (TEXT, NULL)
├── documentation_data (JSONB, DEFAULT '[]')
├── is_demo (BOOLEAN, DEFAULT false)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Dataset-Model Junction Table

```
dataset_model_inventories
├── id (PK)
├── dataset_id (FK → datasets)
├── model_inventory_id (FK → model_inventories)
├── relationship_type (VARCHAR 50, DEFAULT 'trained_on')
├── created_at (TIMESTAMP)
└── UNIQUE (dataset_id, model_inventory_id)
```

### Dataset-Project Junction Table

```
dataset_projects
├── id (PK)
├── dataset_id (FK → datasets)
├── project_id (FK → projects)
├── created_at (TIMESTAMP)
└── UNIQUE (dataset_id, project_id)
```

### Dataset Change History Table

```
dataset_change_histories
├── id (PK)
├── dataset_id (FK → datasets)
├── action (ENUM: 'created', 'updated', 'deleted')
├── field_name (VARCHAR 100, NULL)
├── old_value (TEXT, NULL)
├── new_value (TEXT, NULL)
├── changed_by_user_id (FK → users, NULL)
└── changed_at (TIMESTAMP)
```

## Enumerations

### Dataset Status

```typescript
enum DatasetStatus {
  DRAFT = "Draft"
  ACTIVE = "Active"
  DEPRECATED = "Deprecated"
  ARCHIVED = "Archived"
}
```

### Dataset Type

```typescript
enum DatasetType {
  TRAINING = "Training"
  VALIDATION = "Validation"
  TESTING = "Testing"
  PRODUCTION = "Production"
  REFERENCE = "Reference"
}
```

### Data Classification

```typescript
enum DataClassification {
  PUBLIC = "Public"
  INTERNAL = "Internal"
  CONFIDENTIAL = "Confidential"
  RESTRICTED = "Restricted"
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/datasets/` | Get all datasets |
| GET | `/datasets/:id` | Get dataset by ID |
| GET | `/datasets/by-model/:modelId` | Get datasets by model |
| GET | `/datasets/by-project/:projectId` | Get datasets by project |
| GET | `/datasets/:id/history` | Get dataset change history |
| POST | `/datasets/` | Create dataset |
| PATCH | `/datasets/:id` | Update dataset |
| DELETE | `/datasets/:id` | Delete dataset |

## Create Dataset Request

```typescript
POST /datasets/
{
  name: "Customer Transaction Data",
  description: "Anonymized transaction records for fraud detection model training",
  version: "1.0.0",
  owner: "Data Science Team",
  type: "Training",
  function: "Model training for fraud detection algorithm",
  source: "Internal CRM",
  license: "Proprietary",
  format: "Parquet",
  classification: "Confidential",
  contains_pii: false,
  pii_types: "",
  status: "Active",
  status_date: "2025-01-15",
  known_biases: "Underrepresentation of certain geographic regions",
  bias_mitigation: "Applied stratified sampling to balance regional representation",
  collection_method: "Automated ETL from production database",
  preprocessing_steps: "Normalization, outlier removal, feature scaling",
  models: [1, 2],      // Model IDs
  projects: [3]        // Project IDs
}
```

## Update Dataset Request

```typescript
PATCH /datasets/:id
{
  status: "Deprecated",
  status_date: "2025-02-01",
  known_biases: "Updated bias documentation",
  // Can also update model/project associations:
  models: [1, 2, 3],
  deleteModels: false,      // Set to true to remove all model associations
  projects: [3, 4],
  deleteProjects: false     // Set to true to remove all project associations
}
```

## Dataset-Model Relationships

Datasets can be linked to multiple models, and models can use multiple datasets:

```
Dataset A ─────┬───── Model 1 (Training)
               └───── Model 2 (Training)

Model 1 ───────┬───── Dataset A (Training)
               └───── Dataset B (Validation)
```

### Relationship Types

| Type | Meaning |
|------|---------|
| `trained_on` | Model was trained using this dataset |
| (future) `validated_on` | Model was validated using this dataset |
| (future) `tested_on` | Model was tested using this dataset |

## Data Classification Guidelines

| Classification | Description | Handling Requirements |
|---------------|-------------|----------------------|
| Public | Open data, no restrictions | Standard security |
| Internal | Organization-only access | Access controls required |
| Confidential | Sensitive business data | Encryption, audit logging |
| Restricted | Highly regulated data | Maximum security, compliance required |

## PII Management

When `contains_pii` is `true`:

1. Document specific PII types in `pii_types` field
2. Common PII types to document:
   - Names, email addresses, phone numbers
   - Social security numbers, government IDs
   - Financial account numbers
   - Health information
   - Biometric data

### Compliance Considerations

- **GDPR**: Document lawful basis for processing
- **CCPA**: Track consumer data sources
- **HIPAA**: Mark protected health information
- **PCI DSS**: Identify payment card data

## Bias Documentation

### Known Biases

Document any identified biases in the dataset:

- Sampling bias (underrepresentation of groups)
- Historical bias (reflecting past inequities)
- Measurement bias (inconsistent data collection)
- Labeling bias (subjective annotations)

### Bias Mitigation

Record steps taken to address biases:

- Resampling techniques (oversampling, undersampling)
- Data augmentation
- Feature selection adjustments
- Fairness-aware preprocessing

## Change History

### Tracked Actions

| Action | Description |
|--------|-------------|
| `created` | New dataset added |
| `updated` | Dataset fields modified |
| `deleted` | Dataset removed |

### Field-Level Tracking

All dataset modifications are tracked with:

```typescript
{
  dataset_id: number,
  action: "created" | "updated" | "deleted",
  field_name: string,      // e.g., "status", "classification"
  old_value: string,
  new_value: string,
  changed_by_user_id: number,
  changed_at: Date
}
```

## Frontend Structure

### Location

Datasets appear as a tab within the Model Inventory page at `/model-inventory/datasets`.

### Main Page Integration

**Location:** `pages/ModelInventory/index.tsx`

**Tabs:**
- Models - Model inventory table
- Model Risks - Risk management
- **Datasets** - Dataset inventory table
- Evidence Hub - Supporting documentation

### Key Components

| Component | Purpose |
|-----------|---------|
| `DatasetTable` | Dataset list with sorting, pagination, CRUD |
| `DatasetSummary` | Status distribution cards |
| `NewDataset` | Create/edit dataset modal |

### Features

- Status-based summary cards (Draft, Active, Deprecated, Archived)
- Sortable columns with persistent sort preferences
- Search and filtering
- Row click to edit (for authorized users)
- Export functionality
- Pagination with customizable rows per page

## Validation Rules

### Required Fields

- `name` - Dataset name
- `description` - What the dataset contains
- `version` - Version identifier
- `owner` - Responsible person/team
- `type` - Purpose (Training/Validation/Testing/Production/Reference)
- `function` - Role in AI model development
- `source` - Data origin
- `classification` - Sensitivity level
- `status` - Lifecycle stage
- `status_date` - When status was set

### Optional Fields

- `license` - Licensing terms
- `format` - Data format (CSV, JSON, Parquet, etc.)
- `pii_types` - Types of PII when `contains_pii` is true
- `known_biases` - Documented biases
- `bias_mitigation` - Steps to address biases
- `collection_method` - How data was gathered
- `preprocessing_steps` - Transformations applied

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `domain.layer/models/dataset/dataset.model.ts` | Dataset model |
| `domain.layer/enums/dataset.enum.ts` | Status/Type/Classification enums |
| `domain.layer/interfaces/i.dataset.ts` | TypeScript interfaces |
| `utils/dataset.utils.ts` | Database queries |
| `utils/datasetChangeHistory.utils.ts` | Change tracking queries |
| `utils/validations/datasetValidation.utils.ts` | Validation logic |
| `controllers/dataset.ctrl.ts` | HTTP request handlers |
| `routes/dataset.route.ts` | Express routes |
| `database/migrations/20260202000000-create-dataset-tables.js` | Migration |

### Frontend

| File | Purpose |
|------|---------|
| `pages/ModelInventory/index.tsx` | Parent page with Datasets tab |
| `pages/ModelInventory/DatasetTable.tsx` | Dataset table component |
| `pages/ModelInventory/DatasetSummary.tsx` | Status summary cards |
| `components/Modals/NewDataset/index.tsx` | Create/edit modal |
| `domain/interfaces/i.dataset.ts` | TypeScript interfaces |
| `domain/enums/dataset.enum.ts` | Enums |
| `application/repository/dataset.repository.ts` | API client |

## Related Documentation

- [Model Inventory](./models.md)
- [Risk Management](./risk-management.md)
- [Use Cases](./use-cases.md)
- [Evidence Collection](./evidence.md)
