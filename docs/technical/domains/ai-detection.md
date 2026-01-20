# AI Detection System

## Overview

The AI Detection domain provides repository scanning capabilities to identify AI/ML libraries, dependencies, API calls, secrets, model references, RAG components, and AI agents within codebases. It uses pattern matching against 100+ known AI technologies and provides governance workflows for compliance tracking.

## Key Features

- GitHub repository scanning (public and private)
- 100+ AI/ML library pattern detection
- Model security scanning for serialized model files
- Real-time scan progress tracking
- Governance status workflows (review, approve, flag)
- AI Bill of Materials (AI-BOM) export
- EU AI Act compliance mapping
- Dependency graph visualization

## Database Schema

### Scans Table

```
{tenant}.ai_detection_scans
├── id (PK, SERIAL)
├── repository_url (VARCHAR(500) NOT NULL)
├── repository_owner (VARCHAR(255) NOT NULL)
├── repository_name (VARCHAR(255) NOT NULL)
├── default_branch (VARCHAR(100), default: 'main')
├── status (VARCHAR(50), default: 'pending')
├── findings_count (INTEGER, default: 0)
├── files_scanned (INTEGER, default: 0)
├── total_files (INTEGER)
├── started_at (TIMESTAMPTZ)
├── completed_at (TIMESTAMPTZ)
├── duration_ms (INTEGER)
├── error_message (TEXT)
├── triggered_by (INTEGER NOT NULL, FK → users)
├── cache_path (VARCHAR(255))
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### Findings Table

```
{tenant}.ai_detection_findings
├── id (PK, SERIAL)
├── scan_id (FK → ai_detection_scans, CASCADE DELETE)
├── finding_type (VARCHAR(100) NOT NULL)
├── category (VARCHAR(100) NOT NULL)
├── name (VARCHAR(255) NOT NULL)
├── provider (VARCHAR(100))
├── confidence (VARCHAR(20) NOT NULL)
├── risk_level (VARCHAR(20), default: 'medium')
├── description (TEXT)
├── documentation_url (VARCHAR(500))
├── file_count (INTEGER, default: 1)
├── file_paths (JSONB)
├── license_id, license_name, license_risk, license_source
├── governance_status (VARCHAR(20))
├── governance_updated_at, governance_updated_by
├── severity, cwe_id, cwe_name (security fields)
├── owasp_ml_id, owasp_ml_name (ML security)
├── threat_type, operator_name, module_name
└── created_at (TIMESTAMPTZ)

Constraints:
└── UNIQUE(scan_id, name, provider)
```

### GitHub Tokens Table

```
{tenant}.github_tokens
├── id (PK, SERIAL)
├── encrypted_token (TEXT NOT NULL)
├── token_name (VARCHAR(100))
├── created_by (INTEGER NOT NULL)
├── created_at, updated_at (TIMESTAMPTZ)
└── last_used_at (TIMESTAMPTZ)
```

## Enums

### Scan Status

```typescript
type ScanStatus =
  | 'pending'    // Queued for processing
  | 'cloning'    // Cloning repository
  | 'scanning'   // Analyzing files
  | 'completed'  // Successfully finished
  | 'failed'     // Error occurred
  | 'cancelled'; // User cancelled
```

### Finding Types

```typescript
type FindingType =
  | 'library'       // Import statements
  | 'dependency'    // Dependency file entries
  | 'api_call'      // SDK method invocations
  | 'secret'        // Hardcoded credentials
  | 'model_ref'     // Model references (Hugging Face)
  | 'rag_component' // Vector DBs, embeddings
  | 'agent'         // AI agent frameworks
  | 'model_security'; // Threats in model files
```

### Confidence Levels

| Level | Description |
|-------|-------------|
| `high` | Definitive AI/ML library, no false positive risk |
| `medium` | Likely AI/ML but could have other uses |
| `low` | Possibly AI/ML, requires context |

### Risk Levels

| Level | Criteria |
|-------|----------|
| `high` | Data leakage threat (cloud APIs, exposed secrets, agents) |
| `medium` | Configurable risk (frameworks, RAG components) |
| `low` | Local processing (local ML libraries) |

### Governance Status

```typescript
type GovernanceStatus = 'reviewed' | 'approved' | 'flagged' | null;
```

## API Endpoints

### Scan Operations

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/ai-detection/scans` | Start scan | Admin, Editor |
| GET | `/ai-detection/scans` | List scan history | All |
| GET | `/ai-detection/scans/:scanId` | Get scan details | All |
| GET | `/ai-detection/scans/:scanId/status` | Poll status | All |
| GET | `/ai-detection/scans/active` | Get active scan | All |
| POST | `/ai-detection/scans/:scanId/cancel` | Cancel scan | Admin, Editor |
| DELETE | `/ai-detection/scans/:scanId` | Delete scan | Admin |

