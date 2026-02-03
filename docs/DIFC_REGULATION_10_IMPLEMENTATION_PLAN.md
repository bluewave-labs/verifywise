# DIFC Regulation 10 Implementation Plan

This document outlines the comprehensive implementation plan for supporting DIFC (Dubai International Financial Centre) Regulation 10 in VerifyWise.

---

## Regulatory Background

DIFC Regulation 10 on "Processing Personal Data through Autonomous and Semi-Autonomous Systems" was enacted on **September 1, 2023**, supplementing the DIFC Data Protection Law No. 5 of 2020. It is the first enacted regulation in the MEASA region governing AI/ML systems processing personal data.

**Key regulatory concepts:**
- **System**: Any machine-based system operating autonomously or semi-autonomously, capable of processing personal data for human-defined purposes or purposes the system defines within human-set parameters
- **Deployer**: Entity under whose authority or for whose benefit the System operates (equivalent to Data Controller)
- **Operator**: Provider that operates or supervises a System on a Deployer's direction (equivalent to Data Processor)
- **ASO (Autonomous Systems Officer)**: New role with substantially similar status, competencies, and tasks to a DPO

**Enforcement timeline**: Full enforcement planned from **January 2026**, giving DIFC firms time to assess AI systems, achieve compliance, and obtain certification.

