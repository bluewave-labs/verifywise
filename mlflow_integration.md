# VerifyWise ↔ MLflow Integration Design

## Overview

This document describes how **VerifyWise** should integrate with a customer’s remote **MLflow** instance to automatically ingest model metadata, performance evidence, lineage, and compliance signals into VerifyWise’s internal model registry.

### Goals

1. Build and maintain an inventory of all production-relevant models and their versions.  
2. Capture evidence needed for AI governance, audits, regulatory filings, and incident response.  
3. Surface compliance gaps (e.g., missing privacy review or bias assessment).  
4. Support both SaaS and on-prem deployments.

The document defines responsibilities, data flow, authentication, data mapping, normalization rules, and persistence expectations.  
It assumes VerifyWise already has a persistence layer (database) and background jobs.  
No code examples are included.

---

## Scope

The integration performs **read-only ingestion** from MLflow.  
It does **not** mutate MLflow state (no registering, promoting, or deploying models).

### The integration must:
- Connect to an MLflow tracking/registry server.
- Enumerate all registered models and versions.
- For each model version, resolve the linked training run.
- Extract structured metadata and artifact metadata.
- Normalize data into VerifyWise’s canonical model schema.
- Persist the normalized data.
- Maintain audit and compliance traces.

---

## High-Level Architecture

1. **MLflow Connector**
   - Communicates with the remote MLflow server via MLflow’s Python SDK or REST API.
   - Fetches raw data from the tracking server and model registry.

2. **Normalizer**
   - Converts MLflow responses into VerifyWise’s canonical model record.
   - Handles missing fields, naming inconsistencies, and type coercion.

3. **Persistence Layer**
   - Stores or updates VerifyWise records.
   - Tracks last refresh timestamps for incremental sync.

4. **Compliance Layer**
   - Evaluates governance posture.
   - Flags missing compliance fields or regulatory gaps.

5. **Audit Trail**
   - Logs ingestion activity (source URI, timestamp, credentials used).
   - Provides evidence of provenance for auditors and regulators.

---

## Authentication & Authorization

The connector must support **authenticated access** to the customer’s MLflow server.

### Requirements

- Accept tracking URI, credentials, and optional headers/tokens.  
- Use environment or secrets storage for credentials (never log plaintext).  
- Only request **read-only permissions** on MLflow (view experiments, runs, models, and artifacts).  
- Record which credentials or service identity were used per ingestion event.

### Multi-tenant or On-premise considerations

- SaaS deployments must **isolate** tenant credentials.  
- On-prem deployments may run entirely inside a private network.  
- The connector must not assume public internet access.

---

## Data Sources from MLflow

### 1. Registered Model
Logical model entry (e.g., `CreditScoringModel`)  
Contains description, timestamps, and latest version references.

### 2. Model Version
Specific version of a model with:
- Stage (`Production`, `Staging`, `Archived`, `None`)
- Creation/update timestamps  
- Source run ID  
- Artifact URI  

### 3. Run
Represents the training/evaluation execution with:
- Metrics, params, tags  
- Start/end time, status  
- Experiment reference, artifact URI  

### 4. Experiment
Logical container for runs with:
- ID, name, artifact location, and tags  

### 5. Artifacts Metadata
File-level metadata for each run’s artifact directory, including:
- Model binaries  
- Environment manifests  
- Evaluation reports  

---

## Connector Workflow

Each sync cycle should:

1. Fetch all registered models.  
2. For each model, fetch all versions.  
3. For each version:
   - Get metadata (version, stage, timestamps, run ID, artifact URI).  
   - Resolve linked run and experiment metadata.  
   - Enumerate artifact files (names, sizes, hashes).  
4. Normalize data into VerifyWise’s canonical schema.  
5. Persist or update model records.  
6. Record ingestion event in the audit trail.

---

## Canonical VerifyWise Model Record

Each `(model_name, version_number)` combination maps to one canonical VerifyWise record.

### Group 1. Model Identity
| Field | Description | Source |
|-------|--------------|--------|
| `model_name` | Logical name | Registered model |
| `description` | Long form notes | Registered model |
| `business_purpose` | Use case | Run tags or null |
| `owner` | Accountable party | Tag or run user_id |

---

### Group 2. Version & Lifecycle
| Field | Description | Source |
|-------|--------------|--------|
| `version_number` | Model version | Model version |
| `lifecycle_stage` | Normalized stage | Model version |
| `created_at` | Creation time | Model version |
| `last_updated_at` | Last updated time | Model version |
| `deployment_status` | Mirrors lifecycle | Model version |
| `source_run_id` | Run ID | Model version |
| `source_artifact_uri` | Artifact URI | Model version |