### Findings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-detection/scans/:scanId/findings` | Get findings (paginated) |
| GET | `/ai-detection/scans/:scanId/security-findings` | Security threats |
| GET | `/ai-detection/scans/:scanId/security-summary` | Security summary |
| PATCH | `/ai-detection/scans/:scanId/findings/:findingId/governance` | Update governance |

### Analysis & Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-detection/scans/:scanId/export/ai-bom` | Export AI-BOM JSON |
| GET | `/ai-detection/scans/:scanId/dependency-graph` | Dependency graph |
| GET | `/ai-detection/scans/:scanId/compliance` | EU AI Act mapping |
| GET | `/ai-detection/scans/:scanId/governance-summary` | Governance stats |
| GET | `/ai-detection/stats` | Overall statistics |

### Start Scan Request

```json
{
  "repository_url": "https://github.com/owner/repo"
}
```

### Scan Status Response

```json
{
  "status": "scanning",
  "progress": 45,
  "files_scanned": 234,
  "total_files": 520,
  "findings_count": 12
}
```

### Finding Response

```json
{
  "id": 1,
  "finding_type": "library",
  "category": "Cloud AI Provider",
  "name": "openai",
  "provider": "OpenAI",
  "confidence": "high",
  "risk_level": "high",
  "description": "OpenAI Python SDK for GPT models",
  "file_count": 3,
  "file_paths": [
    {"path": "src/ai/chat.py", "line_number": 5, "matched_text": "import openai"}
  ],
  "governance_status": null
}
```

## Detection Patterns

### Supported Technologies (100+)

**Cloud AI Providers (High Risk):**
- OpenAI, Anthropic, Google AI, Microsoft Azure AI
- AWS Bedrock, Cohere, Mistral AI, Replicate
- HuggingFace Inference, Together AI, Groq, Perplexity

**ML Frameworks (Medium/Low Risk):**
- PyTorch, TensorFlow, Keras, JAX
- scikit-learn, MXNet, ONNX
- LangChain, LlamaIndex, Haystack, CrewAI

**File Extensions Scanned:**
```
Python: .py
JavaScript: .js, .mjs, .cjs
TypeScript: .ts, .tsx, .jsx
Java, Go, Ruby, Rust, C/C++, C#
Scala, Kotlin, Swift, R, Julia
```

**Dependency Files:**
```
requirements.txt, setup.py, pyproject.toml
package.json, Cargo.toml, go.mod
pom.xml, build.gradle, Gemfile
```

**Directories Skipped:**
```
node_modules, .git, venv, .venv
__pycache__, dist, build, target
```

### Pattern Examples

**OpenAI Detection:**
```javascript
// Import patterns
/^import\s+openai/m
/^from\s+openai\s+import/m
/require\s*\(\s*['"]openai['"]\s*\)/

// API call patterns
/openai\.ChatCompletion\.create\s*\(/
/openai\.chat\.completions\.create\s*\(/
/client\.beta\.assistants\./

// Secret patterns
/sk-[A-Za-z0-9]{32,}/
/sk-proj-[A-Za-z0-9_-]{32,}/
/OPENAI_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/
```

### Risk Classification

**High Risk (data transmission):**
- All `secret` findings
- All `api_call` findings
- All `agent` findings
- Cloud provider libraries
- Cloud vector databases (Pinecone, Weaviate)

**Medium Risk (configurable):**
- Framework libraries (LangChain, LlamaIndex)
- RAG components

**Low Risk (local processing):**
- Local ML frameworks (PyTorch, TensorFlow)
- Ollama, NVIDIA local inference
- Data processing libraries

## Scanning Process

### Flow