**Sources**: [DIFC Commissioner of Data Protection](https://www.difc.com/business/registrars-and-commissioners/commissioner-of-data-protection/regulation-10), [Clyde & Co Analysis](https://www.clydeco.com/en/insights/2023/09/difc-enacts-landmark-regulation-autonomous-systems), [Mayer Brown Analysis](https://www.mayerbrown.com/en/insights/publications/2026/01/ai-regulation-in-the-difc-personal-data-processed-through-autonomous-and-semi-autonomous-systems)

---

## Executive Summary

DIFC Regulation 10 governs AI processing of personal data within the Dubai International Financial Centre. To support this regulation, VerifyWise needs to add **12 new capabilities** organized into **7 major feature modules**:

| Module | New Features | Priority |
|--------|--------------|----------|
| DIFC Framework | Control library, framework structure (85 controls across 7 categories) | P0 |
| AI DPIA Module | DPIA workflow, risk assessment, necessity/proportionality analysis | P0 |
| ASO Role & Workflows | New role type, dashboards, approval gates for high-risk systems | P0 |
| AI System Register | Deployer/Operator register, use cases, lawful bases, export safeguards | P0 |
| Notice Management | Notice templates per Reg 10 requirements, versioning, export | P1 |
| Certification Module | Commissioner certification lifecycle, evidence bundling | P1 |
| AI Complaints | Data subject challenge intake, investigation, non-technical explanation | P1 |

### Regulation 10 Five Design Principles

All system implementations must demonstrate compliance with these principles:

| Principle | Requirement |
|-----------|-------------|
| **Ethical** | Algorithmic decisions should be unbiased |
| **Fair** | Systems treat individuals equally regardless of protected characteristics |
| **Transparent** | Processing explained in non-technical terms with supporting evidence |
| **Secure** | Data protection against breaches causing harm |
| **Accountable** | Mechanisms ensuring responsibility; internal governance frameworks |

---

## Part 1: Backend Implementation

### 1.1 Database Schema Changes

#### New Tables Required

```sql
-- 1. DIFC-specific fields for existing models
ALTER TABLE model_inventory ADD COLUMN IF NOT EXISTS
  difc_role VARCHAR(50),                    -- 'deployer' | 'operator' | 'both'
  difc_jurisdiction_scope VARCHAR(50),      -- 'in_difc' | 'from_difc' | 'not_applicable'
  difc_high_risk BOOLEAN DEFAULT false,
  difc_commercial_use BOOLEAN DEFAULT false,
  lawful_basis VARCHAR(100),
  purpose_statement TEXT,
  retention_policy TEXT,
  certification_status VARCHAR(50),         -- 'none' | 'draft' | 'submitted' | 'approved' | 'expired'
  certification_expiry DATE,
  aso_reviewer_id INTEGER REFERENCES users(id),
  dpia_required BOOLEAN DEFAULT false,
  dpia_completed BOOLEAN DEFAULT false;

-- 2. AI DPIA Table
CREATE TABLE ai_dpias (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  model_inventory_id INTEGER REFERENCES model_inventory(id),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',       -- 'draft' | 'in_review' | 'approved' | 'rejected'

  -- Questionnaire responses (JSONB for flexibility)
  lawfulness_assessment JSONB,
  fairness_assessment JSONB,
  necessity_assessment JSONB,
  proportionality_assessment JSONB,
  data_subject_rights JSONB,
  cross_border_transfers JSONB,
  bias_assessment JSONB,

  -- Scoring
  overall_risk_score INTEGER,
  risk_level VARCHAR(50),                   -- 'low' | 'medium' | 'high' | 'very_high'

  -- Approval workflow
  prepared_by INTEGER REFERENCES users(id),
  reviewed_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),  -- Must be ASO for high-risk
  approval_date TIMESTAMP,
  approval_notes TEXT,

  -- Metadata
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant VARCHAR(50)
);

-- 3. AI Notices Table (per Regulation 10 transparency requirements)
CREATE TABLE ai_notices (
  id SERIAL PRIMARY KEY,
  model_inventory_id INTEGER REFERENCES model_inventory(id),
  project_id INTEGER REFERENCES projects(id),

  title VARCHAR(255) NOT NULL,
  version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft',       -- 'draft' | 'legal_review' | 'approved' | 'published' | 'archived'

  -- Required Notice Content (per Regulation 10)
  underlying_technology TEXT,               -- Description of the AI/ML technology used
  privacy_impact TEXT,                      -- How system may impact privacy rights
  human_defined_purposes TEXT,              -- Human-defined purposes for processing
  design_principles TEXT,                   -- Principles governing system design
  processing_limits TEXT,                   -- Human-defined limits on processing
  system_outputs TEXT,                      -- Description of outputs generated
  self_defined_purposes BOOLEAN DEFAULT false, -- Whether system can define additional purposes
  self_defined_purposes_constraints TEXT,   -- If yes, what constraints apply
  rights_impact TEXT,                       -- Impact on exercise of data subject rights (e.g., erasure limitations)
  design_safeguards TEXT,                   -- Built-in safeguards for compliance
  codes_certifications TEXT,                -- OECD, NIST, UNESCO, Dubai Digital Authority, etc.
  certification_reference TEXT,             -- Link to certification status
  data_subject_rights TEXT,                 -- How to exercise rights
  contact_information TEXT,                 -- Contact for queries

  -- Full notice content (rich text - combined)
  full_content TEXT,

  -- Export formats
  export_text TEXT,
  export_json JSONB,

  -- Review workflow
  legal_reviewer_id INTEGER REFERENCES users(id),
  legal_review_date TIMESTAMP,
  legal_review_notes TEXT,

  published_date TIMESTAMP,
  effective_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant VARCHAR(50)
);

-- 4. AI System Register Table (per Regulation 10 register requirements)
-- Deployers and Operators must maintain and provide this register
CREATE TABLE ai_system_register (
  id SERIAL PRIMARY KEY,
  model_inventory_id INTEGER REFERENCES model_inventory(id),
  project_id INTEGER REFERENCES projects(id),

  -- Use Case Information
  use_case_name VARCHAR(255) NOT NULL,
  use_case_description TEXT,
  processing_activities TEXT,               -- Detailed description of processing activities

  -- Necessity and Proportionality
  necessity_assessment TEXT,                -- Why is this processing necessary?
  proportionality_assessment TEXT,          -- Is processing proportionate to purpose?

  -- Data Subject Access
  access_mechanisms TEXT,                   -- How can data subjects access their data?
  rights_exercise_process TEXT,             -- Process for exercising rights

  -- Automated Decision-Making
  uses_automated_decisions BOOLEAN DEFAULT false,
  automated_decision_scope TEXT,            -- Scope of automated decisions
  human_review_available BOOLEAN DEFAULT true,

  -- Third-Party Data Sharing
  third_parties JSONB,                      -- Array of {name, purpose, lawful_basis, location}
  requesting_authorities JSONB,             -- Law enforcement/regulatory authorities
  lawful_bases_for_sharing TEXT,

  -- Cross-Border Transfers
  data_export_locations TEXT,               -- Countries/regions where data is transferred
  export_safeguards TEXT,                   -- Safeguards for international transfers

  -- Version Control
  version INTEGER DEFAULT 1,
  last_reviewed_date DATE,
  next_review_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant VARCHAR(50)
);

-- 6. AI Certifications Table (Commissioner certification per Regulation 10)
CREATE TABLE ai_certifications (
  id SERIAL PRIMARY KEY,
  model_inventory_id INTEGER REFERENCES model_inventory(id),

  -- Note: Certification is system-specific, not entity-specific
  -- Required for commercial use of high-risk processing
  scheme_name VARCHAR(100) DEFAULT 'DIFC Regulation 10',
  application_reference VARCHAR(100),

  status VARCHAR(50) DEFAULT 'draft',       -- 'draft' | 'preparing' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired'

  -- Application package
  application_date DATE,
  submission_date DATE,
  assessment_date DATE,
  approval_date DATE,
  expiry_date DATE,

  -- Evidence bundle (references)
  evidence_bundle JSONB,                    -- Links to controls, tests, DPIA, policies

  -- Commissioner response
  commissioner_reference VARCHAR(100),
  commissioner_notes TEXT,
  conditions TEXT,

  renewal_reminder_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant VARCHAR(50)
);

-- 7. AI Complaints Table (Data subject challenge mechanism per Regulation 10)
CREATE TABLE ai_complaints (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  model_inventory_id INTEGER REFERENCES model_inventory(id),

  -- Complaint details
  reference_number VARCHAR(50) UNIQUE,
  source VARCHAR(50),                       -- 'data_subject' | 'regulator' | 'internal' | 'third_party'
  data_subject_id VARCHAR(255),             -- Anonymized or reference

  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  decision_instance_reference VARCHAR(255), -- Reference to the AI decision being challenged

  status VARCHAR(50) DEFAULT 'received',    -- 'received' | 'investigating' | 'root_cause_identified' | 'remediation' | 'closed' | 'escalated'
  priority VARCHAR(50) DEFAULT 'medium',    -- 'low' | 'medium' | 'high' | 'critical'

  -- Investigation
  investigator_id INTEGER REFERENCES users(id),
  investigation_start_date TIMESTAMP,
  root_cause_analysis TEXT,
  findings TEXT,

  -- Remediation
  remediation_plan TEXT,
  remediation_tasks JSONB,                  -- Array of task references
  remediation_deadline DATE,

  -- Closure
  resolution TEXT,
  closed_by INTEGER REFERENCES users(id),   -- Must be ASO
  closed_date TIMESTAMP,
  closure_notes TEXT,

  -- Data subject communication
  acknowledgment_sent BOOLEAN DEFAULT false,
  acknowledgment_date TIMESTAMP,
  resolution_communicated BOOLEAN DEFAULT false,
  resolution_communication_date TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant VARCHAR(50)
);

-- 8. Evidence Profiles Table (Evidentiary capacity per Regulation 10)
-- Must provide non-technical explanation with supporting evidence
CREATE TABLE evidence_profiles (
  id SERIAL PRIMARY KEY,
  model_inventory_id INTEGER REFERENCES model_inventory(id),

  -- Non-technical explanation
  system_description TEXT,                  -- Plain language description
  how_it_works TEXT,
  data_used TEXT,
  decision_factors TEXT,
  impact_on_individuals TEXT,
  limitations TEXT,
  human_oversight TEXT,

  -- Technical artifacts (references)
  test_results JSONB,                       -- Links to evaluation results
  change_history_reference TEXT,
  audit_logs_reference TEXT,
  model_cards JSONB,

  -- Export status
  data_subject_report_generated_at TIMESTAMP,
  regulator_report_generated_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant VARCHAR(50)
);

-- 9. Intervention Rules Table (Human intervention per Regulation 10)
-- Algorithms must trigger human intervention for discriminatory outcomes or unjust bias
CREATE TABLE intervention_rules (
  id SERIAL PRIMARY KEY,
  model_inventory_id INTEGER REFERENCES model_inventory(id),

  name VARCHAR(255) NOT NULL,
  description TEXT,

  rule_type VARCHAR(50),                    -- 'bias_threshold' | 'anomaly_score' | 'confidence_threshold' | 'law_enforcement' | 'custom'

  -- Rule configuration
  metric_name VARCHAR(100),
  threshold_value DECIMAL,
  comparison_operator VARCHAR(20),          -- 'greater_than' | 'less_than' | 'equals' | 'between'
  threshold_value_upper DECIMAL,            -- For 'between' operator

  -- Actions
  action_type VARCHAR(50),                  -- 'alert' | 'block' | 'escalate' | 'log_only'
  alert_recipients JSONB,                   -- User IDs to notify
  escalate_to_aso BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  triggered_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant VARCHAR(50)
);

-- 10. Intervention Events Log
CREATE TABLE intervention_events (
  id SERIAL PRIMARY KEY,
  intervention_rule_id INTEGER REFERENCES intervention_rules(id),
  model_inventory_id INTEGER REFERENCES model_inventory(id),

  triggered_at TIMESTAMP DEFAULT NOW(),
  metric_value DECIMAL,

  action_taken VARCHAR(50),
  aso_reviewed BOOLEAN DEFAULT false,
  aso_review_date TIMESTAMP,
  aso_reviewer_id INTEGER REFERENCES users(id),
  aso_notes TEXT,

  tenant VARCHAR(50)
);

-- 11. Extend Roles for ASO (Autonomous Systems Officer per Regulation 10)
-- ASO has substantially similar status, competencies, and tasks to a DPO
ALTER TABLE roles ADD COLUMN IF NOT EXISTS
  is_aso BOOLEAN DEFAULT false,
  aso_permissions JSONB;                    -- Specific ASO permissions

-- 12. DIFC Policy Templates Table
CREATE TABLE difc_policy_templates (
  id SERIAL PRIMARY KEY,

  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100),               -- 'ai_use_policy' | 'aso_charter' | 'dpia_standard' | 'complaint_sop' | 'notice_standard'

  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,

  linked_controls JSONB,                    -- Array of control IDs this policy relates to

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 13. Policy Acknowledgments
CREATE TABLE policy_acknowledgments (
  id SERIAL PRIMARY KEY,
  policy_template_id INTEGER REFERENCES difc_policy_templates(id),
  user_id INTEGER REFERENCES users(id),

  acknowledged_at TIMESTAMP DEFAULT NOW(),
  acknowledgment_method VARCHAR(50),        -- 'checkbox' | 'signature' | 'training_completion'

  tenant VARCHAR(50)
);
```

### 1.2 New Backend Models

Create the following Sequelize models in `/Servers/domain.layer/models/`:

```
models/
├── aiDpia/
│   └── aiDpia.model.ts
├── aiNotice/
│   └── aiNotice.model.ts
├── aiCertification/
│   └── aiCertification.model.ts
├── aiComplaint/
│   └── aiComplaint.model.ts
├── evidenceProfile/
│   └── evidenceProfile.model.ts
├── interventionRule/
│   └── interventionRule.model.ts
├── interventionEvent/
│   └── interventionEvent.model.ts
├── difcPolicyTemplate/
│   └── difcPolicyTemplate.model.ts
└── policyAcknowledgment/
    └── policyAcknowledgment.model.ts
```

### 1.3 New API Routes

```
/api/difc/
├── dpias/
│   ├── GET /                               # List all DPIAs
│   ├── GET /:id                            # Get DPIA details
│   ├── POST /                              # Create new DPIA
│   ├── PUT /:id                            # Update DPIA
│   ├── POST /:id/submit-for-review         # Submit for ASO review
│   ├── POST /:id/approve                   # ASO approval
│   └── GET /:id/export                     # Export DPIA report
│
├── notices/
│   ├── GET /                               # List all notices
│   ├── GET /:id                            # Get notice details
│   ├── POST /                              # Create new notice
│   ├── PUT /:id                            # Update notice
│   ├── POST /:id/submit-legal-review       # Submit for legal review
│   ├── POST /:id/publish                   # Publish notice
│   ├── GET /:id/export/text                # Export as text
│   └── GET /:id/export/json                # Export as JSON
│
├── certifications/
│   ├── GET /                               # List all certifications
│   ├── GET /:id                            # Get certification details
│   ├── POST /                              # Start certification process
│   ├── PUT /:id                            # Update certification
│   ├── POST /:id/build-evidence-pack       # Generate evidence bundle
│   ├── POST /:id/submit                    # Submit to commissioner
│   └── GET /:id/evidence-pack              # Download evidence pack
│
├── complaints/
│   ├── GET /                               # List all complaints
│   ├── GET /:id                            # Get complaint details
│   ├── POST /                              # Log new complaint
│   ├── PUT /:id                            # Update complaint
│   ├── POST /:id/start-investigation       # Begin investigation
│   ├── POST /:id/close                     # Close complaint (ASO only)
│   └── GET /stats                          # Complaint statistics
│
├── evidence-profiles/
│   ├── GET /:modelInventoryId              # Get evidence profile
│   ├── PUT /:modelInventoryId              # Update evidence profile
│   ├── GET /:id/data-subject-report        # Generate data subject report
│   └── GET /:id/regulator-report           # Generate regulator report
│
├── intervention-rules/
│   ├── GET /                               # List all rules
│   ├── GET /:id                            # Get rule details
│   ├── POST /                              # Create rule
│   ├── PUT /:id                            # Update rule
│   ├── DELETE /:id                         # Delete rule
│   └── GET /:modelInventoryId/events       # Get triggered events
│
├── register/
│   ├── GET /                               # Get DIFC AI Register view (all systems in scope)
│   ├── GET /:modelInventoryId              # Get register entry for specific system
│   ├── POST /                              # Create register entry
│   ├── PUT /:id                            # Update register entry
│   ├── GET /export                         # Export register for Commissioner inspection
│   └── GET /:id/export                     # Export individual system register
│
├── aso/
│   ├── GET /dashboard                      # ASO dashboard data
│   ├── GET /pending-approvals              # Items awaiting ASO approval
│   ├── GET /high-risk-systems              # High-risk systems overview
│   └── GET /upcoming-renewals              # Certification renewals
│
└── policies/
    ├── GET /templates                      # List policy templates
    ├── GET /templates/:id                  # Get template details
    ├── POST /acknowledge/:id               # Acknowledge policy
    └── GET /acknowledgments                # List acknowledgments
```

### 1.4 ASO Role Implementation

Per Regulation 10, the ASO has "substantially similar status, competencies and tasks to a DPO" with a focus on:
- Governance and compliance monitoring
- DPIA review and approval
- Risk review with senior management
- Recommendations for accountability and compliance

Extend the existing RBAC system:

```typescript
// New role: ASO (Autonomous Systems Officer)
// Role ID: 5 (after existing Admin=1, Reviewer=2, Editor=3, Auditor=4)

const ASO_PERMISSIONS = {
  // Core ASO responsibilities (per Regulation 10)
  approve_high_risk_systems: true,          // Gate for production deployment
  approve_dpias: true,                       // Required for high-risk processing
  review_notices: true,                      // Transparency compliance
  close_complaints: true,                    // Data subject challenge resolution
  view_aso_dashboard: true,                  // Oversight dashboard
  manage_certifications: true,               // Commissioner certification lifecycle
  review_intervention_events: true,          // Human intervention oversight

  // Governance responsibilities
  monitor_compliance: true,                  // Overall Regulation 10 compliance
  review_registers: true,                    // AI System Register oversight
  recommend_to_management: true,             // Risk escalation path
  cooperate_with_commissioner: true,         // Regulatory liaison

  // Inherited permissions (from Admin/Reviewer)
  view_all_systems: true,
  view_all_projects: true,
  view_audit_logs: true,
  export_reports: true,
};
```

### 1.5 DIFC Framework Structure

Create `/Servers/structures/DIFC-Regulation-10/`:

```
DIFC-Regulation-10/
├── framework.config.ts                     # Framework metadata
├── assessment-tracker/
│   ├── topics.struct.ts
│   └── subtopics/
│       ├── 01-scope-and-applicability.ts
│       ├── 02-ai-processing-register.ts
│       ├── 03-aso-requirements.ts
│       ├── 04-high-risk-classification.ts
│       ├── 05-dpia-requirements.ts
│       ├── 06-notices-transparency.ts
│       ├── 07-certification.ts
│       ├── 08-evidentiary-capacity.ts
│       ├── 09-data-subject-rights.ts
│       ├── 10-complaints-challenges.ts
│       ├── 11-lawful-basis.ts
│       └── 12-human-intervention.ts
└── compliance-tracker/
    ├── controlCategories.struct.ts
    └── controls/
        ├── 01-governance-accountability.ts
        ├── 02-risk-assessment.ts
        ├── 03-transparency.ts
        ├── 04-data-protection.ts
        ├── 05-human-oversight.ts
        ├── 06-technical-measures.ts
        └── 07-record-keeping.ts
```

### 1.6 High-Risk Processing Gates

Per Regulation 10, commercial use of Systems for high-risk processing is **prohibited** unless:
1. Commissioner has established audit/certification requirements
2. System is compliant with all such requirements
3. Processing is solely for human-defined or human-approved purposes
4. Deployer/Operator has appointed an ASO

Implement automatic enforcement for high-risk + commercial systems:

```typescript
// Middleware for production deployment gate (per Regulation 10 high-risk requirements)
const validateDIFCProductionGate = async (req, res, next) => {
  const { modelInventoryId } = req.params;
  const model = await ModelInventory.findByPk(modelInventoryId);

  // Only applies to DIFC-scoped, high-risk, commercial systems
  if (model.difc_jurisdiction_scope !== 'not_applicable' &&
      model.difc_high_risk &&
      model.difc_commercial_use) {

    const gates = {
      // Gate 1: Commissioner certification requirements satisfied
      certification_valid: model.certification_status === 'approved' &&
                          new Date(model.certification_expiry) > new Date(),

      // Gate 2: System processes only for human-defined purposes
      human_defined_purposes_only: !model.self_defined_purposes_enabled ||
                                    model.self_defined_purposes_constraints_approved,

      // Gate 3: ASO appointed and active
      aso_appointed: await hasActiveASO(modelInventoryId),

      // Gate 4: DPIA completed (for high-risk processing)
      dpia_completed: model.dpia_completed,

      // Gate 5: Register entry complete
      register_complete: await hasCompleteRegisterEntry(modelInventoryId),

      // Gate 6: Notice published
      notice_published: await hasPublishedNotice(modelInventoryId),

      // Gate 7: Evidence profile ready for data subject requests
      evidence_profile_complete: await hasCompleteEvidenceProfile(modelInventoryId),
    };

    const failedGates = Object.entries(gates)
      .filter(([_, passed]) => !passed)
      .map(([gate]) => gate);

    if (failedGates.length > 0) {
      return res.status(403).json({
        error: 'DIFC Regulation 10 high-risk gates not satisfied',
        failedGates,
        message: 'Commercial use of high-risk AI processing is prohibited until all Regulation 10 requirements are met'
      });
    }
  }

  next();
};
```

---

## Part 2: Frontend Implementation

### 2.1 UI Placement Strategy

DIFC Regulation 10 features will be integrated into VerifyWise following the **existing framework architecture pattern**. This ensures consistency with how ISO 42001, ISO 27001, and NIST AI RMF are currently organized.

#### Current Framework Structure

The existing `/framework` page (`/Clients/src/presentation/pages/Framework/`) uses:
- **Framework selector**: Radio buttons to switch between frameworks
- **Tabbed interface**: Each framework has its own tabs (e.g., NIST has Govern/Map/Measure/Manage)
- **localStorage persistence**: Selected framework and tab saved per user

#### DIFC Integration Approach

DIFC Regulation 10 will be added as **a new selectable framework** within the existing "Organizational View" (`/framework`) page:

```
/framework (Organizational View)
├── Framework Selector
│   ├── ○ ISO 42001
│   ├── ○ ISO 27001
│   ├── ○ NIST AI RMF
│   └── ● DIFC Regulation 10  ← NEW
│
└── When DIFC selected, show tabs:
    ├── Dashboard       - DIFC compliance overview
    ├── AI Register     - All AI systems in DIFC scope
    ├── DPIAs           - Data Protection Impact Assessments
    ├── Notices         - Transparency notice management
    ├── Certifications  - Certification lifecycle tracking
    ├── Complaints      - AI decision complaints handling
    ├── Evidence        - Evidence profiles for explainability
    ├── Interventions   - Human-in-the-loop rules
    └── Controls        - DIFC-specific compliance controls
```

This approach:
- ✅ Maintains consistency with existing framework patterns
- ✅ Leverages existing tab persistence (localStorage)
- ✅ Allows users to compare DIFC alongside other frameworks
- ✅ Reduces UI restructuring effort
- ✅ Uses familiar navigation patterns

### 2.2 New Page Structure

```
/Clients/src/presentation/pages/Framework/
├── DIFC-Regulation-10/                     # NEW: DIFC framework pages
│   ├── index.tsx                           # Tab router for DIFC sections
│   ├── Dashboard/
│   │   └── index.tsx                       # DIFC compliance dashboard
│   ├── Register/
│   │   ├── index.tsx                       # AI Register view
│   │   └── RegisterExport.tsx              # Export functionality
│   ├── DPIA/
│   │   ├── index.tsx                       # DPIA list
│   │   ├── DPIAForm.tsx                    # DPIA questionnaire
│   │   ├── DPIAReview.tsx                  # ASO review view
│   │   └── DPIAReport.tsx                  # DPIA report export
│   ├── Notices/
│   │   ├── index.tsx                       # Notice list
│   │   ├── NoticeEditor.tsx                # Notice creation/editing
│   │   ├── NoticePreview.tsx               # Preview notice
│   │   └── NoticeExport.tsx                # Export options
│   ├── Certifications/
│   │   ├── index.tsx                       # Certification list
│   │   ├── CertificationForm.tsx           # Certification application
│   │   └── EvidencePack.tsx                # Evidence bundle builder
│   ├── Complaints/
│   │   ├── index.tsx                       # Complaint list
│   │   ├── ComplaintForm.tsx               # New complaint intake
│   │   ├── ComplaintDetail.tsx             # Investigation view
│   │   └── ComplaintStats.tsx              # Statistics dashboard
│   ├── Evidence/
│   │   ├── index.tsx                       # Profile list
│   │   ├── ProfileEditor.tsx               # Edit evidence profile
│   │   └── ReportGenerator.tsx             # Generate reports
│   ├── Interventions/
│   │   ├── index.tsx                       # Rules list
│   │   ├── RuleEditor.tsx                  # Create/edit rules
│   │   └── EventsLog.tsx                   # Triggered events
│   └── Controls/
│       └── index.tsx                       # DIFC controls (similar to ISO clauses)
│
├── ISO27001/                               # Existing
├── ISO42001/                               # Existing
├── NIST-AI-RMF/                            # Existing
└── index.tsx                               # Main router - needs DIFC additions
```

### 2.3 Framework Index Updates

The main framework router (`/Clients/src/presentation/pages/Framework/index.tsx`) needs these changes:

```typescript
// 1. Add DIFC to framework filtering logic (around line 227-237)
const showDIFC = projectFrameworks.some(f => f.framework_id === 5); // DIFC = ID 5

// 2. Add to framework tabs array (around line 270)
const frameworkTabs = [
  { id: 'iso42001', label: 'ISO 42001', frameworkId: 2 },
  { id: 'iso27001', label: 'ISO 27001', frameworkId: 3 },
  { id: 'nist-ai-rmf', label: 'NIST AI RMF', frameworkId: 4 },
  { id: 'difc-regulation-10', label: 'DIFC Regulation 10', frameworkId: 5 }, // NEW
];

// 3. Add localStorage key for DIFC tab persistence
const DIFC_TAB_KEY = 'verifywise_difc_regulation_10_tab';
// Tab options: 'dashboard' | 'register' | 'dpias' | 'notices' |
//              'certifications' | 'complaints' | 'evidence' | 'interventions' | 'controls'

// 4. Add to renderFrameworkContent() (around line 614-887)
case 'difc-regulation-10':
  return <DIFCRegulation10Content selectedTab={selectedDIFCTab} />;
```

### 2.4 ASO Dashboard (Separate Page)

For ASO users, create a dedicated dashboard accessible from the sidebar:

```
/Clients/src/presentation/pages/
└── ASODashboard/                           # NEW: ASO-specific views
    ├── index.tsx                           # ASO main dashboard
    ├── PendingApprovals.tsx                # Items awaiting ASO approval
    ├── HighRiskSystems.tsx                 # High-risk systems overview
    ├── Renewals.tsx                        # Upcoming certification renewals
    └── ComplaintsSummary.tsx               # Open complaints summary
```

This appears as a sidebar item **only for users with ASO role**:

```
Sidebar (for ASO users):
├── Dashboard
├── Tasks
├── DISCOVERY
│   ├── Use Cases
│   ├── Organizational View      ← DIFC is here with other frameworks
│   ├── Vendors
│   └── Model Inventory
├── ASSURANCE
│   ├── Risk Management
│   ├── ASO Dashboard ← NEW (visible only to ASO role)
│   ├── Training Registry
│   ...
```

### 2.5 Model Inventory DIFC Fields

Add DIFC-specific fields to the Model Inventory detail page:

```
/Clients/src/presentation/pages/ModelInventory/
└── DIFCFields/                             # NEW: DIFC field components
    └── index.tsx                           # DIFC jurisdiction, role, high-risk toggle
```

### 2.6 Routing Configuration

Update `/Clients/src/application/config/routes.tsx`:

```typescript
// Framework route already exists - DIFC tabs handled internally
// Add ASO Dashboard route (conditional on ASO role)
{
  path: '/aso-dashboard',
  element: <ASODashboard />,
  requiredRole: 'aso', // Only visible to ASO users
}
```

### 2.7 Sidebar Update

Update `/Clients/src/presentation/components/Sidebar/index.tsx`:

```typescript
// Add ASO Dashboard to ASSURANCE section (around line 120)
// Conditional: only show if user has ASO role
{
  path: '/aso-dashboard',
  icon: <ShieldCheckIcon />,
  label: 'ASO Dashboard',
  visible: user.is_aso, // Only for ASO users
}
```

### 2.8 Navigation Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DIFC Regulation 10 Navigation                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Entry Point 1: Organizational View (All Users)                              │
│  ─────────────────────────────────────────────────                           │
│  Sidebar → "Organizational View" → /framework                                │
│           └── Select "DIFC Regulation 10" from framework list                │
│               └── Access all DIFC tabs: Dashboard, Register, DPIAs, etc.     │
│                                                                              │
│  Entry Point 2: ASO Dashboard (ASO Role Only)                                │
│  ─────────────────────────────────────────────────────                       │
│  Sidebar → "ASO Dashboard" → /aso-dashboard                                  │
│           └── Quick access to: Pending Approvals, High-Risk, Renewals        │
│               └── Deep links into DIFC tabs for specific actions             │
│                                                                              │
│  Entry Point 3: Model Inventory (All Users)                                  │
│  ─────────────────────────────────────────────────────                       │
│  Sidebar → "Model Inventory" → /model-inventory                              │
│           └── View/Edit model → DIFC section with jurisdiction fields        │
│               └── Links to related DPIAs, Notices, Certifications            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Frontend Mockups

### Mockup 1: DIFC Framework View (within Organizational View)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Organizational View                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Select Framework:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ○ ISO 42001    ○ ISO 27001    ○ NIST AI RMF    ● DIFC Regulation 10     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [Dashboard] [AI Register] [DPIAs] [Notices] [Certifications]            │   │
│  │ [Complaints] [Evidence] [Interventions] [Controls]                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐       │
│  │  Systems in Scope   │ │   High-Risk Count   │ │  Pending DPIAs      │       │
│  │        12           │ │         4           │ │         3           │       │
│  │  ↑ 2 from last mo   │ │  ● Requires action  │ │  Awaiting review    │       │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘       │
│                                                                                 │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐       │
│  │  Active Complaints  │ │  Cert. Expiring     │ │  Compliance Score   │       │
│  │         2           │ │    1 (30 days)      │ │        78%          │       │
│  │  ⚠ 1 critical       │ │  ⚠ Renewal needed   │ │  ████████░░ Good    │       │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘       │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Compliance Status by Requirement                                         │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  AI Register              ████████████████████████░░░░░  85%  ✓ On track │   │
│  │  DPIA Completeness        ████████████████████░░░░░░░░░  67%  ⚠ Needs    │   │
│  │  Notice Deployment        ████████████████████████████░  92%  ✓ On track │   │
│  │  Certification Status     ████████████░░░░░░░░░░░░░░░░░  42%  ⚠ At risk  │   │
│  │  ASO Oversight            ████████████████████████████░  90%  ✓ On track │   │
│  │  Evidence Profiles        ████████████████░░░░░░░░░░░░░  58%  ⚠ Needs    │   │
│  │  Complaint Resolution     ████████████████████████████░  95%  ✓ On track │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌───────────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │ Recent Activity                    │  │ Upcoming Deadlines                │  │
│  ├───────────────────────────────────┤  ├───────────────────────────────────┤  │
│  │ ● DPIA submitted for "Credit AI"  │  │ ⏰ Jan 30 - Cert renewal: Fraud   │  │
│  │   Today at 2:34 PM                │  │            Detection System        │  │
│  │                                   │  │                                    │  │
│  │ ● Complaint #C-2024-003 resolved  │  │ ⏰ Feb 15 - DPIA due: Customer     │  │
│  │   Yesterday at 4:12 PM            │  │            Segmentation AI         │  │
│  │                                   │  │                                    │  │
│  │ ● Notice v2.1 published for       │  │ ⏰ Feb 28 - Notice review:         │  │
│  │   "Loan Recommendation AI"        │  │            Risk Assessment AI      │  │
│  │   Jan 23 at 10:00 AM              │  │                                    │  │
│  └───────────────────────────────────┘  └───────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mockup 2: AI Register Tab

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Organizational View › DIFC Regulation 10 › AI Register                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search systems...                    [Filters ▼]  [Export Register]   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Showing 12 AI Systems in DIFC scope                                            │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ System Name          │ Role     │ High-Risk │ Status    │ DPIA │ Cert   │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Credit Scoring AI    │ Deployer │ ● Yes     │ Production│ ✓    │ ✓      │   │
│  │ ├─ Data: Financial, Personal ID                                          │   │
│  │ ├─ Purpose: Credit risk assessment                                        │   │
│  │ ├─ Lawful basis: Legitimate interest                                      │   │
│  │ └─ ASO: Sarah Johnson                                                     │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Fraud Detection      │ Operator │ ● Yes     │ Production│ ✓    │ ⏰ 30d │   │
│  │ ├─ Data: Transaction, Behavioral                                          │   │
│  │ ├─ Purpose: Fraud prevention                                              │   │
│  │ ├─ Lawful basis: Legal obligation                                         │   │
│  │ └─ ASO: Sarah Johnson                                                     │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Customer Chatbot     │ Deployer │ ○ No      │ Production│ N/A  │ N/A    │   │
│  │ ├─ Data: Query text only                                                  │   │
│  │ ├─ Purpose: Customer support                                              │   │
│  │ ├─ Lawful basis: Contract performance                                     │   │
│  │ └─ ASO: Not required                                                      │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Loan Recommendation  │ Both     │ ● Yes     │ Testing   │ ⚠    │ ○      │   │
│  │ ├─ Data: Financial, Employment                                            │   │
│  │ ├─ Purpose: Loan product recommendation                                   │   │
│  │ ├─ Lawful basis: Consent                                                  │   │
│  │ └─ ASO: Pending assignment                                                │   │
│  │                                                                           │   │
│  │   ⚠ Cannot deploy to Production - DPIA pending, Certification required   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Legend: ● High-risk  ○ Standard  ✓ Complete  ⚠ Pending  ⏰ Expiring soon       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mockup 3: AI DPIA Form

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Organizational View › DIFC Regulation 10 › DPIAs › Credit Scoring AI            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  DPIA for: Credit Scoring AI                                   Status: Draft   │
│  Version: 1.0                                              Progress: 45%        │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [1. Overview] [2. Lawfulness ●] [3. Fairness] [4. Necessity]            │   │
│  │ [5. Proportionality] [6. Data Rights] [7. Transfers] [8. Bias]          │   │
│  │ [9. Risk Summary] [10. Sign-off]                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Section 2: Lawfulness Assessment                                         │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  2.1 What is the lawful basis for this AI processing?                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │ ○ Consent                                                        │    │   │
│  │  │ ● Legitimate interest                                            │    │   │
│  │  │ ○ Contract performance                                           │    │   │
│  │  │ ○ Legal obligation                                               │    │   │
│  │  │ ○ Vital interests                                                │    │   │
│  │  │ ○ Public task                                                    │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  2.2 Describe the legitimate interest being pursued:                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │ The organization has a legitimate interest in assessing credit   │    │   │
│  │  │ risk to make informed lending decisions while minimizing         │    │   │
│  │  │ defaults and ensuring responsible lending practices...           │    │   │
│  │  │                                                                  │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  2.3 Have you conducted a balancing test?                    ○ Yes ● No  │   │
│  │                                                                          │   │
│  │  ⚠ A balancing test is required for legitimate interest basis.          │   │
│  │    Please document how individual rights are balanced against the        │   │
│  │    legitimate interest.                                                  │   │
│  │                                                                          │   │
│  │  2.4 Balancing test documentation:                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │ Type here...                                                     │    │   │
│  │  │                                                                  │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  Risk indicator for this section: ⚠ Medium                               │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│                                     [Save Draft]  [← Previous]  [Next →]        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mockup 4: Notice Management Tab

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Organizational View › DIFC Regulation 10 › Notices                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search notices...              [+ Create Notice]  [Templates ▼]       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Notice                    │ Version │ Status       │ System        │ Actions│
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Credit Scoring Notice     │ v2.1    │ ● Published  │ Credit AI     │ ••• │   │
│  │ Last updated: Jan 15, 2024│         │ Effective: Jan 20                 │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Fraud Detection Notice    │ v1.3    │ ● Published  │ Fraud AI      │ ••• │   │
│  │ Last updated: Dec 10, 2023│         │ Effective: Dec 15                 │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Loan Recommendation Notice│ v1.0    │ ○ Draft      │ Loan AI       │ ••• │   │
│  │ Created: Jan 22, 2024     │         │ Not published                     │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Risk Assessment Notice    │ v1.2    │ ⚠ Legal Rev  │ Risk AI       │ ••• │   │
│  │ Submitted: Jan 24, 2024   │         │ Awaiting approval                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  Notice Editor: Credit Scoring Notice v2.2 (Draft)                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [Purposes] [Principles] [Limits] [Outputs] [Impacts] [Rights] [Contact] │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Purposes of AI Processing                                                │   │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │ │ This AI system is used to assess your creditworthiness when you     │ │   │
│  │ │ apply for a loan or credit product. The system analyzes:            │ │   │
│  │ │                                                                      │ │   │
│  │ │ • Your financial history and current financial position             │ │   │
│  │ │ • Your repayment history on previous credit                         │ │   │
│  │ │ • Your income and employment information                            │ │   │
│  │ │                                                                      │ │   │
│  │ │ This helps us make fair and consistent lending decisions.           │ │   │
│  │ └─────────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [Save Draft]  [Preview]  [Submit for Legal Review]  [Export ▼]                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mockup 5: ASO Dashboard (Separate Page for ASO Role Users)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ASO Dashboard                                                    Sarah Johnson   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Good morning, Sarah. You have 5 items requiring your attention.                │
│                                                                                 │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐       │
│  │ Pending Approvals   │ │ High-Risk Systems   │ │ Open Complaints     │       │
│  │        5            │ │        4            │ │        2            │       │
│  │  ⚠ 2 urgent         │ │  All compliant      │ │  1 critical         │       │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘       │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Items Requiring Your Approval                                            │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  ⚠ URGENT                                                                │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │ DPIA Approval: Loan Recommendation AI                              │  │   │
│  │  │ Submitted by: John Smith on Jan 24, 2024                           │  │   │
│  │  │ Risk Level: High  │  Commercial: Yes  │  Go-live target: Feb 1     │  │   │
│  │  │                                            [Review DPIA] [Approve] │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ⚠ URGENT                                                                │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Production Deployment: Customer Segmentation AI                    │  │   │
│  │  │ Requested by: Emily Chen on Jan 25, 2024                           │  │   │
│  │  │ DPIA: ✓ Approved  │  Cert: ✓ Valid  │  Evidence: ✓ Complete        │  │   │
│  │  │                                            [Review]  [Approve]     │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Notice Review: Risk Assessment AI Notice v1.2                      │  │   │
│  │  │ Submitted by: Legal Team on Jan 24, 2024                           │  │   │
│  │  │ Changes: Updated data subject rights section                       │  │   │
│  │  │                                            [View Changes] [Approve]│  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌───────────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │ Upcoming Certification Renewals   │  │ Intervention Events (Last 7 days) │  │
│  ├───────────────────────────────────┤  ├───────────────────────────────────┤  │
│  │                                   │  │                                    │  │
│  │ ⏰ 30 days - Fraud Detection AI   │  │ ● 3 bias threshold alerts         │  │
│  │    Expires: Feb 25, 2024          │  │   Credit Scoring AI - reviewed ✓  │  │
│  │    [Start Renewal]                │  │                                    │  │
│  │                                   │  │ ● 1 anomaly score alert            │  │
│  │ ⏰ 60 days - Credit Scoring AI    │  │   Fraud Detection - pending review │  │
│  │    Expires: Mar 25, 2024          │  │   [Review Now]                     │  │
│  │    [Start Renewal]                │  │                                    │  │
│  │                                   │  │ ○ 0 law enforcement access         │  │
│  └───────────────────────────────────┘  └───────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mockup 6: AI Complaints Tab

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Organizational View › DIFC Regulation 10 › Complaints                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [All]  [Received]  [Investigating]  [Remediation]  [Closed]             │   │
│  │                                                                          │   │
│  │ 🔍 Search complaints...                      [+ Log New Complaint]       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ⚠ CRITICAL                                               C-2024-005     │   │
│  │ ─────────────────────────────────────────────────────────────────────── │   │
│  │ Incorrect loan denial                                                    │   │
│  │                                                                          │   │
│  │ Source: Data Subject    System: Credit Scoring AI    Status: Investigating│  │
│  │ Received: Jan 23, 2024  Investigator: Mark Wilson                        │   │
│  │                                                                          │   │
│  │ Description: Customer claims their loan application was incorrectly      │   │
│  │ denied despite having good credit history and stable income...           │   │
│  │                                                                          │   │
│  │ [View Details]  [Update Status]  [Assign Investigator]                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ○ MEDIUM                                                 C-2024-004     │   │
│  │ ─────────────────────────────────────────────────────────────────────── │   │
│  │ Request for explanation of fraud flag                                    │   │
│  │                                                                          │   │
│  │ Source: Data Subject    System: Fraud Detection AI    Status: Remediation│   │
│  │ Received: Jan 20, 2024  Investigator: Lisa Park                          │   │
│  │                                                                          │   │
│  │ Root cause identified. Remediation task assigned to improve explanation  │   │
│  │ generation in fraud detection outputs.                                   │   │
│  │                                                                          │   │
│  │ [View Details]  [Update Status]  [Close Complaint]                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  Complaint Statistics (Last 30 days)                                            │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐       │
│  │ Total Received      │ │ Avg Resolution Time │ │ By System           │       │
│  │       8             │ │     4.2 days        │ │ Credit: 4           │       │
│  │  ↓ 2 from last mo   │ │  ↓ 0.8 days faster  │ │ Fraud: 3   Loan: 1  │       │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mockup 7: Complaint Detail / Investigation View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Organizational View › DIFC › Complaints › C-2024-005                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │ Complaint Details                  │  │ Status                            │  │
│  ├───────────────────────────────────┤  ├───────────────────────────────────┤  │
│  │ Reference: C-2024-005              │  │ ● Received        Jan 23, 10:34   │  │
│  │ Priority: ⚠ Critical               │  │ ● Acknowledged    Jan 23, 11:00   │  │
│  │ Source: Data Subject               │  │ ● Investigating   Jan 23, 14:00   │  │
│  │ Subject ID: DS-XXXXX-2024          │  │ ○ Root Cause                      │  │
│  │                                    │  │ ○ Remediation                     │  │
│  │ Related System: Credit Scoring AI  │  │ ○ Closed                          │  │
│  │ Decision Ref: DEC-2024-01234       │  │                                   │  │
│  └───────────────────────────────────┘  └───────────────────────────────────┘  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Description                                                              │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Customer claims their loan application was incorrectly denied despite   │   │
│  │ having good credit history and stable income. They report:              │   │
│  │ - Credit score of 750+                                                   │   │
│  │ - 10 years employment at same company                                    │   │
│  │ - No missed payments in last 5 years                                     │   │
│  │                                                                          │   │
│  │ Customer requests explanation and review of the AI decision.             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Investigation                                           Assigned: Mark W │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │ Root Cause Analysis:                                                     │   │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │ │ Initial investigation reveals:                                       │ │   │
│  │ │                                                                      │ │   │
│  │ │ 1. The AI model correctly processed the credit score (752)          │ │   │
│  │ │ 2. However, a recent address change triggered a "thin file" flag    │ │   │
│  │ │ 3. The model weighted this flag too heavily in the final score      │ │   │
│  │ │                                                                      │ │   │
│  │ │ Recommendation: Review address change weighting in model config     │ │   │
│  │ └─────────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                          │   │
│  │ Findings:                                                                │   │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │ │ Type here...                                                         │ │   │
│  │ └─────────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Remediation Tasks                                        [+ Add Task]    │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ □ Review address change weighting          Assignee: ML Team  Due: Feb 1│   │
│  │ □ Re-run decision for affected customer    Assignee: Ops      Due: Jan 28│  │
│  │ □ Update model documentation               Assignee: Mark W   Due: Feb 5 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│                    [Save Progress]  [Move to Remediation]  [Close (ASO Only)]   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mockup 8: Certifications Tab

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Organizational View › DIFC Regulation 10 › Certifications                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [All]  [Preparing]  [Submitted]  [Approved]  [Expiring Soon]            │   │
│  │                                                                          │   │
│  │ 🔍 Search...                              [+ Start New Certification]    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Credit Scoring AI                                      CERT-2023-001    │   │
│  │ ─────────────────────────────────────────────────────────────────────── │   │
│  │                                                                          │   │
│  │ Status: ● Approved                    Scheme: DIFC Regulation 10         │   │
│  │ Approved: Sep 15, 2023                Expires: Sep 15, 2024              │   │
│  │ Commissioner Ref: DIFC-AI-2023-0456   Days remaining: 234                │   │
│  │                                                                          │   │
│  │ Evidence Pack:  ✓ DPIA  ✓ Controls (45/45)  ✓ Tests  ✓ Policies         │   │
│  │                                                                          │   │
│  │ [View Certificate]  [Download Evidence Pack]  [Start Renewal]            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Fraud Detection AI                                     CERT-2023-002    │   │
│  │ ─────────────────────────────────────────────────────────────────────── │   │
│  │                                                                          │   │
│  │ Status: ⏰ Expiring Soon               Scheme: DIFC Regulation 10         │   │
│  │ Approved: Feb 25, 2023                Expires: Feb 25, 2024              │   │
│  │ Commissioner Ref: DIFC-AI-2023-0234   Days remaining: 30 ⚠               │   │
│  │                                                                          │   │
│  │ Evidence Pack:  ✓ DPIA  ✓ Controls (38/38)  ✓ Tests  ✓ Policies         │   │
│  │                                                                          │   │
│  │ [View Certificate]  [Download Evidence Pack]  [Start Renewal] ⚠          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Loan Recommendation AI                                  CERT-2024-001   │   │
│  │ ─────────────────────────────────────────────────────────────────────── │   │
│  │                                                                          │   │
│  │ Status: ○ Preparing                    Scheme: DIFC Regulation 10        │   │
│  │ Started: Jan 20, 2024                  Target submission: Feb 15, 2024   │   │
│  │                                                                          │   │
│  │ Evidence Pack Progress:                                                  │   │
│  │ ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │ │ DPIA              ████████████████████░░░░░░░░░░  67%  ⚠ In progress│ │   │
│  │ │ Controls          ████████████████████████░░░░░░  80%  ⚠ 8 pending  │ │   │
│  │ │ Evaluation Tests  ████████████████████████████░░  90%  ✓ On track   │ │   │
│  │ │ Policies          ████████████████████████████████ 100% ✓ Complete  │ │   │
│  │ └─────────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                          │   │
│  │ [Continue Preparation]  [Build Evidence Pack]                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mockup 9: Evidence Profile Editor

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Organizational View › DIFC › Evidence › Credit Scoring AI                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  This evidence profile provides both non-technical explanations for data        │
│  subjects and technical documentation for regulator review.                     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [Non-Technical Explanation]  [Technical Artifacts]  [Export Reports]     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Non-Technical Explanation                                                │   │
│  │ For data subjects and general audiences                                  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  How does this AI system work? *                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐│   │
│  │  │ This system helps us assess whether to approve your loan application ││   │
│  │  │ by looking at information about your financial history. It considers:││   │
│  │  │                                                                      ││   │
│  │  │ • Your credit score from credit bureaus                              ││   │
│  │  │ • Your income and employment stability                               ││   │
│  │  │ • Your history of repaying previous loans                            ││   │
│  │  │ • Your current debt levels                                           ││   │
│  │  │                                                                      ││   │
│  │  │ The system does NOT consider your race, religion, gender, or         ││   │
│  │  │ other protected characteristics.                                      ││   │
│  │  └─────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                          │   │
│  │  What factors influence the decision? *                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐│   │
│  │  │ The most important factors are:                                      ││   │
│  │  │                                                                      ││   │
│  │  │ 1. Credit score (35% weight)                                         ││   │
│  │  │ 2. Debt-to-income ratio (25% weight)                                 ││   │
│  │  │ 3. Employment stability (20% weight)                                 ││   │
│  │  │ 4. Payment history (15% weight)                                      ││   │
│  │  │ 5. Loan amount vs income (5% weight)                                 ││   │
│  │  └─────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                          │   │
│  │  How might this affect you? *                                            │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐│   │
│  │  │ Based on this analysis, the system recommends whether to approve    ││   │
│  │  │ or decline your loan application. This recommendation is then       ││   │
│  │  │ reviewed by a human loan officer who makes the final decision.      ││   │
│  │  │                                                                      ││   │
│  │  │ If your application is declined, you can request a review...        ││   │
│  │  └─────────────────────────────────────────────────────────────────────┘│   │
│  │                                                                          │   │
│  │  * Required field                                                        │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [Save Draft]     [Generate Data Subject Report]     [Generate Regulator Report]│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mockup 10: Intervention Rules Tab

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Organizational View › DIFC Regulation 10 › Interventions                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  System: Credit Scoring AI                                                      │
│                                                                                 │
│  Intervention rules define when human review is required based on metrics       │
│  and thresholds. When triggered, the system logs the event and alerts the       │
│  designated reviewers.                                                          │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Active Rules                                           [+ Add Rule]      │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │ ● Bias Threshold Alert                                    Active  │  │   │
│  │  │ ───────────────────────────────────────────────────────────────── │  │   │
│  │  │ When: demographic_parity_ratio < 0.8                              │  │   │
│  │  │ Action: Alert + Escalate to ASO                                   │  │   │
│  │  │ Recipients: Sarah Johnson (ASO), ML Team                          │  │   │
│  │  │                                                                   │  │   │
│  │  │ Triggered: 3 times (last: Jan 22, 2024)          [Edit] [Disable] │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │ ● Confidence Threshold                                    Active  │  │   │
│  │  │ ───────────────────────────────────────────────────────────────── │  │   │
│  │  │ When: model_confidence < 0.7                                      │  │   │
│  │  │ Action: Block decision + Require human review                     │  │   │
│  │  │ Recipients: Loan Officers Team                                    │  │   │
│  │  │                                                                   │  │   │
│  │  │ Triggered: 12 times (last: Jan 25, 2024)         [Edit] [Disable] │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │ ● Law Enforcement Data Request                            Active  │  │   │
│  │  │ ───────────────────────────────────────────────────────────────── │  │   │
│  │  │ When: law_enforcement_access_flag = true                          │  │   │
│  │  │ Action: Log + Alert + Escalate to ASO                             │  │   │
│  │  │ Recipients: Legal Team, Sarah Johnson (ASO)                       │  │   │
│  │  │                                                                   │  │   │
│  │  │ Triggered: 0 times                               [Edit] [Disable] │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Recent Triggered Events                               [View All Events]  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Jan 25, 14:32 │ Confidence Threshold │ Value: 0.62 │ ✓ Reviewed         │   │
│  │ Jan 25, 09:15 │ Confidence Threshold │ Value: 0.68 │ ✓ Reviewed         │   │
│  │ Jan 22, 16:45 │ Bias Threshold       │ Value: 0.76 │ ⚠ Pending review   │   │
│  │ Jan 22, 11:20 │ Confidence Threshold │ Value: 0.55 │ ✓ Reviewed         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
**Goal: Core infrastructure and DIFC framework**

| Task | Type | Estimate |
|------|------|----------|
| Database migrations for new tables | BE | 3 days |
| Create Sequelize models | BE | 3 days |
| Create DIFC framework structure | BE | 2 days |
| Seed DIFC controls and questions | BE | 2 days |
| ASO role and permissions | BE | 2 days |
| DIFC fields on Model Inventory | BE+FE | 3 days |
| AI Register view | FE | 3 days |
| Basic DIFC dashboard | FE | 2 days |

### Phase 2: DPIA & Approvals (Weeks 5-8)
**Goal: DPIA workflow and ASO approval gates**

| Task | Type | Estimate |
|------|------|----------|
| DPIA API endpoints | BE | 3 days |
| DPIA questionnaire form | FE | 4 days |
| DPIA review workflow | BE+FE | 3 days |
| ASO approval workflows | BE | 3 days |
| ASO dashboard | FE | 3 days |
| High-risk production gates | BE | 2 days |
| DPIA export/reports | BE+FE | 2 days |

### Phase 3: Notices & Certification (Weeks 9-12)
**Goal: Notice management and certification lifecycle**

| Task | Type | Estimate |
|------|------|----------|
| Notice API endpoints | BE | 2 days |
| Notice editor & templates | FE | 4 days |
| Notice versioning | BE | 2 days |
| Notice export (text/JSON) | BE | 2 days |
| Certification API endpoints | BE | 3 days |
| Certification UI | FE | 3 days |
| Evidence pack builder | BE+FE | 3 days |
| Renewal reminders | BE | 1 day |

### Phase 4: Complaints & Evidence (Weeks 13-16)
**Goal: Complaint handling and evidence profiles**

| Task | Type | Estimate |
|------|------|----------|
| Complaint API endpoints | BE | 3 days |
| Complaint intake form | FE | 2 days |
| Investigation workflow | BE+FE | 4 days |
| Complaint statistics | BE+FE | 2 days |
| Evidence profile API | BE | 2 days |
| Evidence profile editor | FE | 3 days |
| Report generation | BE+FE | 3 days |

### Phase 5: Intervention & Polish (Weeks 17-20)
**Goal: Human-in-the-loop and final refinements**

| Task | Type | Estimate |
|------|------|----------|
| Intervention rules API | BE | 3 days |
| Intervention rules UI | FE | 3 days |
| Event logging | BE | 2 days |
| Events log viewer | FE | 2 days |
| DIFC policy templates | BE+FE | 3 days |
| Policy acknowledgment | BE+FE | 2 days |
| Testing & bug fixes | Both | 5 days |

---

## Part 5: Technical Notes

### 5.1 Reusable Patterns

The implementation should leverage existing patterns:

1. **Framework structure**: Follow EU AI Act pattern for topics/subtopics/questions
2. **Approval workflows**: Extend existing ApprovalWorkflow model
3. **Dashboard components**: Reuse ProgressCard, StatusTileCards patterns
4. **Form patterns**: Use StandardModal with useStandardModal hook
5. **Change history**: Add change tracking for new entities
6. **Export**: Follow existing PDF/report generation patterns

### 5.2 API Design Principles

- All new routes under `/api/difc/` namespace
- Standard CRUD with tenant isolation
- Consistent error responses
- Structured logging for audit trail

### 5.3 Frontend State Management

- Use existing Redux patterns for auth/user state
- React Query for server state (DPIAs, complaints, etc.)
- Local state for form management

### 5.4 Testing Requirements

- Unit tests for all new models
- Integration tests for workflows
- E2E tests for critical paths (DPIA submission, complaint resolution)
- ASO permission tests

---

## Appendix A: DIFC Regulation 10 Control Mapping

Based on the regulation's key requirements, controls are organized around the five design principles and specific regulatory obligations:

| Regulation 10 Requirement | Control Category | Key Controls |
|---------------------------|------------------|--------------|
| **Deployer/Operator Roles** | Governance | Role assignment, accountability mapping, liability documentation |
| **AI System Register** | Record-keeping | Use cases, processing activities, necessity/proportionality, third-party sharing, export safeguards |
| **ASO Appointment** | Governance | ASO designation, competencies, reporting structure, Commissioner cooperation |
| **High-Risk Classification** | Risk Assessment | Commercial use determination, risk categorization, processing purpose review |
| **DPIA Requirements** | Risk Assessment | Impact assessment, rights impact, bias assessment, safeguards review |
| **Notice Requirements** | Transparency | Technology description, privacy impact, purposes, principles, rights limitations, codes/certifications |
| **Certification** | Technical Measures | Commissioner scheme compliance, audit requirements, evidence bundle, renewal tracking |
| **Evidentiary Capacity** | Record-keeping | Non-technical explanations, supporting evidence, data subject reports, regulator reports |
| **Data Subject Rights** | Data Protection | Challenge mechanism, rights exercise facilitation, explanation provision |
| **Complaint Handling** | Human Oversight | Intake process, investigation, resolution, communication |
| **Five Design Principles** | All | Ethical (bias-free), Fair (equal treatment), Transparent (explainable), Secure (breach protection), Accountable (auditable) |
| **Human Intervention** | Human Oversight | Intervention triggers, discriminatory outcome detection, law enforcement access protocols |
| **Human-Defined Purposes** | Governance | Purpose constraints, self-defined purpose limits, dynamic purpose controls |
| **Total Estimated Controls** | | **~85 controls** |

---

## Appendix B: Cross-Framework Mapping

Map DIFC controls to existing frameworks for evidence reuse:

| DIFC Control | EU AI Act | ISO 42001 | NIST AI RMF |
|--------------|-----------|-----------|-------------|
| Risk Assessment | Art. 9 | 6.1, 8.2 | MAP-1, MAP-2 |
| Transparency | Art. 13 | 5.2, 7.4 | GOVERN-4 |
| Human Oversight | Art. 14 | 6.2.3 | MANAGE-2 |
| Data Governance | Art. 10 | 9.2, 9.3 | MAP-3 |
| Record-keeping | Art. 12 | 7.5 | GOVERN-5 |
| Accuracy | Art. 15 | 8.4 | MEASURE-1 |

---

## Appendix C: Regulation 10 Enforcement Timeline

| Date | Milestone |
|------|-----------|
| September 1, 2023 | Regulation 10 enacted and enforceable |
| 2024-2025 | Soft launch period - Regulation 10 Accelerator program available |
| January 2026 | **Full enforcement begins** |

Organizations should use the period before January 2026 to:
1. Assess AI systems processing personal data
2. Implement required governance structures (ASO, registers, notices)
3. Prepare for certification under Commissioner's scheme
4. Build evidentiary capacity for data subject requests

---

## Appendix D: Key Regulatory References

| Source | Description |
|--------|-------------|
| [DIFC Commissioner of Data Protection - Regulation 10](https://www.difc.com/business/registrars-and-commissioners/commissioner-of-data-protection/regulation-10) | Official regulation page with guidance documents |
| DIFC Data Protection Law No. 5 of 2020 | Parent legislation |
| DIFC Data Protection Regulations (Consolidated) | Full regulatory text |
| Regulation 10 Accreditation and Certification Framework | Certification scheme details |
| Regulation 10 Accelerator Framework | Sandbox/pilot program |
| OECD AI Principles | Referenced international framework |
| NIST AI Risk Management Framework | Referenced international framework |

---

*Document Version: 1.1*
*Created: January 2024*
*Updated: January 2026*
*Author: VerifyWise Team*
