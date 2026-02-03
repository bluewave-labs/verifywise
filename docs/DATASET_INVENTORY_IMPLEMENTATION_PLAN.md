# Dataset Inventory Implementation Plan

**Feature:** Dataset Inventory for EU AI Act Article 10 Compliance
**Branch:** `feat/dataset-inventory`
**Date:** February 2026
**Version:** 1.1 (Revised)

---

## 1. Executive Summary

This document outlines the implementation plan for Dataset Inventory functionality in VerifyWise. This feature addresses a critical gap identified in the OneTrust comparison - VerifyWise currently lacks formal dataset tracking, which is required for EU AI Act Article 10 (Data Governance) compliance.

### Why Dataset Inventory Matters

1. **EU AI Act Article 10** requires high-risk AI providers to document:
   - Training, validation, and testing datasets
   - Data collection processes
   - Data preparation operations (labeling, cleaning)
   - Examination for biases in data
   - Gap identification and mitigation

2. **ISO 42001** requires data lineage tracking and quality documentation

3. **NIST AI RMF** emphasizes understanding data sources and their impact on model behavior

---

## 2. OneTrust Dataset Inventory Analysis

Based on the OneTrust AI Governance documentation analysis:

### 2.1 OneTrust Default Dataset Fields
From the documentation (line 1717):
- **Name** - Dataset identifier
- **Description** - What the dataset contains
- **Organization** - Which org unit owns it
- **Type** - Category of dataset
- **License** - Data licensing terms
- **Function** - Purpose/use of the dataset
- **Owner** - Person responsible

### 2.2 OneTrust Core Features
| Feature | Description |
|---------|-------------|
| **Dataset Creation** | Create dataset records via "Add dataset" button |
| **Dataset Details Management** | Update details in Details tab |
| **Organization Assignment** | Assign to organization hierarchy (defaults to current level) |
| **Custom Attributes** | Dynamic fields via Attribute Manager (text, single-select, multi-select, date, numeric, score, formula) |
| **Workflow Integration** | Assign datasets to approval workflows with stages |
| **Relationships** | Link to Models (training using) and Projects (references) |
| **Risk Aggregation** | Dataset risks roll up to parent Models, Projects, AI Systems |
| **Document Attachments** | Attach files and links |
| **Assessment Linking** | Launch assessments from dataset context |
| **Bulk Import/Export** | CSV-based bulk operations |
| **Saved Views** | Custom filtered views with visibility settings |
| **Activity History** | Track changes on relationships |

### 2.3 OneTrust Relationships
```
Projects → references → Datasets
Models → training using → Datasets
AI Systems → is composed of → Datasets
```

### 2.4 Key OneTrust Capabilities We Should Match
1. Simple core fields (not over-engineered)
2. Custom attributes for flexibility
3. Workflow stages (Not Started → In Progress → Under Review → Completed)
4. Relationship management with activity history
5. Risk flagging and aggregation
6. Document/link attachments
7. Assessment integration

---

## 3. VerifyWise Dataset Inventory Design

### 3.1 Design Principles

**Key Insight from OneTrust:** OneTrust keeps the default fields **simple** (7 fields) and relies on **Custom Attributes** for extensibility. We should follow a similar approach rather than creating 30+ fixed fields.

**VerifyWise Approach:**
1. Start with essential core fields
2. Add EU AI Act Article 10 specific fields that are always relevant
3. Keep optional fields truly optional
4. Follow existing Model Inventory patterns exactly

### 3.2 Core Fields (Aligned with VerifyWise Patterns)