```
1. URL Parsing & Validation
   ├── GitHub URL formats: https, SSH, shorthand
   └── Repository existence check

2. Size Validation
   └── Max repository size: 2.5 GB

3. Git Clone
   ├── Shallow clone: --depth 1
   └── Temp directory: /tmp/verifywise-scan-{timestamp}-{random}

4. File Enumeration
   ├── Walk directory tree
   ├── Skip excluded directories
   └── Filter by supported extensions

5. Pattern Matching
   ├── Code file analysis
   ├── Dependency file parsing
   └── Model file security scan

6. Finding Aggregation
   ├── Deduplicate by name + provider
   └── Aggregate file paths per finding

7. Database Insert
   └── Batch insert findings

8. Cleanup
   └── Remove temp clone directory
```

### Progress Tracking

- In-memory Map for real-time updates
- Database updates every 50 files
- Progress calculation: 5% cloning + 95% scanning
- Stale progress cleanup: every 60 seconds

## Frontend Components

### Page Structure

```
AIDetection/
├── index.tsx           # Main container with routing
├── ScanPage.tsx        # Scan initiation
├── HistoryPage.tsx     # Scan history list
├── ScanDetailsPage.tsx # Finding details (multi-tab)
├── SettingsPage.tsx    # GitHub token config
└── AIDetectionSidebar.tsx
```

### Scan Details Tabs

| Tab | Content |
|-----|---------|
| Libraries | AI/ML library findings |
| Security | Security threats with CWE/OWASP |
| API Calls | REST API invocations |
| Secrets | Exposed credentials |
| Models | Model references |
| RAG | Vector DBs, embeddings |
| Agents | AI agent frameworks |

### Status Polling

```typescript
// Poll every 2-3 seconds during active scan
useEffect(() => {
  const interval = setInterval(async () => {
    const status = await getScanStatus(scanId);
    setProgress(status);
    if (status.status === 'completed' || status.status === 'failed') {
      clearInterval(interval);
    }
  }, 2500);
  return () => clearInterval(interval);
}, [scanId]);
```

## GitHub Integration

### Token Management

- Encrypted storage with AES-256-CBC
- Token formats supported:
  - Classic: `ghp_...` (40+ chars)
  - Fine-grained: `github_pat_...` (30+ chars)
  - OAuth legacy: 40 hex characters
- Last used timestamp tracking
- Admin-only configuration

### Private Repository Access

```typescript
// Token validation
const response = await fetch('https://api.github.com/user', {
  headers: { Authorization: `Bearer ${token}` }
});

// Rate limit headers
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1642089600
```

## Model Security Scanning

### File Types

```
.pt, .pth       # PyTorch
.onnx           # ONNX
.h5, .hdf5      # HDF5/Keras
.safetensors    # Safe Tensors
Serialized Python objects
```

### Threat Detection

| Threat Type | CWE | OWASP ML |
|-------------|-----|----------|
| Unsafe deserialization | CWE-502 | ML-A04 |
| Code injection | CWE-94 | ML-A06 |
| Arbitrary code execution | CWE-913 | ML-A04 |

## Compliance Mapping

### EU AI Act Requirements

The system maps findings to EU AI Act articles:

| Requirement | Article | Detection |
|-------------|---------|-----------|
| Risk Management | Art. 9 | High-risk libraries |
| Data Governance | Art. 10 | Data processing libs |
| Transparency | Art. 13 | API call findings |
| Human Oversight | Art. 14 | Agent findings |
| Cybersecurity | Art. 15 | Security findings |

## Rate Limiting

| Operation | Limit |
|-----------|-------|
| Start scan | 30 per 15 minutes |
| Status polling | Unlimited |
| Finding queries | 100 per minute |

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `services/aiDetection.service.ts` | Core scanning logic |
| `routes/aiDetection.route.ts` | Route definitions |
| `utils/aiDetection.utils.ts` | Database queries |
| `config/aiDetectionPatterns.ts` | Detection patterns |
| `domain.layer/interfaces/i.aiDetection.ts` | Type definitions |

### Frontend

| File | Purpose |
|------|---------|
| `pages/AIDetection/index.tsx` | Main container |
| `pages/AIDetection/ScanPage.tsx` | Scan initiation |
| `pages/AIDetection/ScanDetailsPage.tsx` | Finding details |
| `pages/AIDetection/SettingsPage.tsx` | Token config |
| `repository/aiDetection.repository.ts` | API client |

## Related Documentation

- [Integrations](../infrastructure/integrations.md) - GitHub token setup
- [Model Inventory](./models.md) - Model management
- [Risk Management](./risk-management.md) - Risk tracking