---

### Group 3. Training & Evaluation Evidence
| Field | Description | Source |
|-------|--------------|--------|
| `training_status` | Run status | Run info |
| `training_started_at` | Start time | Run info |
| `training_ended_at` | End time | Run info |
| `metrics` | Performance metrics | Run data |
| `hyperparameters` | Training params | Run data |
| `evaluation_tags` | Evaluation metadata | Run tags |

---

### Group 4. Lineage & Reproducibility
| Field | Description | Source |
|-------|--------------|--------|
| `experiment_id` | Experiment ID | Run info |
| `experiment_name` | Experiment name | Experiment |
| `code_commit` | Git commit hash | Run tags |
| `training_entrypoint` | Training script | Run tags |
| `dataset_reference` | Dataset version | Run tags |
| `artifact_uri` | Artifact location | Run info |

---

### Group 5. Risk & Compliance
| Field | Description | Source |
|-------|--------------|--------|
| `risk_category` | Risk type | Run tags |
| `regulatory_scope` | Regulatory framework | Run tags |
| `data_sensitivity` | Data type | Run tags |
| `privacy_assessment_status` | DPIA/PIA done | Run tags |
| `compliance_approver` | Reviewer or approver | Run tags |
| `security_assessment_version` | Threat model ref | Run tags |

> Missing fields are treated as **compliance gaps** and flagged by VerifyWise.

---

### Group 6. Artifacts & Environment Evidence
| Field | Description | Source |
|-------|--------------|--------|
| `runtime_environment` | Environment spec | `conda.yaml` or `requirements.txt` |
| `artifact_manifest` | File hashes and metadata | Artifacts |
| `evidence_files` | Reports and supporting docs | Artifacts |

---

## Compliance Logic Inside VerifyWise

Once a record is ingested, VerifyWise should evaluate governance completeness.

### Example Rules

- Production models with personal data must include a privacy assessment.  
- High-risk models (EU AI Act) must specify risk category.  
- Every model must have an owner.  
- Production or staging models must define a reproducible environment.  
- Production models must include baseline metrics.

Compliance results are stored with the record and surfaced as badges in the VerifyWise UI.

---

## Incremental Sync

### Process
1. Query model versions from MLflow and check timestamps.  
2. Compare against VerifyWise stored timestamps.  
3. Only re-ingest models that are new, updated, or have changed stages.

This avoids redundant pulls and reduces server load.

---

## Persistence

### Required Entities

1. **Model**
   - Logical model identity and purpose.  
2. **Model Version**
   - Core record with lifecycle, metrics, lineage, and compliance fields.  
3. **Supporting Tables/Columns**
   - `metrics`, `hyperparameters`, `artifact_manifest`, `evidence_files`, `runtime_environment`.  
4. **Sync Audit**
   - Logs ingestion events with timestamps, source URIs, and credentials used.

Historical updates (e.g., Staging → Production) must either:
- Update lifecycle stage with a timestamped event record, or  
- Create a new deployment event entry for traceability.

---

## Security & Isolation

### Credentials
- Must be stored in VerifyWise’s secure secrets store.
- Never logged or exposed to other tenants.

### Artifacts
- Treat all artifacts as untrusted binaries.
- Never execute or import model files.
- Hash artifacts for integrity checks in a sandboxed environment.

### Data Minimization
- Only ingest governance-relevant metadata.
- Do not ingest full datasets or PII.

### Air-Gapped Support
- Must operate without public network access.
- Artifact URIs may reference any supported storage backend (S3, GCS, Azure Blob, NFS, local disk).

---

## Error Handling & Resilience

- If a model version cannot be fetched, store a partial record marked **incomplete**.  
- Log the failure reason in the audit trail.  
- Missing compliance fields should be treated as governance warnings, **not ingestion errors**.

---

## Benefits

This integration allows VerifyWise to:

- Automatically build a live **AI model inventory**.  
- Maintain verifiable **model lineage** and **evidence trails**.  
- Detect **compliance gaps** in real time.  
- Support regulatory readiness for **EU AI Act**, **ISO 42001**, and **NIST AI RMF**.  
- Provide provable, auditable traceability from training to deployment.

By integrating directly with MLflow, VerifyWise becomes the governance layer on top of the existing MLOps workflow — no duplicate tracking, no manual forms, and full compliance visibility.