| Field | Type | Required | Description | OneTrust Equivalent |
|-------|------|----------|-------------|---------------------|
| `id` | INTEGER | Auto | Primary key | - |
| `name` | STRING(255) | Yes | Dataset name | Name |
| `description` | TEXT | Yes | Detailed description | Description |
| `version` | STRING(50) | Yes | Dataset version | - |
| `owner` | STRING(255) | Yes | Owner name (string, like Model's approver) | Owner |
| `type` | ENUM | Yes | Training, Validation, Testing, Production, Reference | Type |
| `function` | TEXT | Yes | Purpose/intended use of dataset | Function |
| `source` | STRING(255) | Yes | Data source (Internal, External Vendor, Public, Synthetic) | - |
| `license` | STRING(255) | No | Data license | License |
| `format` | STRING(100) | No | CSV, JSON, Parquet, etc. | - |
| `classification` | ENUM | Yes | Public, Internal, Confidential, Restricted | - |
| `contains_pii` | BOOLEAN | No | PII flag (default: false) | - |
| `pii_types` | TEXT | No | Types of PII if applicable | - |
| `status` | ENUM | Yes | Draft, Active, Deprecated, Archived | Via Workflow |
| `status_date` | DATE | Yes | Status change date | - |
| `known_biases` | TEXT | No | Documented biases (Article 10) | - |
| `bias_mitigation` | TEXT | No | Mitigation steps (Article 10) | - |
| `collection_method` | TEXT | No | How data was collected (Article 10) | - |
| `preprocessing_steps` | TEXT | No | Data preparation steps (Article 10) | - |
| `documentation_data` | JSONB | No | Attached files (like security_assessment_data) | Documents |
| `is_demo` | BOOLEAN | No | Demo data flag | - |
| `created_at` | TIMESTAMP | Auto | Creation timestamp | - |
| `updated_at` | TIMESTAMP | Auto | Last update timestamp | - |

**Total: 22 fields** (reduced from 29 in v1.0)

**Removed Fields (can be added via future custom attributes):**
- `source_url` - Can go in description or documentation
- `size_bytes`, `record_count` - Technical metadata, optional
- `quality_score`, `completeness`, `accuracy` - Requires integration
- `freshness_date` - Can use status_date or description
- `geographic_scope`, `temporal_scope` - Can go in description
- `retention_policy` - Can go in description
- `owner_id` FK - Using string like Model Inventory's `approver`

### 3.3 Enums

```typescript
// Dataset Type - matches EU AI Act Article 10 categories
enum DatasetType {
  TRAINING = "Training",
  VALIDATION = "Validation",
  TESTING = "Testing",
  PRODUCTION = "Production",
  REFERENCE = "Reference"  // Reference/lookup data
}

// Data Classification - standard data classification
enum DataClassification {
  PUBLIC = "Public",
  INTERNAL = "Internal",
  CONFIDENTIAL = "Confidential",
  RESTRICTED = "Restricted"
}

// Dataset Status - mirrors Model Inventory pattern
enum DatasetStatus {
  DRAFT = "Draft",
  ACTIVE = "Active",
  DEPRECATED = "Deprecated",
  ARCHIVED = "Archived"
}
```

### 3.4 Relationships

#### DatasetModelInventory Junction Table
Links datasets to model inventory (many-to-many):
```sql
CREATE TABLE dataset_model_inventories (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  model_inventory_id INTEGER REFERENCES model_inventories(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'trained_on', -- trained_on, validated_on, tested_on
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(dataset_id, model_inventory_id)
);
```

#### DatasetProject Junction Table
Links datasets to projects (many-to-many):
```sql
CREATE TABLE dataset_projects (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(dataset_id, project_id)
);
```

#### DatasetChangeHistory
Tracks field-level changes (matches ModelInventoryChangeHistory pattern):
```sql
CREATE TABLE dataset_change_histories (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL, -- 'created', 'updated', 'deleted'
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_by_user_id INTEGER REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_dataset_change_history_dataset_id ON dataset_change_histories(dataset_id);
CREATE INDEX idx_dataset_change_history_changed_at ON dataset_change_histories(changed_at);
```

---

## 4. Architecture

### 4.1 Backend Structure

```
Servers/
├── domain.layer/
│   ├── models/
│   │   └── dataset/
│   │       ├── dataset.model.ts                    # Main dataset model
│   │       ├── datasetModelInventory.model.ts      # Junction: Dataset ↔ Model
│   │       ├── datasetProject.model.ts             # Junction: Dataset ↔ Project
│   │       └── datasetChangeHistory.model.ts       # Change tracking
│   ├── interfaces/
│   │   └── i.dataset.ts                            # TypeScript interface
│   └── enums/
│       └── dataset.enum.ts                         # Enums (if not using existing pattern)
├── controllers/
│   └── dataset.ctrl.ts                             # CRUD controllers
├── routes/
│   └── dataset.route.ts                            # API routes
├── utils/
│   ├── dataset.utils.ts                            # Database queries
│   └── datasetChangeHistory.utils.ts               # Change tracking utils
└── database/migrations/
    └── 20260202000000-create-dataset-tables.js     # Migration file
```

### 4.2 Frontend Structure

```
Clients/src/
├── domain/
│   ├── interfaces/
│   │   └── i.dataset.ts                            # TypeScript interfaces
│   └── enums/
│       └── dataset.enum.ts                         # Enums
├── presentation/
│   └── pages/
│       └── ModelInventory/
│           ├── index.tsx                           # Add Datasets tab here
│           ├── DatasetTable.tsx                    # Table component
│           ├── DatasetSummary.tsx                  # Summary cards (optional)
│           └── NewDataset/
│               └── index.tsx                       # Create/edit modal
└── application/
    └── repository/
        └── dataset.repository.ts                   # API calls (or add to existing)
```

### 4.3 Navigation Integration

**Decision: Add as sub-tab in Model Inventory**

Reasoning:
1. Model Inventory already has tabs: Models, Model Risks, Evidence Hub, Plugin tabs
2. Datasets are directly related to models (training data)
3. Keeps inventory management consolidated
4. Follows OneTrust's Inventory grouping pattern
5. Can be promoted to standalone page later if needed

URL structure:
- `/model-inventory` - Models tab (default)
- `/model-inventory/model-risks` - Model Risks tab
- `/model-inventory/evidence-hub` - Evidence Hub tab
- `/model-inventory/datasets` - **New Datasets tab**

---

## 5. API Design

### 5.1 Endpoints (Following Model Inventory Pattern)

```
# Dataset CRUD
GET    /datasets                              # getAllDatasets
GET    /datasets/:id                          # getDatasetById
POST   /datasets                              # createDataset
PATCH  /datasets/:id                          # updateDatasetById
DELETE /datasets/:id                          # deleteDatasetById

# Relationship Queries
GET    /datasets/by-model/:modelId            # getDatasetsByModelId
GET    /datasets/by-project/:projectId        # getDatasetsByProjectId

# Change History (Phase 2)
GET    /datasets/:id/history                  # getDatasetChangeHistory
```

### 5.2 Request/Response Examples

**Create Dataset:**
```json
POST /datasets
{
  "name": "Customer Feedback Q4 2025",
  "description": "Customer feedback collected from support tickets and surveys",
  "version": "1.0.0",
  "owner": "Data Team",
  "type": "Training",
  "function": "Training sentiment analysis and topic classification models",
  "source": "Internal",
  "license": "Proprietary",
  "format": "CSV",
  "classification": "Confidential",
  "contains_pii": true,
  "pii_types": "email, name",
  "status": "Active",
  "known_biases": "Over-representation of enterprise customers",
  "bias_mitigation": "Applied stratified sampling",
  "collection_method": "API export from support system",
  "preprocessing_steps": "1. Deduplicated\n2. Anonymized PII\n3. Normalized text",
  "models": [1, 2],
  "projects": [5]
}
```

**Response:**
```json
{
  "id": 42,
  "name": "Customer Feedback Q4 2025",
  "description": "Customer feedback collected from support tickets and surveys",
  "version": "1.0.0",
  "owner": "Data Team",
  "type": "Training",
  "function": "Training sentiment analysis and topic classification models",
  "source": "Internal",
  "license": "Proprietary",
  "format": "CSV",
  "classification": "Confidential",
  "contains_pii": true,
  "pii_types": "email, name",
  "status": "Active",
  "status_date": "2026-02-02",
  "known_biases": "Over-representation of enterprise customers",
  "bias_mitigation": "Applied stratified sampling",
  "collection_method": "API export from support system",
  "preprocessing_steps": "1. Deduplicated\n2. Anonymized PII\n3. Normalized text",
  "documentation_data": [],
  "is_demo": false,
  "models": [1, 2],
  "projects": [5],
  "created_at": "2026-02-02T10:30:00Z",
  "updated_at": "2026-02-02T10:30:00Z"
}
```

---

## 6. UI Design

### 6.1 Summary Cards

| Card | Color | Filter | Icon |
|------|-------|--------|------|
| Active | Green (#13715B) | status = Active | CheckCircle |
| Draft | Blue | status = Draft | Edit |
| Deprecated | Orange | status = Deprecated | Warning |
| Archived | Gray | status = Archived | Archive |
| Total | Default | All | Database |

### 6.2 Table Columns (Default View)

| Column | Width | Sortable | Notes |
|--------|-------|----------|-------|
| Name | 200px | Yes | Primary identifier |
| Version | 80px | Yes | Short string |
| Type | 100px | Yes | Badge/chip |
| Source | 120px | Yes | Text |
| Classification | 120px | Yes | Badge with color |
| PII | 60px | Yes | Yes/No badge |
| Status | 100px | Yes | Badge with color |
| Owner | 150px | Yes | Text |
| Updated | 120px | Yes | Relative date |
| Actions | 80px | No | Edit/Delete |

### 6.3 Filter Options

- **Type:** Training, Validation, Testing, Production, Reference
- **Classification:** Public, Internal, Confidential, Restricted
- **Status:** Draft, Active, Deprecated, Archived
- **Contains PII:** Yes, No
- **Source:** Internal, External Vendor, Public, Synthetic

### 6.4 Modal Fields (Create/Edit)

**Section 1: Basic Information**
- Name* (text input)
- Description* (textarea)
- Version* (text input)
- Owner* (text input)

**Section 2: Classification**
- Type* (dropdown)
- Function* (textarea)
- Source* (dropdown)
- License (text input)
- Format (dropdown with custom option)

**Section 3: Data Privacy**
- Classification* (dropdown)
- Contains PII (toggle)
- PII Types (text input, shown if PII = true)

**Section 4: Bias & Quality (Article 10)**
- Known Biases (textarea)
- Bias Mitigation (textarea)
- Collection Method (textarea)
- Preprocessing Steps (textarea)

**Section 5: Relationships**
- Link to Models (multi-select)
- Link to Projects (multi-select)

**Section 6: Status & Documentation**
- Status* (dropdown)
- Documentation (file upload)

---

## 7. Comparison: OneTrust vs VerifyWise Plan

| Feature | OneTrust | VerifyWise Plan | Notes |
|---------|----------|-----------------|-------|
| Basic CRUD | ✅ | ✅ | Full parity |
| Core Fields | 7 default | 22 core | VW has more built-in for Article 10 |
| Custom Attributes | ✅ Dynamic | ❌ Phase 2+ | OneTrust more flexible |
| Workflow Stages | ✅ Custom | ⚠️ Status field | VW uses simple status enum |
| Model Relationships | ✅ | ✅ | Full parity |
| Project Relationships | ✅ | ✅ | Full parity |
| Risk Aggregation | ✅ | ❌ Phase 3 | Future enhancement |
| Document Attachments | ✅ | ✅ | Via documentation_data JSONB |
| Assessment Linking | ✅ | ❌ Phase 2+ | Future enhancement |
| Bulk Import/Export | ✅ | ❌ Phase 2 | Future enhancement |
| Saved Views | ✅ | ❌ | Not in Model Inventory either |
| Change History | ✅ | ✅ | Full parity |
| Article 10 Fields | ⚠️ Via attributes | ✅ Built-in | VW advantage for compliance |

---

## 8. Implementation Phases

### Phase 1: Core Implementation (This PR)
1. ✅ Database models (dataset.model.ts)
2. ✅ Database migrations
3. ✅ Backend CRUD controllers
4. ✅ Backend routes
5. ✅ Frontend TypeScript interfaces
6. ✅ Frontend Dataset tab in Model Inventory
7. ✅ Dataset table component
8. ✅ Create/Edit modal
9. ✅ Basic filtering and search
10. ✅ Change history tracking

### Phase 2: Enhanced Features (Future PR)
1. Dataset-Model relationship UI improvements
2. Dataset-Project relationship UI
3. Change history viewer
4. Export to CSV
5. Bulk import from CSV
6. Summary cards

### Phase 3: Advanced Features (Future)
1. Dataset Risks (like Model Risks)
2. Assessment integration
3. Risk aggregation to Models
4. Data lineage visualization
5. Quality metrics integration

---

## 9. EU AI Act Article 10 Mapping

| Article 10 Requirement | Dataset Field | Required |
|------------------------|---------------|----------|
| Training data identification | type = "Training" | Yes |
| Validation data identification | type = "Validation" | Yes |
| Testing data identification | type = "Testing" | Yes |
| Data governance practices | collection_method, preprocessing_steps | No |
| Bias examination | known_biases | No |
| Bias mitigation | bias_mitigation | No |
| Data quality measures | (Phase 2) | No |
| PII handling | contains_pii, pii_types, classification | Yes |
| Purpose documentation | function, description | Yes |
| Source documentation | source | Yes |

---

## 10. Files to Create

### Backend (New Files)
```
Servers/domain.layer/models/dataset/dataset.model.ts
Servers/domain.layer/models/dataset/datasetModelInventory.model.ts
Servers/domain.layer/models/dataset/datasetProject.model.ts
Servers/domain.layer/models/dataset/datasetChangeHistory.model.ts
Servers/domain.layer/interfaces/i.dataset.ts
Servers/domain.layer/enums/dataset-status.enum.ts
Servers/domain.layer/enums/dataset-type.enum.ts
Servers/domain.layer/enums/data-classification.enum.ts
Servers/controllers/dataset.ctrl.ts
Servers/routes/dataset.route.ts
Servers/utils/dataset.utils.ts
Servers/utils/datasetChangeHistory.utils.ts
Servers/database/migrations/20260202000000-create-dataset-tables.js
```

### Backend (Modified Files)
```
Servers/index.ts                    # Add dataset routes
```

### Frontend (New Files)
```
Clients/src/domain/interfaces/i.dataset.ts
Clients/src/domain/enums/dataset.enum.ts
Clients/src/presentation/pages/ModelInventory/DatasetTable.tsx
Clients/src/presentation/pages/ModelInventory/NewDataset/index.tsx
```

### Frontend (Modified Files)
```
Clients/src/presentation/pages/ModelInventory/index.tsx  # Add Datasets tab
```

---

## 11. Acceptance Criteria

1. **CRUD Operations:** Users can create, read, update, and delete datasets
2. **Required Fields:** name, description, version, owner, type, function, source, classification, status enforced
3. **Relationships:** Datasets can be linked to models and projects during create/edit
4. **Filtering:** Users can filter by type, classification, status, PII
5. **Search:** Users can search by name, description, owner
6. **Change Tracking:** All changes recorded in change history table
7. **Tenant Isolation:** Data isolated per tenant (schema-based)
8. **UI Consistency:** Follows Model Inventory patterns (table, modal, layout)
9. **Article 10 Support:** All EU AI Act Article 10 relevant fields available

---

## 12. Open Questions

1. **Workflow vs Status:** Should we implement full workflow stages (like OneTrust) or keep simple status enum?
   - **Decision:** Start with status enum for Phase 1, matches current Model Inventory pattern

2. **Standalone page vs Tab:** Should datasets be a standalone page or tab within Model Inventory?
   - **Decision:** Tab within Model Inventory for Phase 1, can promote later

3. **Risk integration:** Should datasets have their own risks (like Model Risks)?
   - **Decision:** Phase 3 feature, not in initial implementation

---

*Document Version: 1.1*
*Last Updated: February 2026*
*Changes from v1.0: Simplified field list, aligned with OneTrust analysis, fixed owner field type, added comparison table*
