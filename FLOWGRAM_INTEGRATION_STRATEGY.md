# VerifyWise FlowGram.ai Integration Strategy

## Overview

This document outlines the comprehensive strategy for integrating FlowGram.ai workflow automation engine into VerifyWise to transform it from a static GRC platform into a dynamic, automated governance system that proactively manages risks, compliance, and operational efficiency.

## Table of Contents

- [Technology Stack Analysis](#technology-stack-analysis)
- [VerifyWise GRC Data Model Analysis](#verifywise-grc-data-model-analysis)
- [Specific GRC Workflow Automation Scenarios](#specific-grc-workflow-automation-scenarios)
- [Integration Architecture](#integration-architecture)
- [Implementation Phases](#implementation-phases)
- [Custom Node Types](#custom-node-types)
- [Database Integration](#database-integration)

## Technology Stack Analysis

### FlowGram.ai Core Features
- **Node-based visual workflow engine** developed by ByteDance
- **TypeScript-based** (83.9% TypeScript codebase) - Perfect alignment with VerifyWise
- **Dual layout modes**: Fixed layout (structured) and Free connection (organic)
- **MIT License** - Fully open source and free
- **Interactive features**: Drag-and-drop, animations, gesture zoom, undo/redo
- **Export capabilities**: Workflows as images or executable code

### Technology Compatibility
- Node.js 18+ (matches VerifyWise requirements)
- React-based frontend integration
- TypeScript compatibility
- Package management: pnpm, Rush

### Key Packages
1. `@flowgram.ai/create-app`: App Creator
2. `@flowgram.ai/fixed-layout-editor`: Fixed Layout Editor (ideal for GRC compliance processes)
3. `@flowgram.ai/free-layout-editor`: Free Layout Editor (ideal for custom risk workflows)

## VerifyWise GRC Data Model Analysis

### Core Entities for Workflow Automation

#### 1. Risk Management
- **RiskModel** (`/domain.layer/models/risks/risk.model.ts`)
  - Risk levels: "No risk" → "Very high risk"
  - Mitigation status: "Not Started" → "Completed"
  - AI lifecycle phases with specific risk categories
  - Deadline tracking and approval workflows

#### 2. Control Assessment
- **ControlModel** (`/domain.layer/models/control/control.model.ts`)
  - Status tracking: "Waiting" → "In progress" → "Done"
  - Risk review levels: "Acceptable" → "Unacceptable risk"
  - Owner, reviewer, and approver assignments

#### 3. Vendor Management
- **VendorModel** (`/domain.layer/models/vendor/vendor.model.ts`)
  - Review status: "Not started" → "Requires follow-up"
  - Risk assessment integration
  - Assignee and approval workflows

#### 4. Task Management
- **TasksModel** (`/domain.layer/models/tasks/tasks.model.ts`)
  - Priority levels: Low, Medium, High
  - Status tracking: Open → Completed
  - Due date monitoring and escalation

#### 5. Assessment Framework
- **AssessmentModel** (`/domain.layer/models/assessment/assessment.model.ts`)
  - Project-linked assessments
  - Age tracking and activity monitoring

#### 6. AI Model Governance
- **ModelInventory** and **ModelRisk** models
- Training registrar tracking
- Lifecycle management integration

## Specific GRC Workflow Automation Scenarios

### 1. Risk Management Lifecycle Workflows

#### High-Risk Alert & Escalation Workflow
```
[Risk Created/Updated] → [Risk Level Evaluation] → [Conditional Branch]
├─ High/Very High Risk → [Immediate Stakeholder Alert] → [Management Approval Required]
├─ Medium Risk → [Standard Review Process] → [Owner Assignment]
└─ Low Risk → [Auto-assign to Risk Owner] → [Standard Monitoring]
```

**Triggers from VerifyWise:**
- `risk_level_autocalculated` = "High risk" | "Very high risk"
- `deadline` approaching (7, 3, 1 day warnings)
- `mitigation_status` = "Requires review"

#### Risk Mitigation Deadline Management
```
[Deadline Approaching] → [Grace Period Check] → [Escalation Matrix]
├─ 7 Days → [Owner Reminder] + [Manager CC]
├─ 3 Days → [Manager Alert] + [Skip Level Notification]
├─ 1 Day → [Executive Alert] + [Incident Creation]
└─ Overdue → [Automatic Risk Level Increase] + [Emergency Response]
```

### 2. Control Assessment Automation

#### Control Review & Approval Workflow
```
[Control Status Change] → [Review Assignment] → [Evidence Validation]
├─ Implementation Complete → [Reviewer Assignment] → [Evidence Review]
├─ Evidence Approved → [Risk Assessment Update] → [Stakeholder Notification]
└─ Evidence Rejected → [Owner Re-assignment] → [Remediation Planning]
```

**Triggers from VerifyWise:**
- `status` = "Done" (requires review)
- `due_date` approaching
- `risk_review` = "Unacceptable risk"

#### Compliance Framework Assessment Pipeline
```
[Assessment Created] → [Framework Analysis] → [Control Mapping] → [Assignment Distribution]
├─ SOC2 Framework → [SOC2 Control Template] → [Security Team Assignment]
├─ ISO 27001 → [ISO Control Template] → [Compliance Team Assignment]
└─ Custom Framework → [Manual Review Process] → [Subject Matter Expert Assignment]
```

### 3. Vendor Risk Management Automation

#### Vendor Onboarding & Risk Assessment
```
[New Vendor] → [Initial Risk Scoring] → [Review Assignment] → [Due Diligence Process]
├─ High-Risk Vendor → [Extended Review] → [Executive Approval] → [Enhanced Monitoring]
├─ Medium-Risk → [Standard Review] → [Manager Approval] → [Regular Monitoring]
└─ Low-Risk → [Automated Approval] → [Minimal Monitoring]
```

#### Vendor Periodic Review Automation
```
[Quarterly Review Trigger] → [Risk Re-assessment] → [Contract Review] → [Renewal Decision]
├─ Risk Increased → [Enhanced Due Diligence] → [Contract Renegotiation]
├─ Risk Stable → [Standard Renewal Process] → [Documentation Update]
└─ Risk Decreased → [Simplified Renewal] → [Monitoring Reduction]
```

### 4. Task & Project Management Workflows

#### Task Escalation & SLA Management
```
[Task Created] → [SLA Assignment] → [Progress Monitoring] → [Escalation Matrix]
├─ High Priority + Overdue → [Manager Alert] → [Resource Reallocation]
├─ Medium Priority + Overdue → [Team Lead Notification] → [Priority Review]
└─ Task Completed → [Quality Review] → [Approval Workflow]
```

#### Project Milestone & Compliance Tracking
```
[Project Phase Complete] → [Compliance Check] → [Milestone Validation] → [Next Phase Trigger]
├─ Compliance Gap Found → [Risk Assessment] → [Mitigation Planning] → [Approval Gate]
├─ Compliance Met → [Stakeholder Notification] → [Phase Transition]
└─ Critical Gap → [Project Hold] → [Executive Review] → [Remediation Plan]
```

### 5. AI Model Governance Workflows

#### AI Model Risk Assessment Pipeline
```
[Model Inventory Update] → [Lifecycle Phase Analysis] → [Risk Category Assessment] → [Control Assignment]
├─ High-Risk AI Model → [Enhanced Governance] → [Continuous Monitoring] → [Regular Audits]
├─ Medium-Risk → [Standard Governance] → [Periodic Reviews] → [Compliance Checks]
└─ Low-Risk → [Basic Monitoring] → [Annual Reviews] → [Self-Assessment]
```

### 6. Advanced Multi-Entity Workflows

#### Multi-Framework Compliance Orchestration
```
[Assessment Trigger] → [Framework Detection] → [Parallel Control Evaluation]
├─ SOC2 Path → [SOC2 Controls Check] → [Gap Analysis] → [Remediation Planning]
├─ ISO27001 Path → [ISO Controls Check] → [Evidence Collection] → [Audit Preparation]
├─ NIST Path → [NIST Controls Check] → [Risk Assessment] → [Control Implementation]
└─ [Convergence Point] → [Unified Reporting] → [Executive Dashboard] → [Stakeholder Alerts]
```

#### Intelligent Risk Correlation & Prediction
```
[Multiple Risk Updates] → [Pattern Analysis] → [Correlation Detection] → [Predictive Alerts]
├─ Vendor Risk + Model Risk → [Supply Chain Alert] → [Enhanced Due Diligence]
├─ Control Failure + High Risk → [Incident Response] → [Emergency Mitigation]
└─ Multiple Deadline Conflicts → [Resource Optimization] → [Priority Rebalancing]
```

## Integration Architecture

### Technical Integration Layer

```typescript
// FlowGram.ai → VerifyWise Integration Interface
interface WorkflowTrigger {
  entity: 'risk' | 'control' | 'vendor' | 'task' | 'assessment' | 'model';
  event: 'created' | 'updated' | 'status_changed' | 'deadline_approaching';
  conditions: Record<string, any>;
  workflow_id: string;
}

// VerifyWise → FlowGram.ai Action Nodes
interface VerifyWiseActionNode {
  type: 'email' | 'slack' | 'task_create' | 'risk_update' | 'approval_request';
  config: {
    template: string;
    recipients: string[];
    data: Record<string, any>;
  };
}
```

### Database Event Triggers

```sql
-- PostgreSQL triggers for real-time workflow activation
CREATE OR REPLACE FUNCTION trigger_workflow()
RETURNS TRIGGER AS $$
BEGIN
  -- Send webhook to FlowGram.ai workflow engine
  PERFORM pg_notify('workflow_trigger', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'old_data', row_to_json(OLD),
    'new_data', row_to_json(NEW)
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to key GRC tables
CREATE TRIGGER risk_workflow_trigger
  AFTER INSERT OR UPDATE ON project_risks
  FOR EACH ROW EXECUTE FUNCTION trigger_workflow();

CREATE TRIGGER control_workflow_trigger
  AFTER INSERT OR UPDATE ON controls
  FOR EACH ROW EXECUTE FUNCTION trigger_workflow();

CREATE TRIGGER vendor_workflow_trigger
  AFTER INSERT OR UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION trigger_workflow();

CREATE TRIGGER task_workflow_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION trigger_workflow();
```

### Workflow Engine Service

```typescript
// Workflow Engine Service Integration
export class VerifyWiseWorkflowEngine {
  private flowgramEngine: FlowgramEngine;
  private emailService: typeof sendEmail;
  private slackService: typeof sendSlackNotification;

  constructor() {
    this.flowgramEngine = new FlowgramEngine();
    this.emailService = sendEmail;
    this.slackService = sendSlackNotification;
  }

  async executeWorkflow(trigger: WorkflowTrigger): Promise<void> {
    const workflow = await this.getWorkflowById(trigger.workflow_id);
    const context = await this.buildWorkflowContext(trigger);

    await this.flowgramEngine.execute(workflow, context);
  }

  private async buildWorkflowContext(trigger: WorkflowTrigger): Promise<WorkflowContext> {
    const entityData = await this.getEntityData(trigger.entity, trigger.event);
    const userContext = await this.getUserContext(entityData);

    return {
      trigger,
      entityData,
      userContext,
      actions: {
        sendEmail: this.emailService,
        sendSlack: this.slackService,
        createTask: this.createTaskAction.bind(this),
        updateRisk: this.updateRiskAction.bind(this),
      }
    };
  }
}
```

## Custom Node Types for VerifyWise

### GRC-Specific Node Definitions

```typescript
const VerifyWiseNodes = {
  // Trigger Nodes
  'risk-level-monitor': {
    category: 'trigger',
    inputs: ['risk_id'],
    outputs: ['high_risk', 'medium_risk', 'low_risk'],
    config: {
      risk_threshold: 'configurable',
      monitoring_frequency: 'realtime | hourly | daily'
    },
    description: 'Monitors risk level changes and triggers appropriate workflows'
  },

  'deadline-monitor': {
    category: 'trigger',
    inputs: ['entity_type', 'entity_id'],
    outputs: ['7_days', '3_days', '1_day', 'overdue'],
    config: {
      warning_periods: 'configurable array',
      business_hours_only: 'boolean'
    },
    description: 'Monitors deadlines and sends alerts at configured intervals'
  },

  // Condition Nodes
  'compliance-check': {
    category: 'condition',
    inputs: ['control_id', 'framework_id'],
    outputs: ['compliant', 'non_compliant', 'partial'],
    config: {
      framework_requirements: 'configurable',
      evidence_required: 'boolean'
    },
    description: 'Evaluates compliance status against framework requirements'
  },

  'risk-correlation': {
    category: 'condition',
    inputs: ['risk_ids[]', 'correlation_rules'],
    outputs: ['high_correlation', 'medium_correlation', 'low_correlation'],
    config: {
      correlation_threshold: 'configurable',
      risk_categories: 'array'
    },
    description: 'Analyzes correlations between multiple risks'
  },

  // Action Nodes
  'verifywise-email': {
    category: 'action',
    inputs: ['recipients', 'template', 'data'],
    outputs: ['success', 'failed'],
    integration: 'existing_email_service',
    config: {
      template_library: 'predefined_templates',
      encryption: 'boolean'
    },
    description: 'Sends emails using VerifyWise email service'
  },

  'verifywise-slack': {
    category: 'action',
    inputs: ['channel', 'message', 'routing_type'],
    outputs: ['sent', 'failed'],
    integration: 'existing_slack_service',
    config: {
      message_format: 'text | blocks',
      mentions: 'configurable'
    },
    description: 'Sends Slack notifications using VerifyWise Slack integration'
  },

  'create-task': {
    category: 'action',
    inputs: ['assignee', 'title', 'priority', 'due_date'],
    outputs: ['task_created', 'validation_failed'],
    integration: 'tasks_model',
    config: {
      auto_assignment_rules: 'configurable',
      template_tasks: 'predefined'
    },
    description: 'Creates new tasks in VerifyWise task management system'
  },

  'update-risk-status': {
    category: 'action',
    inputs: ['risk_id', 'new_status', 'notes'],
    outputs: ['updated', 'validation_failed'],
    integration: 'risk_model',
    config: {
      status_validation: 'workflow_rules',
      audit_logging: 'boolean'
    },
    description: 'Updates risk status with validation and audit trail'
  },

  'approval-gate': {
    category: 'action',
    inputs: ['approver_id', 'approval_type', 'context'],
    outputs: ['approved', 'rejected', 'pending'],
    integration: 'user_model',
    config: {
      approval_hierarchy: 'configurable',
      timeout_rules: 'configurable'
    },
    description: 'Creates approval workflows with escalation logic'
  },

  // Analytics Nodes
  'risk-analytics': {
    category: 'analytics',
    inputs: ['time_period', 'risk_categories'],
    outputs: ['trends', 'predictions', 'recommendations'],
    config: {
      analysis_depth: 'basic | advanced',
      prediction_models: 'configurable'
    },
    description: 'Analyzes risk trends and provides predictive insights'
  }
};
```

## Implementation Phases

### Phase 1: Foundation (Month 1-2)
**Objective**: Basic workflow automation with existing VerifyWise infrastructure

**Deliverables**:
- FlowGram.ai engine integration
- Basic trigger system (database hooks)
- Simple email/Slack workflows
- Risk deadline notifications
- Task escalation workflows

**Success Metrics**:
- 90% reduction in manual reminder emails
- 100% on-time deadline notifications
- Basic workflow execution under 5 seconds

### Phase 2: Advanced Logic (Month 3-4)
**Objective**: Complex multi-condition workflows and approval processes

**Deliverables**:
- Multi-condition risk evaluation workflows
- Vendor risk assessment automation
- Control review and approval workflows
- Custom VerifyWise node types
- Workflow template library

**Success Metrics**:
- 75% reduction in manual review assignments
- Automated risk level adjustments
- 50% faster vendor onboarding

### Phase 3: Intelligent Features (Month 5-6)
**Objective**: AI-powered workflows and predictive automation

**Deliverables**:
- Predictive risk analytics workflows
- Cross-entity correlation workflows
- AI-powered decision support
- Advanced reporting automation
- Machine learning integration

**Success Metrics**:
- Proactive risk identification (predict 80% of risks before they escalate)
- 90% accurate correlation detection
- Automated compliance scoring

### Phase 4: Enterprise Features (Month 7-8)
**Objective**: Scalability, performance, and enterprise-grade features

**Deliverables**:
- Workflow versioning and rollback
- Advanced security and audit logging
- Performance optimization
- Multi-tenant workflow isolation
- API for external integrations

**Success Metrics**:
- Sub-second workflow execution
- 99.9% system availability
- Complete audit trail compliance

## Integration Benefits

### Operational Efficiency
- **Automated Notifications**: Replace manual email/Slack sending with intelligent workflows
- **Proactive Risk Management**: Early warning systems prevent risk escalation
- **Streamlined Approvals**: Reduce approval bottlenecks with automated routing
- **Consistent Processes**: Standardize GRC processes across the organization

### Compliance Enhancement
- **Continuous Monitoring**: Real-time compliance status tracking
- **Evidence Automation**: Automated evidence collection and validation
- **Audit Trail**: Complete workflow execution logging
- **Framework Agnostic**: Support multiple compliance frameworks simultaneously

### Business Value
- **Reduced Manual Effort**: 70-80% reduction in routine GRC tasks
- **Faster Response Times**: Immediate alerts and automated responses
- **Improved Accuracy**: Eliminate human error in routine processes
- **Better Visibility**: Real-time dashboards and predictive analytics

## Technical Requirements

### Infrastructure
- Node.js 18+ environment
- PostgreSQL with trigger support
- Redis for workflow state management
- Message queue for reliable workflow execution

### Security Considerations
- Workflow execution sandboxing
- Role-based workflow access control
- Encrypted workflow data storage
- Audit logging for all workflow activities

### Performance Requirements
- Workflow execution: < 5 seconds for simple workflows
- Database triggers: < 100ms overhead
- Concurrent workflows: Support 1000+ simultaneous executions
- Scalability: Horizontal scaling support

## Conclusion

The integration of FlowGram.ai with VerifyWise represents a significant advancement in GRC automation capabilities. By leveraging VerifyWise's robust data models and existing notification infrastructure, combined with FlowGram.ai's powerful visual workflow engine, organizations can achieve unprecedented levels of automation, compliance, and operational efficiency.

This integration strategy provides a clear roadmap for transforming VerifyWise from a static GRC platform into a dynamic, intelligent governance system that proactively manages risks, ensures compliance, and optimizes operational workflows.

---

*Document Version: 1.0*
*Last Updated: 2025-01-26*
*Status: Planning Phase*