# AI Detection Feature - Technical Plan Document

## 1. Executive Summary

### 1.1 Overview
AI Detection is a new module in VerifyWise that scans public GitHub repositories to detect AI/ML library usage, providing an inventory of AI technologies in a codebase. This helps organizations understand, track, and govern AI usage for compliance and security purposes.

### 1.2 Goals
- Detect AI/ML libraries and frameworks in codebases
- Provide visibility into "shadow AI" - AI usage that may not be formally tracked
- Support compliance efforts (EU AI Act, internal policies)
- Enable organizations to inventory their AI technology stack

### 1.3 Success Metrics
- Successfully scan and detect AI libraries in public GitHub repositories
- Provide accurate results with configurable confidence levels
- Enable users to maintain scan history for audit purposes

---

## 2. Phase 1 Scope (MVP)

### 2.1 What We're Building
| Feature | Included | Notes |
|---------|----------|-------|
| Public GitHub repo scanning | ✅ | No auth required |
| Technologies/Libraries detection | ✅ | Imports + dependency files (excluding lock files) |
| Manual scan trigger | ✅ | "Detect AI" button |
| Results table with findings | ✅ | Deduplicated, sorted by confidence |
| Summary cards with charts | ✅ | Counts, donut chart by provider |
| Scan history | ✅ | Persisted forever, manual deletion |
| Provider icons | ✅ | Generic icons (no trademarked logos) |
| Background processing | ✅ | Redis queue if available, else async |
| Local repo caching | ✅ | Manual "Clear all cache" button |
| Rate limit warnings | ✅ | GitHub API limits |
| Cancel scan | ✅ | With confirmation dialog |
| Delete scan history | ✅ | Individual scan deletion |
| Re-scan button | ✅ | On results page |

### 2.2 What We're NOT Building (Phase 1)
- GitHub OAuth / private repo support
- API call detection
- Model file detection
- API key/secret detection
- Governance status (Managed/Unmanaged)
- Risk scores
- Diff between scans
- Auto/scheduled scans
- Export to PDF/CSV
- Lock file parsing (yarn.lock, package-lock.json, etc.)
- Pandas/NumPy detection (too generic, high false positive rate)

---

## 3. Future Phases

### 3.1 Phase 2
| Feature | Description |
|---------|-------------|
| API Call Detection | Detect calls to OpenAI, Anthropic, Google AI endpoints |
| API Key Detection | Find hardcoded secrets (`sk-...`, `OPENAI_API_KEY=`) |
| Governance Status | Mark findings as "Reviewed" / "Approved" / "Flagged" |
| Risk Score | High/Medium/Low based on data leakage potential |
| Model File Detection | Detect `.onnx`, `.pt`, `.h5`, `.safetensors` files |
| Link to Model Inventory | Connect findings to existing Model Inventory entries |
| Contextual Pandas/NumPy | Detect only when appearing with actual ML libraries |
| Lock File Parsing | Parse yarn.lock, package-lock.json with proper parsers |

### 3.2 Phase 3
| Feature | Description |
|---------|-------------|
| Malicious Package Check | Cross-reference with vulnerability databases (OSV, NVD) |
| Usage Frequency | Track how often each component appears across scans |
| Extract Model Metadata | Parse model files for metadata |
| Diff Between Scans | Show added/removed findings between scans |
| Auto-create Model Inventory | Generate Model Inventory entries from findings |
| Configurable File Size Limits | Skip files over configurable size |
| GitHub OAuth | Support private repository scanning |
| Scheduled Scans | Periodic re-scanning |
| Webhook Triggers | Scan on new commits |
| Monorepo Support | Scan specific subdirectories |

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  ScanInput  │  │ScanProgress │  │SummaryCards │  │FindingsTable│ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                                   │                                  │
│                          useAIDetection hook                         │
│                                   │                                  │
│                     aiDetection.repository.ts                        │
└───────────────────────────────────┼──────────────────────────────────┘
                                    │ HTTP/REST
┌───────────────────────────────────┼──────────────────────────────────┐
│                           Backend                                    │
│                                   │                                  │
│                      aiDetection.route.ts                            │
│                                   │                                  │
│                      aiDetection.ctrl.ts                             │
│                                   │                                  │
│                    aiDetection.service.ts                            │
│                                   │                                  │
│         ┌─────────────────────────┼─────────────────────────┐       │
│         │                         │                         │        │
│  ┌──────▼──────┐  ┌───────────────▼───────────────┐  ┌─────▼──────┐│
│  │githubFetcher│  │      patternMatcher           │  │resultAggr- ││
│  │  (clone)    │  │ (aiDetectionPatterns.ts)      │  │  egator    ││
│  └─────────────┘  └───────────────────────────────┘  └────────────┘│
│                                   │                                  │
│         ┌─────────────────────────┼─────────────────────────┐       │
│         │                         │                         │        │
│  ┌──────▼──────┐           ┌──────▼──────┐          ┌──────▼──────┐│
│  │Progress     │           │aiDetection  │          │  Redis      ││
│  │Tracker (Map)│           │.utils.ts    │          │  (optional) ││
│  └─────────────┘           └─────────────┘          └─────────────┘│
│                                   │                                  │
│                         PostgreSQL                                   │
│              ┌────────────────────┴────────────────────┐            │
│              │  ai_detection_scans  │  ai_detection_findings        │
│              └─────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Multi-Tenancy
All tables are created within each tenant's schema (not global). Scans and findings are tenant-scoped - users only see their own tenant's data.

### 4.3 Backend Components

#### 4.3.1 Routes (`Servers/routes/aiDetection.route.ts`)
```typescript
router.post("/scan", authenticateJWT, startScan);
router.get("/scans", authenticateJWT, getScans);
router.get("/scans/:id", authenticateJWT, getScanById);
router.get("/scans/:id/status", authenticateJWT, getScanStatus);
router.get("/scans/:id/findings", authenticateJWT, getScanFindings);  // Paginated
router.post("/scans/:id/cancel", authenticateJWT, cancelScan);
router.delete("/scans/:id", authenticateJWT, deleteScan);
router.delete("/cache", authenticateJWT, clearCache);
```

#### 4.3.2 Controller (`Servers/controllers/aiDetection.ctrl.ts`)
- Input validation
- Error handling with STATUS_CODE utility
- Transaction management
- Logging with logProcessing/logSuccess/logFailure
- Rate limiting: one active scan per user

#### 4.3.3 Service (`Servers/services/aiDetection/`)
```
aiDetection/
├── index.ts              # Main service orchestration
├── scanner/
│   ├── index.ts          # Scanner entry point
│   ├── githubFetcher.ts  # Clone/fetch from GitHub
│   ├── fileScanner.ts    # Walk directory, filter files
│   ├── patternMatcher.ts # Match patterns against content
│   └── resultAggregator.ts # Aggregate and deduplicate
├── progressTracker.ts    # In-memory progress tracking
└── types.ts              # TypeScript interfaces
```

#### 4.3.4 Background Processing
- **If Redis available**: Use BullMQ job queue for scan jobs
- **If Redis not available**: Use simple async processing with `setImmediate`
- Check Redis availability at startup and configure accordingly

#### 4.3.5 Progress Tracking
- Use in-memory `Map<scanId, ProgressState>` for real-time progress
- Update database periodically (every 10 files or 5 seconds)
- Progress state includes: status, progress %, current file, files scanned, findings count

#### 4.3.6 Detection Patterns (`Servers/config/aiDetectionPatterns.ts`)
TypeScript file with pattern definitions - see Section 6 for full structure.

---

## 5. Database Schema

### 5.1 Tables (Per-Tenant Schema)

> **Note:** These tables are created within each tenant's schema, not in the public schema.

#### ai_detection_scans
```sql
CREATE TABLE ai_detection_scans (
  id SERIAL PRIMARY KEY,
  repository_url VARCHAR(500) NOT NULL,
  repository_owner VARCHAR(255) NOT NULL,
  repository_name VARCHAR(255) NOT NULL,
  default_branch VARCHAR(100) DEFAULT 'main',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- status: pending, cloning, scanning, completed, failed, cancelled
  findings_count INTEGER DEFAULT 0,
  files_scanned INTEGER DEFAULT 0,
  total_files INTEGER,  -- For progress calculation
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  error_message TEXT,
  triggered_by INTEGER NOT NULL,  -- User ID (no FK for flexibility)
  cache_path VARCHAR(255),  -- Relative path only (security)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scans_status ON ai_detection_scans(status);
CREATE INDEX idx_scans_triggered_by ON ai_detection_scans(triggered_by);
CREATE INDEX idx_scans_created_at ON ai_detection_scans(created_at DESC);
CREATE INDEX idx_scans_repo ON ai_detection_scans(repository_owner, repository_name);
```

#### ai_detection_findings
```sql
CREATE TABLE ai_detection_findings (
  id SERIAL PRIMARY KEY,
  scan_id INTEGER NOT NULL REFERENCES ai_detection_scans(id) ON DELETE CASCADE,
  finding_type VARCHAR(100) NOT NULL,
  -- finding_type: library, dependency
  category VARCHAR(100) NOT NULL,
  -- category: technologies (Phase 1), models, api_calls, secrets (future)
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100),
  confidence VARCHAR(20) NOT NULL,
  -- confidence: high, medium, low
  description TEXT,
  documentation_url VARCHAR(500),
  file_count INTEGER DEFAULT 1,  -- Number of files where found
  file_paths JSONB,  -- Array of {path, line_number, matched_text}
  created_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint for deduplication
  UNIQUE(scan_id, name, provider)
);

CREATE INDEX idx_findings_scan_id ON ai_detection_findings(scan_id);
CREATE INDEX idx_findings_confidence ON ai_detection_findings(confidence);
CREATE INDEX idx_findings_provider ON ai_detection_findings(provider);
```

#### file_paths JSONB Structure
```typescript
[
  {
    "path": "src/services/ai/client.py",
    "line_number": 3,
    "matched_text": "import openai"
  },
  {
    "path": "requirements.txt",
    "line_number": 15,
    "matched_text": "openai==1.0.0"
  }
]
```

### 5.2 Migration File
Location: `Servers/database/migrations/YYYYMMDDHHMMSS-create-ai-detection-tables.js`

---

## 6. Detection Patterns

### 6.1 Pattern Structure
```typescript
// Servers/config/aiDetectionPatterns.ts

export interface DetectionPattern {
  name: string;
  provider: string;
  description: string;
  documentationUrl: string;
  confidence: "high" | "medium" | "low";
  patterns: {
    imports?: RegExp[];
    dependencies?: RegExp[];
  };
}

export interface PatternCategory {
  name: string;
  findingType: string;
  patterns: DetectionPattern[];
}
```

### 6.2 Phase 1 Patterns (Technologies/Libraries)

| Provider | Library | Confidence |
|----------|---------|------------|
| OpenAI | openai (Python/Node) | High |
| Anthropic | anthropic | High |
| Google | tensorflow, keras, google-generativeai | High |
| Meta | torch/pytorch | High |
| HuggingFace | transformers, huggingface_hub | High |
| LangChain | langchain, langchain_* | High |
| LlamaIndex | llama_index | High |
| Cohere | cohere | High |
| Replicate | replicate | High |
| AWS | @aws-sdk/client-bedrock, boto3.bedrock | High |
| Microsoft | @azure/openai, azure-ai-openai | High |
| Mistral | mistralai | High |
| scikit-learn | sklearn | High |
| XGBoost | xgboost | High |
| LightGBM | lightgbm | High |
| spaCy | spacy | High |
| NLTK | nltk | High |
| Gensim | gensim | High |
| FastAI | fastai | High |
| JAX | jax, flax | High |
| MXNet | mxnet | High |
| ONNX | onnx, onnxruntime | High |
| MLflow | mlflow | High |
| Weights & Biases | wandb | High |
| Ray | ray | Medium |
| Dask | dask | Medium |

> **Excluded from Phase 1:** Pandas, NumPy (too generic, high false positive rate)

### 6.3 File Extensions to Scan

**Code Files:**
```typescript
const CODE_EXTENSIONS = [
  '.py',           // Python
  '.js', '.mjs', '.cjs',  // JavaScript
  '.ts', '.tsx',   // TypeScript
  '.jsx',          // React
  '.java',         // Java
  '.go',           // Go
  '.rb',           // Ruby
  '.rs',           // Rust
  '.cpp', '.cc', '.c', '.h', '.hpp',  // C/C++
  '.cs',           // C#
  '.scala',        // Scala
  '.kt',           // Kotlin
  '.swift',        // Swift
  '.r', '.R',      // R
  '.jl',           // Julia
];
```

**Dependency Files (Human-Readable Only):**
```typescript
const DEPENDENCY_FILES = [
  'requirements.txt',
  'setup.py',
  'pyproject.toml',
  'Pipfile',
  'environment.yml',
  'conda.yml',
  'package.json',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'Gemfile',
  'mix.exs',
  'deps.edn',
  'Project.toml',  // Julia
];
```

> **Excluded from Phase 1:** Lock files (yarn.lock, package-lock.json, Pipfile.lock, etc.) - complex formats requiring dedicated parsers.

**Directories to Skip:**
```typescript
const SKIP_DIRECTORIES = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'venv',
  '.venv',
  'env',
  '.env',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  'dist',
  'build',
  'target',
  '.next',
  '.nuxt',
  'vendor',
  'bower_components',
  '.tox',
  'eggs',
  '*.egg-info',
  '.idea',
  '.vscode',
];
```

---

## 7. API Endpoints

### 7.1 POST /api/ai-detection/scan

Start a new scan. Only one active scan per user allowed.

**Request:**
```typescript
{
  repository_url: string;  // GitHub URL (various formats accepted)
}
```

**Response (201 Created):**
```typescript
{
  id: number;
  repository_url: string;
  repository_owner: string;
  repository_name: string;
  status: "pending";
  created_at: string;
}
```

**Errors:**
- 400: Invalid repository URL format
- 400: Repository not found or is private
- 409: Another scan is already in progress
- 429: GitHub API rate limit exceeded

### 7.2 GET /api/ai-detection/scans/:id/status

Poll for scan status. Use adaptive polling (see Section 9.5).

**Response (200):**
```typescript
{
  id: number;
  status: "pending" | "cloning" | "scanning" | "completed" | "failed" | "cancelled";
  progress: number;          // 0-100
  current_file?: string;     // File being scanned (truncated)
  files_scanned: number;
  total_files?: number;
  findings_count: number;
  error_message?: string;
}
```

### 7.3 GET /api/ai-detection/scans/:id

Get scan details with summary.

**Response (200):**
```typescript
{
  scan: {
    id: number;
    repository_url: string;
    repository_owner: string;
    repository_name: string;
    status: string;
    findings_count: number;
    files_scanned: number;
    started_at: string;
    completed_at: string;
    duration_ms: number;
    triggered_by: {
      id: number;
      name: string;
      surname: string;
    };
    created_at: string;
  };
  summary: {
    total: number;
    by_confidence: {
      high: number;
      medium: number;
      low: number;
    };
    by_provider: Record<string, number>;
  };
}
```

### 7.4 GET /api/ai-detection/scans/:id/findings

Get paginated findings for a scan.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response (200):**
```typescript
{
  findings: Array<{
    id: number;
    finding_type: string;
    category: string;
    name: string;
    provider: string;
    confidence: string;
    description: string;
    documentation_url: string;
    file_count: number;
    file_paths: Array<{
      path: string;
      line_number: number | null;
      matched_text: string;
    }>;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
```

### 7.5 GET /api/ai-detection/scans

Get scan history (paginated).

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (optional filter)

**Response (200):**
```typescript
{
  scans: Array<{
    id: number;
    repository_url: string;
    repository_owner: string;
    repository_name: string;
    status: string;
    findings_count: number;
    started_at: string;
    completed_at: string;
    duration_ms: number;
    triggered_by: {
      id: number;
      name: string;
    };
    created_at: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
```

### 7.6 POST /api/ai-detection/scans/:id/cancel

Cancel a running scan.

**Response (200):**
```typescript
{
  id: number;
  status: "cancelled";
  message: "Scan cancelled successfully";
}
```

**Errors:**
- 400: Scan is not in progress (already completed/failed/cancelled)
- 404: Scan not found

### 7.7 DELETE /api/ai-detection/scans/:id

Delete a scan and its findings from history.

**Response (200):**
```typescript
{
  message: "Scan deleted successfully";
}
```

**Errors:**
- 400: Cannot delete scan while in progress
- 404: Scan not found

### 7.8 DELETE /api/ai-detection/cache

Clear all cached repositories.

**Response (200):**
```typescript
{
  message: "Cache cleared successfully";
  cleared_size_mb: number;
}
```

---

## 8. Frontend Architecture

### 8.1 File Structure
```
Clients/src/
├── presentation/pages/AIDetection/
│   ├── index.tsx
│   └── components/
│       ├── ScanInput.tsx
│       ├── ScanProgress.tsx
│       ├── SummaryCards.tsx
│       ├── FindingsTable.tsx
│       ├── FileListModal.tsx      # Modal for expanded file list
│       ├── ScanHistory.tsx
│       ├── EmptyState.tsx
│       ├── NoResultsState.tsx     # When scan finds 0 libraries
│       ├── ProviderIcon.tsx
│       └── CancelConfirmModal.tsx
├── application/
│   ├── hooks/useAIDetection.ts
│   └── repository/aiDetection.repository.ts
└── domain/interfaces/i.aiDetection.ts
```

### 8.2 Page States

The page has several states:

1. **Empty State**: No scan history exists
2. **Input Ready**: Has history, ready for new scan
3. **Scan In Progress**: Scan running (shows progress)
4. **Results View**: Scan completed with findings
5. **No Results View**: Scan completed with 0 findings
6. **Error State**: Scan failed

### 8.3 Page Layout (Results View)

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Usage Detection                                    [History]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Repository URL                                           │   │
│  │ ┌─────────────────────────────────────────┐ ┌──────────┐│   │
│  │ │ https://github.com/owner/repo           │ │Detect AI ││   │
│  │ └─────────────────────────────────────────┘ └──────────┘│   │
│  │ Example: https://github.com/owner/repo                   │   │
│  │ ⚠️ GitHub allows 60 requests/hour for public APIs        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Showing results for: owner/repo              [Re-scan]         │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐   │
│  │   Total      │ │  By Provider │ │    By Confidence     │   │
│  │    47        │ │  [Donut     ]│ │  High: 32            │   │
│  │  findings    │ │  [Chart     ]│ │  Medium: 12          │   │
│  │              │ │              │ │  Low: 3              │   │
│  └──────────────┘ └──────────────┘ └──────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Findings (sorted by confidence)             [Search...] │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Name       │Provider│ Confidence │ Files │ Type        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ openai     │ ⬡ OAI │ High       │ 10 ▼  │ Library     │   │
│  │ tensorflow │ ◆ Ggl │ High       │ 5 ▼   │ Library     │   │
│  │ langchain  │ 🦜 LC │ High       │ 3 ▼   │ Dependency  │   │
│  │ ray        │ ◇ Ray │ Medium     │ 2 ▼   │ Library     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Clear Cache]                          Showing 1-10 of 47     │
└─────────────────────────────────────────────────────────────────┘

Note: "▼" in Files column opens modal with file list
      File paths are truncated, with copy button in modal
```

### 8.4 Empty State
```
┌─────────────────────────────────────────────────────────────────┐
│  AI Usage Detection                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         📡                                      │
│                                                                 │
│              Connect your first repository                      │
│                                                                 │
│     Scan a public GitHub repository to detect AI and ML        │
│            technologies in your codebase.                       │
│                                                                 │
│  ┌─────────────────────────────────────────┐ ┌──────────┐      │
│  │ Enter GitHub repository URL             │ │Detect AI │      │
│  └─────────────────────────────────────────┘ └──────────┘      │
│  Example: https://github.com/owner/repo                        │
│  ⚠️ GitHub allows 60 requests/hour for public APIs              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.5 Scan Progress State
```
┌─────────────────────────────────────────────────────────────────┐
│  AI Usage Detection                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Scanning repository...                              [Cancel]   │
│                                                                 │
│  ████████████████░░░░░░░░░░░░░░  45%                           │
│                                                                 │
│  📁 Scanning: ...services/ai/embeddings.py                     │
│  📊 Files scanned: 127 / 283                                   │
│  🔍 Findings so far: 12                                        │
│                                                                 │
│  You can navigate away - the scan will continue in background. │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.6 No Results State
```
┌─────────────────────────────────────────────────────────────────┐
│  AI Usage Detection                                    [History]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Scan completed for: owner/repo                                 │
│                                                                 │
│                         ✓                                       │
│                                                                 │
│              No AI technologies detected                        │
│                                                                 │
│     The scan completed successfully but did not find any        │
│     AI/ML libraries in this repository.                         │
│                                                                 │
│  ┌─────────────────────────────────────────┐ ┌──────────┐      │
│  │ Enter GitHub repository URL             │ │Detect AI │      │
│  └─────────────────────────────────────────┘ └──────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.7 File List Modal
```
┌─────────────────────────────────────────────────────────────────┐
│  openai found in 10 files                                   [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ File Path                           │ Line │ Match    [📋]│   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ src/services/ai/client.py           │  3   │ import.. [📋]│   │
│  │ src/services/ai/embeddings.py       │  7   │ from op..[📋]│   │
│  │ src/api/handlers/chat.py            │  12  │ import.. [📋]│   │
│  │ requirements.txt                    │  15  │ openai=..[📋]│   │
│  │ ...                                 │      │          [📋]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [📋] = Copy full path button                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.8 Provider Icons (Generic)

| Provider | Icon | Color | Notes |
|----------|------|-------|-------|
| OpenAI | ⬡ (hexagon) | #10A37F | Generic, no trademark |
| Anthropic | ◈ (diamond) | #D97706 | Generic |
| Google | ◆ (filled diamond) | #4285F4 | Generic |
| Meta | ▣ (square) | #0668E1 | Generic |
| HuggingFace | 🤗 | #FFD21E | Emoji is fine |
| AWS | ▲ (triangle) | #FF9900 | Generic |
| Microsoft | ⊞ (window) | #00A4EF | Generic |
| LangChain | 🦜 | #1C3C3C | Emoji is fine |
| scikit-learn | ◉ (circle) | #F89939 | Generic |
| Other | </> | #6B7280 | Code brackets |

---

## 9. Scan Workflow

### 9.1 Sequence Diagram

```
User          Frontend        Backend         GitHub        FileSystem
  │               │               │              │              │
  │ Enter URL     │               │              │              │
  │──────────────>│               │              │              │
  │               │ POST /scan    │              │              │
  │               │──────────────>│              │              │
  │               │               │ Validate URL │              │
  │               │               │──────────────│              │
  │               │               │              │              │
  │               │               │ Check repo exists           │
  │               │               │─────────────>│              │
  │               │               │<─────────────│              │
  │               │               │              │              │
  │               │  201 Created  │              │              │
  │               │<──────────────│              │              │
  │               │               │              │              │
  │               │               │══════════════════════════════
  │               │               │  Background Job (async)     │
  │               │               │══════════════════════════════
  │               │               │              │              │
  │               │               │ Clone repo   │              │
  │               │               │─────────────────────────────>│
  │               │               │              │              │
  │  Poll status  │               │              │              │
  │<──────────────│               │              │              │
  │               │ GET /status   │              │              │
  │               │──────────────>│              │              │
  │               │ {status:cloning,progress:10} │              │
  │               │<──────────────│              │              │
  │               │               │              │              │
  │               │               │ Count files  │              │
  │               │               │<─────────────────────────────│
  │               │               │              │              │
  │               │               │ Scan files & match patterns │
  │               │               │<─────────────────────────────│
  │               │               │              │              │
  │               │ GET /status   │              │              │
  │               │──────────────>│              │              │
  │               │{status:scanning,progress:45} │              │
  │               │<──────────────│              │              │
  │               │               │              │              │
  │               │               │ Aggregate results           │
  │               │               │──────────────│              │
  │               │               │              │              │
  │               │ GET /status   │              │              │
  │               │──────────────>│              │              │
  │               │{status:completed,progress:100}              │
  │               │<──────────────│              │              │
  │               │               │              │              │
  │               │ GET /scan/:id │              │              │
  │               │──────────────>│              │              │
  │               │ {scan, summary}              │              │
  │               │<──────────────│              │              │
  │               │               │              │              │
  │               │ GET /findings │              │              │
  │               │──────────────>│              │              │
  │               │ {findings, pagination}       │              │
  │               │<──────────────│              │              │
  │               │               │              │              │
  │ Display results               │              │              │
  │<──────────────│               │              │              │
```

### 9.2 URL Parsing

```typescript
// Supported formats:
// https://github.com/owner/repo
// https://github.com/owner/repo.git
// https://github.com/owner/repo?tab=readme
// https://github.com/owner/repo#readme
// http://github.com/owner/repo
// github.com/owner/repo
// owner/repo

function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  // Trim whitespace
  input = input.trim();

  // Remove protocol
  input = input.replace(/^https?:\/\//, '');

  // Remove trailing .git
  input = input.replace(/\.git$/, '');

  // Remove query params and fragments
  input = input.replace(/[?#].*$/, '');

  // Remove trailing slash
  input = input.replace(/\/$/, '');

  // Try github.com/owner/repo format
  const urlMatch = input.match(/^github\.com\/([^\/]+)\/([^\/]+)$/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }

  // Try owner/repo format (no github.com)
  const shortMatch = input.match(/^([^\/]+)\/([^\/]+)$/);
  if (shortMatch && !input.includes('.')) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }

  return null;
}
```

### 9.3 GitHub Repository Validation

```typescript
async function validateRepository(owner: string, repo: string): Promise<{
  valid: boolean;
  error?: string;
  rateLimit?: { remaining: number; reset: Date };
}> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);

    // Extract rate limit info
    const rateLimit = {
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: new Date(parseInt(response.headers.get('x-ratelimit-reset') || '0') * 1000)
    };

    if (response.status === 200) {
      return { valid: true, rateLimit };
    } else if (response.status === 404) {
      return { valid: false, error: 'Repository not found or is private', rateLimit };
    } else if (response.status === 403 && rateLimit.remaining === 0) {
      return { valid: false, error: `Rate limit exceeded. Try again after ${rateLimit.reset.toLocaleTimeString()}`, rateLimit };
    } else {
      return { valid: false, error: 'Failed to validate repository', rateLimit };
    }
  } catch (error) {
    return { valid: false, error: 'Network error while validating repository' };
  }
}
```

### 9.4 Repository Cloning

```typescript
async function cloneRepository(
  owner: string,
  repo: string,
  scanId: number,
  tenantId: string
): Promise<string> {
  const url = `https://github.com/${owner}/${repo}.git`;

  // Create secure path within temp directory
  const basePath = path.join(os.tmpdir(), 'verifywise-ai-detection', tenantId);
  const targetPath = path.join(basePath, `scan-${scanId}`);

  // Ensure base directory exists
  await fs.mkdir(basePath, { recursive: true });

  // Shallow clone (depth 1) for faster download
  await execAsync(`git clone --depth 1 ${url} ${targetPath}`, {
    timeout: 5 * 60 * 1000  // 5 minute timeout for clone
  });

  // Return relative path for storage (security)
  return `${tenantId}/scan-${scanId}`;
}
```

### 9.5 Adaptive Polling

Frontend polling interval adjusts based on scan progress:

```typescript
function getPollingInterval(progress: number, status: string): number {
  if (status === 'completed' || status === 'failed' || status === 'cancelled') {
    return 0; // Stop polling
  }

  if (progress < 10) {
    return 3000;  // 3 seconds during clone phase
  } else if (progress < 50) {
    return 2000;  // 2 seconds during early scanning
  } else if (progress < 90) {
    return 1500;  // 1.5 seconds during main scanning
  } else {
    return 1000;  // 1 second near completion
  }
}
```

### 9.6 Scan Timeout

Maximum scan duration: **30 minutes**

If scan exceeds timeout:
- Mark status as "failed"
- Set error_message: "Scan timed out after 30 minutes"
- Clean up any partial results (discard)
- Notify user via status endpoint

---

## 10. Error Handling

### 10.1 Error Types

| Error | HTTP Code | Message |
|-------|-----------|---------|
| Invalid URL | 400 | "Invalid GitHub repository URL format" |
| Repo not found | 400 | "Repository not found or is private" |
| Scan in progress | 409 | "Another scan is already in progress" |
| Rate limited | 429 | "GitHub API rate limit exceeded. Try again at {time}." |
| Clone failed | 500 | "Failed to clone repository" |
| Scan failed | 500 | "An error occurred during scanning" |
| Scan timeout | 500 | "Scan timed out after 30 minutes" |
| Scan not found | 404 | "Scan not found" |
| Cannot cancel | 400 | "Scan is not in progress" |
| Cannot delete | 400 | "Cannot delete scan while in progress" |

### 10.2 Error Recovery

- If scan fails mid-way: **Discard all partial results**
- Update scan status to "failed" with error message
- Frontend displays error state with message
- User can retry by starting a new scan

### 10.3 Rate Limit Display

Show warning in UI:
```
⚠️ GitHub allows 60 requests/hour for public APIs. You have {remaining} requests remaining.
```

---

## 11. Module Integration (AppSwitcher + Sidebar)

AI Detection is a **top-level module** like "AI Governance" (main) and "LLM Evals" (evals). It requires:
1. Entry in AppSwitcher (the vertical icon bar)
2. Its own dedicated Sidebar component
3. Registration in ContextSidebar
4. Optional: Context provider for sidebar state

### 11.1 AppSwitcher Integration

**File:** `Clients/src/presentation/components/AppSwitcher/index.tsx`

Add to modules array:
```typescript
// In AppSwitcher/index.tsx
import { Shield, FlaskConical, Network, Radar } from "lucide-react";

const modules: ModuleItem[] = [
  {
    id: "main",
    icon: <Shield size={16} strokeWidth={1.5} />,
    label: "Governance",
    description: "Centralized AI governance, risk, and compliance platform",
  },
  {
    id: "evals",
    icon: <FlaskConical size={16} strokeWidth={1.5} />,
    label: "LLM Evals",
    description: "Evaluate LLM quality, performance and reliability over time",
  },
  {
    id: "ai-detection",  // NEW
    icon: <Radar size={16} strokeWidth={1.5} />,
    label: "AI Detection",
    description: "Scan repositories to detect AI/ML library usage",
  },
  {
    id: "gateway",
    icon: <Network size={16} strokeWidth={1.5} />,
    label: "Gateway",
    description: "Control, monitor, and govern all LLM traffic across your organization.",
    disabled: true,
  },
];
```

**File:** `Clients/src/application/redux/ui/uiSlice.ts`

Update AppModule type:
```typescript
export type AppModule = "main" | "evals" | "ai-detection" | "gateway";
```

### 11.2 AIDetectionSidebar Component

**File:** `Clients/src/presentation/pages/AIDetection/AIDetectionSidebar.tsx`

Create a dedicated sidebar following the EvalsSidebar pattern:

```typescript
import {
  Radar,
  History,
} from "lucide-react";
import SidebarShell, {
  SidebarMenuItem,
  RecentSection,
} from "../../components/Sidebar/SidebarShell";

interface RecentScan {
  id: number;
  name: string;  // repo name
  url: string;
}

interface AIDetectionSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  recentScans?: RecentScan[];
  onScanClick?: (scanId: number) => void;
  disabled?: boolean;
}

export default function AIDetectionSidebar({
  activeTab,
  onTabChange,
  recentScans = [],
  onScanClick,
  disabled = false,
}: AIDetectionSidebarProps) {
  // Menu items for AI Detection
  const flatItems: SidebarMenuItem[] = [
    {
      id: "scan",
      label: "Scan",
      value: "scan",
      icon: <Radar size={16} strokeWidth={1.5} />,
      disabled: false,
    },
    {
      id: "history",
      label: "History",
      value: "history",
      icon: <History size={16} strokeWidth={1.5} />,
      disabled: false,
    },
  ];

  // Recent sections
  const recentSections: RecentSection[] = [
    {
      title: "Recent scans",
      items: recentScans.map((scan) => ({
        id: String(scan.id),
        name: scan.name,
        onClick: () => onScanClick?.(scan.id),
      })),
    },
  ];

  // Check if item is active
  const isItemActive = (item: SidebarMenuItem): boolean => {
    return item.value === activeTab || item.id === activeTab;
  };

  // Handle item click
  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.value) {
      onTabChange(item.value);
    }
  };

  return (
    <SidebarShell
      flatItems={flatItems}
      recentSections={recentSections}
      isItemActive={isItemActive}
      onItemClick={handleItemClick}
      showReadyToSubscribe={false}
      enableFlyingHearts={false}
    />
  );
}
```

### 11.3 ContextSidebar Integration

**File:** `Clients/src/presentation/components/ContextSidebar/index.tsx`

Add AI Detection to the switch statement:

```typescript
import AIDetectionSidebar from "../../pages/AIDetection/AIDetectionSidebar";
import { useAIDetectionSidebarContextSafe } from "../../../application/contexts/AIDetectionSidebar.context";

const ContextSidebar: FC<ContextSidebarProps> = ({
  activeModule,
  // ... other props
}) => {
  const aiDetectionSidebarContext = useAIDetectionSidebarContextSafe();
  // ... existing code

  switch (activeModule) {
    case "main":
      return <Sidebar /* ... */ />;

    case "evals":
      return <EvalsSidebar /* ... */ />;

    case "ai-detection":  // NEW
      return (
        <AIDetectionSidebar
          activeTab={aiDetectionSidebarContext?.activeTab ?? "scan"}
          onTabChange={aiDetectionSidebarContext?.onTabChange ?? (() => {})}
          recentScans={aiDetectionSidebarContext?.recentScans ?? []}
          onScanClick={aiDetectionSidebarContext?.onScanClick}
        />
      );

    case "gateway":
      return <GatewaySidebar />;

    default:
      return <Sidebar /* ... */ />;
  }
};
```

### 11.4 Context Provider (Optional)

**File:** `Clients/src/application/contexts/AIDetectionSidebar.context.tsx`

```typescript
import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface RecentScan {
  id: number;
  name: string;
  url: string;
}

interface AIDetectionSidebarContextType {
  activeTab: string;
  onTabChange: (tab: string) => void;
  recentScans: RecentScan[];
  setRecentScans: (scans: RecentScan[]) => void;
  onScanClick?: (scanId: number) => void;
}

const AIDetectionSidebarContext = createContext<AIDetectionSidebarContextType | null>(null);

export function AIDetectionSidebarProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("scan");
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  const onTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return (
    <AIDetectionSidebarContext.Provider
      value={{
        activeTab,
        onTabChange,
        recentScans,
        setRecentScans,
      }}
    >
      {children}
    </AIDetectionSidebarContext.Provider>
  );
}

export function useAIDetectionSidebarContext() {
  const context = useContext(AIDetectionSidebarContext);
  if (!context) {
    throw new Error("useAIDetectionSidebarContext must be used within AIDetectionSidebarProvider");
  }
  return context;
}

export function useAIDetectionSidebarContextSafe() {
  return useContext(AIDetectionSidebarContext);
}
```

### 11.5 Routes Configuration

**File:** `Clients/src/application/config/routes.tsx`

Add AI Detection routes:
```typescript
{
  path: "/ai-detection",
  element: <AIDetectionPage />,
},
{
  path: "/ai-detection/scan/:scanId",
  element: <AIDetectionPage />,
},
```

### 11.6 Sidebar Menu Structure

| Tab | Icon | Description |
|-----|------|-------------|
| Scan | `Radar` | Main scan input and results view |
| History | `History` | List of past scans |

> **Note:** "Clear cache" is a button on the Scan page, not a sidebar entry.

### 11.7 Files to Create/Modify

| File | Action |
|------|--------|
| `AppSwitcher/index.tsx` | Add ai-detection module |
| `redux/ui/uiSlice.ts` | Add to AppModule type |
| `ContextSidebar/index.tsx` | Add switch case |
| `AIDetection/AIDetectionSidebar.tsx` | Create new |
| `contexts/AIDetectionSidebar.context.tsx` | Create new |
| `config/routes.tsx` | Add routes |

---

## 12. Testing Strategy

### 12.1 Unit Tests

| Component | Tests |
|-----------|-------|
| URL Parser | Valid URLs, invalid URLs, edge cases (query params, fragments, trailing slashes) |
| Pattern Matcher | Each pattern category, confidence levels, edge cases |
| Result Aggregator | Deduplication, summary calculation, file path grouping |
| Progress Tracker | Status updates, progress calculation |

### 12.2 Integration Tests

| Test | Description |
|------|-------------|
| Full scan workflow | End-to-end scan with test repository |
| Database operations | CRUD for scans and findings |
| Error scenarios | Invalid repo, rate limit, clone failure, timeout |
| Cancel scan | Cancel during clone, cancel during scan |
| Concurrent scan prevention | Second scan rejected while first in progress |

### 12.3 Test Repository

Create/use a test repository with known AI libraries:
- `test-ai-detection-repo` with:
  - Python file with `import openai`
  - Python file with `from tensorflow import keras`
  - JS file with `import { Anthropic } from '@anthropic-ai/sdk'`
  - `requirements.txt` with tensorflow, langchain
  - `package.json` with openai, @langchain/core
  - Empty file (no AI) for false positive testing

---

## 13. Security Considerations

### 13.1 Input Validation
- Sanitize repository URLs (remove query params, fragments)
- Validate against path traversal in URLs
- Limit URL length (500 chars max)
- Reject URLs that don't match GitHub pattern

### 13.2 File System Safety
- Store only relative paths in database (not full system paths)
- All cache paths must be within `os.tmpdir()/verifywise-ai-detection/`
- Validate cache path before any file operations
- Never execute code from cloned repos
- Clean up on error

### 13.3 Tenant Isolation
- All tables in tenant-specific schema
- Scans filtered by tenant context
- Cache paths include tenant ID
- Users only see their own scans

### 13.4 Rate Limiting
- One active scan per user
- GitHub API rate limits displayed to user

---

## 14. Performance Considerations

### 14.1 Large Repositories
- Skip binary files (images, compiled code, etc.)
- Skip files in SKIP_DIRECTORIES
- Implement 30-minute timeout
- Stream file reading (don't load entire file into memory)

### 14.2 Background Processing
- Return scan ID immediately (don't block HTTP request)
- Process in background via Redis queue or async
- Use shallow clone (`--depth 1`) for faster download

### 14.3 Progress Tracking
- In-memory Map for real-time updates
- Batch database updates (every 10 files or 5 seconds)
- Don't update DB for every file scanned

### 14.4 Caching
- Keep cloned repo until manual clear
- Cache path stored in database
- Clear cache endpoint removes all files for tenant

---

## 15. Implementation Order

### 15.1 Phase 1 Implementation Steps

1. **Database Migration** (Day 1)
   - Create migration file for existing tenants
   - **Update `Servers/scripts/createNewTenant.ts`** to include AI Detection tables for new organizations
   - Test migration up/down

2. **Detection Patterns** (Day 1)
   - Create `aiDetectionPatterns.ts`
   - Define all Phase 1 patterns with regex
   - Add pattern tests

3. **Backend Core** (Days 2-3)
   - Models (Sequelize)
   - Utils (database queries)
   - Progress tracker (in-memory Map)
   - Scanner service (clone, scan, match, aggregate)
   - Controller with all endpoints
   - Routes

4. **Frontend Core** (Days 4-5)
   - Interfaces
   - Repository (API calls)
   - useAIDetection hook with adaptive polling
   - Page components (all states)
   - File list modal
   - Cancel confirmation modal

5. **Integration** (Day 6)
   - Context switcher update
   - Routes config
   - Provider icons
   - End-to-end testing

6. **Testing & Polish** (Day 7)
   - Unit tests
   - Integration tests
   - Error handling edge cases
   - UI polish

---

## 16. File Locations Summary

```
Servers/
├── routes/aiDetection.route.ts
├── controllers/aiDetection.ctrl.ts
├── services/aiDetection/
│   ├── index.ts
│   ├── scanner/
│   │   ├── index.ts
│   │   ├── githubFetcher.ts
│   │   ├── fileScanner.ts
│   │   ├── patternMatcher.ts
│   │   └── resultAggregator.ts
│   ├── progressTracker.ts
│   └── types.ts
├── config/aiDetectionPatterns.ts
├── utils/aiDetection.utils.ts
├── domain.layer/models/aiDetection/
│   ├── scan.model.ts
│   ├── finding.model.ts
│   └── index.ts
├── database/migrations/
│   └── YYYYMMDDHHMMSS-create-ai-detection-tables.js
└── scripts/createNewTenant.ts  # UPDATE: Add AI Detection tables

Clients/src/
├── presentation/
│   ├── pages/AIDetection/
│   │   ├── index.tsx
│   │   ├── AIDetectionSidebar.tsx      # Module sidebar
│   │   └── components/
│   │       ├── ScanInput.tsx
│   │       ├── ScanProgress.tsx
│   │       ├── SummaryCards.tsx
│   │       ├── FindingsTable.tsx
│   │       ├── FileListModal.tsx
│   │       ├── ScanHistory.tsx
│   │       ├── EmptyState.tsx
│   │       ├── NoResultsState.tsx
│   │       ├── ProviderIcon.tsx
│   │       └── CancelConfirmModal.tsx
│   └── components/
│       ├── AppSwitcher/index.tsx       # UPDATE: Add module
│       └── ContextSidebar/index.tsx    # UPDATE: Add switch case
├── application/
│   ├── hooks/useAIDetection.ts
│   ├── repository/aiDetection.repository.ts
│   ├── contexts/AIDetectionSidebar.context.tsx  # NEW
│   ├── redux/ui/uiSlice.ts             # UPDATE: AppModule type
│   └── config/routes.tsx               # UPDATE: Add routes
└── domain/interfaces/i.aiDetection.ts
```

---

## 17. Decisions Summary

| Question | Decision |
|----------|----------|
| Pattern file format | TypeScript (regex support, type safety) |
| Pattern file location | `Servers/config/aiDetectionPatterns.ts` |
| Page route | `/ai-detection` |
| Sidebar label | "AI Detection" |
| Page header | "AI Usage Detection" |
| Scan button text | "Detect AI" |
| Icon | Radar (lucide-react) |
| Background processing | Redis queue if available, else async |
| Cache cleanup | Manual "Clear all cache" button |
| Re-scan behavior | Creates new scan record (history preserved) |
| Diff between scans | Future phase |
| Scan timeout | 30 minutes |
| Concurrent scans | One at a time per user |
| History retention | Forever, manual deletion |
| Findings deduplication | 1 row per library, file count + expandable modal |
| File path display | Truncated with copy button in modal |
| Default sort | By confidence (High → Low) |
| Empty results | "No AI technologies detected" message |
| Repo display in history | Full URL |
| In-progress navigation | Auto-show progress on return |
| Chart interaction | No filtering on click |
| Cancel scan | With confirmation dialog |
| Error recovery | Discard partial results |
| Lock files | Skip in Phase 1 |
| Pandas/NumPy | Exclude in Phase 1 |
| Provider icons | Generic symbols (no trademarked logos) |

---

## 18. Clean Code Patterns (VerifyWise Standards)

This section documents the clean code patterns used throughout VerifyWise that the AI Detection feature MUST follow to ensure consistency, maintainability, and proper multi-tenancy support.

### 18.1 Layered Architecture

VerifyWise uses a **layered architecture** with clear separation of concerns:

```
Routes → Controllers → Services → Utils/Queries → Models → Database
   ↓          ↓            ↓            ↓           ↓
  HTTP    Orchestration  Business   Data Access   Schema
 Layer      Layer        Logic        Layer      Definition
```

**File Location Pattern:**
- Routes: `Servers/routes/{entity}.route.ts`
- Controllers: `Servers/controllers/{entity}.ctrl.ts`
- Services: `Servers/services/{entity}.service.ts` or `Servers/services/{entity}/index.ts`
- Utils: `Servers/utils/{entity}.utils.ts`
- Models: `Servers/domain.layer/models/{entity}/{entity}.model.ts`
- Interfaces: `Servers/domain.layer/interfaces/i.{entity}.ts`

### 18.2 Controller Pattern

Controllers handle HTTP request/response orchestration:

```typescript
// Servers/controllers/aiDetection.ctrl.ts

import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { sequelize } from "../database/db";
import {
  logFailure,
  logProcessing,
  logSuccess,
} from "../utils/logger/logHelper";
import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../domain.layer/exceptions/custom.exception";

export async function startScan(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();

  logProcessing({
    description: "starting startScan",
    functionName: "startScan",
    fileName: "aiDetection.ctrl.ts",
  });

  try {
    const { userId, tenantId } = req;
    const { repository_url } = req.body;

    // Input validation
    if (!repository_url) {
      throw new ValidationException("Repository URL is required", "repository_url");
    }

    // Business logic via service layer
    const scan = await aiDetectionService.startScan(
      repository_url,
      { userId: userId!, tenantId: tenantId!, role: req.role! },
      transaction
    );

    await transaction.commit();

    await logSuccess({
      eventType: "Create",
      description: `Started scan for ${repository_url}`,
      functionName: "startScan",
      fileName: "aiDetection.ctrl.ts",
    });

    return res.status(201).json(STATUS_CODE[201](scan));

  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      await logFailure({
        eventType: "Create",
        description: `Validation failed: ${error.message}`,
        functionName: "startScan",
        fileName: "aiDetection.ctrl.ts",
        error: error as Error,
      });
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      return res.status(error.statusCode).json(STATUS_CODE[error.statusCode](error.message));
    }

    await logFailure({
      eventType: "Create",
      description: "Failed to start scan",
      functionName: "startScan",
      fileName: "aiDetection.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
```

**Controller Responsibilities:**
1. Extract data from request (`req.body`, `req.params`, `req.query`)
2. Get tenant context (`req.tenantId`, `req.userId`, `req.role`)
3. Create transaction
4. Call service/utils with tenant context
5. Log processing/success/failure
6. Return formatted response using `STATUS_CODE`
7. Handle errors by exception type

### 18.3 Service Layer Pattern

Services contain business logic, separated from HTTP handling:

```typescript
// Servers/services/aiDetection/index.ts

import { Transaction } from "sequelize";
import {
  ValidationException,
  BusinessLogicException,
  DatabaseException,
} from "../../domain.layer/exceptions/custom.exception";

export interface ServiceContext {
  userId: number;
  role: string;
  tenantId: string;
}

/**
 * Start a new AI detection scan.
 *
 * @param repositoryUrl - The GitHub repository URL to scan
 * @param ctx - Service context containing userId, role, and tenantId
 * @param transaction - Database transaction for atomicity
 * @returns The created scan object
 * @throws {ValidationException} If URL is invalid
 * @throws {BusinessLogicException} If scan already in progress
 * @throws {DatabaseException} If creation fails
 */
export async function startScan(
  repositoryUrl: string,
  ctx: ServiceContext,
  transaction: Transaction
): Promise<ScanModel> {
  // Validate URL format
  const parsed = parseGitHubUrl(repositoryUrl);
  if (!parsed) {
    throw new ValidationException("Invalid GitHub repository URL format", "repository_url", repositoryUrl);
  }

  // Check for existing active scan (one at a time per user)
  const activeScan = await getActiveScanForUser(ctx.userId, ctx.tenantId);
  if (activeScan) {
    throw new BusinessLogicException(
      "Another scan is already in progress",
      "SCAN_IN_PROGRESS",
      { scanId: activeScan.id }
    );
  }

  // Create scan record
  const scan = await createScanQuery({
    repository_url: repositoryUrl,
    repository_owner: parsed.owner,
    repository_name: parsed.repo,
    status: "pending",
    triggered_by: ctx.userId,
  }, ctx.tenantId, transaction);

  if (!scan) {
    throw new DatabaseException("Failed to create scan", "INSERT", "ai_detection_scans");
  }

  // Trigger background job
  await triggerScanJob(scan.id, ctx.tenantId);

  return scan;
}
```

**Service Responsibilities:**
1. Business logic and validation
2. Accept `ServiceContext` with userId, role, tenantId
3. Accept `Transaction` for atomicity
4. Throw typed exceptions for different error scenarios
5. Return domain objects
6. JSDoc with `@param`, `@returns`, `@throws`

### 18.4 Exception Pattern

Use the established exception hierarchy:

```typescript
// Import from: Servers/domain.layer/exceptions/custom.exception.ts

import {
  ValidationException,     // 400 - Input validation errors
  NotFoundException,       // 404 - Resource not found
  UnauthorizedException,   // 401 - Authentication errors
  ForbiddenException,      // 403 - Permission denied
  ConflictException,       // 409 - Resource conflicts
  BusinessLogicException,  // 422 - Business rule violations
  DatabaseException,       // 500 - Database errors
  ExternalServiceException,// 502 - External API errors (e.g., GitHub API)
  ConfigurationException,  // 500 - Config errors
  ExceptionFactory,        // Factory for creating exceptions
} from "../domain.layer/exceptions/custom.exception";

// Examples:
throw new ValidationException("Repository URL is required", "repository_url");
throw new NotFoundException("Scan not found", "Scan", scanId);
throw new BusinessLogicException("Scan already in progress", "SCAN_IN_PROGRESS", { scanId });
throw new ExternalServiceException("GitHub API rate limit exceeded", "GitHub", "/repos");
```

### 18.5 Multi-Tenancy Pattern

**All database queries MUST include tenant schema:**

```typescript
// Servers/utils/aiDetection.utils.ts

export const createScanQuery = async (
  data: CreateScanInput,
  tenant: string,  // ALWAYS pass tenant
  transaction: Transaction
): Promise<ScanModel | null> => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".ai_detection_scans (
      repository_url,
      repository_owner,
      repository_name,
      status,
      triggered_by,
      created_at
    ) VALUES (
      :repository_url,
      :repository_owner,
      :repository_name,
      :status,
      :triggered_by,
      NOW()
    ) RETURNING *`,
    {
      replacements: {
        repository_url: data.repository_url,
        repository_owner: data.repository_owner,
        repository_name: data.repository_name,
        status: data.status,
        triggered_by: data.triggered_by,
      },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result[0] as ScanModel || null;
};

export const getScanByIdQuery = async (
  id: number,
  tenant: string
): Promise<ScanModel | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".ai_detection_scans WHERE id = :id`,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
    }
  );

  return result[0] as ScanModel || null;
};
```

**Tenant isolation rules:**
1. Every query includes `"${tenant}".table_name`
2. Use parameterized queries (`:id`) to prevent SQL injection
3. Never hardcode schema names
4. Tenant comes from `req.tenantId` via auth middleware

### 18.6 Route Pattern

```typescript
// Servers/routes/aiDetection.route.ts

import express from "express";
const router = express.Router();

import {
  startScan,
  getScans,
  getScanById,
  getScanStatus,
  getScanFindings,
  cancelScan,
  deleteScan,
  clearCache,
} from "../controllers/aiDetection.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/scans", authenticateJWT, getScans);
router.get("/scans/:id", authenticateJWT, getScanById);
router.get("/scans/:id/status", authenticateJWT, getScanStatus);
router.get("/scans/:id/findings", authenticateJWT, getScanFindings);

// POST requests
router.post("/scan", authenticateJWT, startScan);
router.post("/scans/:id/cancel", authenticateJWT, cancelScan);

// DELETE requests
router.delete("/scans/:id", authenticateJWT, deleteScan);
router.delete("/cache", authenticateJWT, clearCache);

export default router;
```

**Route conventions:**
- GET / → List all (paginated)
- GET /:id → Get single
- POST / → Create new
- PATCH /:id → Update
- DELETE /:id → Delete
- All routes require `authenticateJWT` middleware

### 18.7 Model Pattern

```typescript
// Servers/domain.layer/models/aiDetection/scan.model.ts

import {
  Column,
  DataType,
  Model,
  Table,
} from "sequelize-typescript";
import { IScan } from "../../interfaces/i.aiDetection";
import { numberValidation } from "../../validations/number.valid";
import {
  ValidationException,
  NotFoundException,
} from "../../exceptions/custom.exception";

@Table({
  tableName: "ai_detection_scans",
})
export class ScanModel extends Model<ScanModel> implements IScan {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  repository_url!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  repository_owner!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  repository_name!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: "pending",
  })
  status!: "pending" | "cloning" | "scanning" | "completed" | "failed" | "cancelled";

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  findings_count?: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  files_scanned?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  total_files?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  started_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  completed_at?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  duration_ms?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  error_message?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  triggered_by!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  cache_path?: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at?: Date;

  /**
   * Validate scan data before operations
   */
  async validateScanData(): Promise<void> {
    if (!this.repository_url) {
      throw new ValidationException("Repository URL is required", "repository_url");
    }

    if (!this.repository_owner || !this.repository_name) {
      throw new ValidationException("Repository owner and name are required");
    }
  }

  /**
   * Check if scan is in a terminal state
   */
  isTerminal(): boolean {
    return ["completed", "failed", "cancelled"].includes(this.status);
  }

  /**
   * Check if scan can be cancelled
   */
  canBeCancelled(): boolean {
    return ["pending", "cloning", "scanning"].includes(this.status);
  }

  /**
   * Get scan summary
   */
  getSummary(): { id: number; repo: string; status: string; findings: number } {
    return {
      id: this.id!,
      repo: `${this.repository_owner}/${this.repository_name}`,
      status: this.status,
      findings: this.findings_count || 0,
    };
  }

  constructor(init?: Partial<IScan>) {
    super();
    Object.assign(this, init);
  }
}
```

**Model responsibilities:**
1. Schema definition via decorators
2. Type safety via interface implementation
3. Instance validation methods
4. Business logic helper methods
5. Summary/serialization methods

### 18.8 Interface Pattern

```typescript
// Servers/domain.layer/interfaces/i.aiDetection.ts

export interface IScan {
  id?: number;
  repository_url: string;
  repository_owner: string;
  repository_name: string;
  default_branch?: string;
  status: "pending" | "cloning" | "scanning" | "completed" | "failed" | "cancelled";
  findings_count?: number;
  files_scanned?: number;
  total_files?: number;
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  error_message?: string;
  triggered_by: number;
  cache_path?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IFinding {
  id?: number;
  scan_id: number;
  finding_type: "library" | "dependency";
  category: string;
  name: string;
  provider?: string;
  confidence: "high" | "medium" | "low";
  description?: string;
  documentation_url?: string;
  file_count?: number;
  file_paths?: IFilePath[];
  created_at?: Date;
}

export interface IFilePath {
  path: string;
  line_number: number | null;
  matched_text: string;
}

export interface CreateScanInput {
  repository_url: string;
  repository_owner: string;
  repository_name: string;
  status?: string;
  triggered_by: number;
}
```

### 18.9 Migration Pattern for Multi-Tenant

```javascript
// Servers/database/migrations/YYYYMMDDHHMMSS-create-ai-detection-tables.js

'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

const logger = {
  info: (msg) => console.log(`[MIGRATION-INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, error) => console.error(`[MIGRATION-ERROR] ${new Date().toISOString()} - ${msg}`, error || ''),
  success: (msg) => console.log(`[MIGRATION-SUCCESS] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[MIGRATION-WARN] ${new Date().toISOString()} - ${msg}`)
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Starting AI Detection tables migration');

      // Get all organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      if (organizations[0].length === 0) {
        logger.warn('No organizations found. Skipping table creation.');
        await transaction.commit();
        return;
      }

      logger.info(`Processing ${organizations[0].length} tenant schemas`);

      // Create tables for each tenant
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Processing tenant: ${tenantHash}`);

        await createAIDetectionTablesForTenant(queryInterface, tenantHash, transaction);
      }

      await transaction.commit();
      logger.success('Migration completed successfully');

    } catch (error) {
      await transaction.rollback();
      logger.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Rolling back AI Detection tables');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".ai_detection_findings CASCADE;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".ai_detection_scans CASCADE;`,
          { transaction }
        );
      }

      await transaction.commit();
      logger.success('Rollback completed');
    } catch (error) {
      await transaction.rollback();
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
};

async function createAIDetectionTablesForTenant(queryInterface, tenantHash, transaction) {
  // Check if tables already exist
  const [tableExists] = await queryInterface.sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = '${tenantHash}' AND table_name = 'ai_detection_scans'
  `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

  if (tableExists) {
    logger.info(`Tables already exist for tenant ${tenantHash}, skipping`);
    return;
  }

  const queries = [
    // Scans table
    `CREATE TABLE "${tenantHash}".ai_detection_scans (
      id SERIAL PRIMARY KEY,
      repository_url VARCHAR(500) NOT NULL,
      repository_owner VARCHAR(255) NOT NULL,
      repository_name VARCHAR(255) NOT NULL,
      default_branch VARCHAR(100) DEFAULT 'main',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      findings_count INTEGER DEFAULT 0,
      files_scanned INTEGER DEFAULT 0,
      total_files INTEGER,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      duration_ms INTEGER,
      error_message TEXT,
      triggered_by INTEGER NOT NULL,
      cache_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // Scans indexes
    `CREATE INDEX "${tenantHash}_ai_scans_status_idx" ON "${tenantHash}".ai_detection_scans(status);`,
    `CREATE INDEX "${tenantHash}_ai_scans_triggered_by_idx" ON "${tenantHash}".ai_detection_scans(triggered_by);`,
    `CREATE INDEX "${tenantHash}_ai_scans_created_at_idx" ON "${tenantHash}".ai_detection_scans(created_at DESC);`,

    // Findings table
    `CREATE TABLE "${tenantHash}".ai_detection_findings (
      id SERIAL PRIMARY KEY,
      scan_id INTEGER NOT NULL REFERENCES "${tenantHash}".ai_detection_scans(id) ON DELETE CASCADE,
      finding_type VARCHAR(100) NOT NULL,
      category VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      provider VARCHAR(100),
      confidence VARCHAR(20) NOT NULL,
      description TEXT,
      documentation_url VARCHAR(500),
      file_count INTEGER DEFAULT 1,
      file_paths JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(scan_id, name, provider)
    );`,

    // Findings indexes
    `CREATE INDEX "${tenantHash}_ai_findings_scan_idx" ON "${tenantHash}".ai_detection_findings(scan_id);`,
    `CREATE INDEX "${tenantHash}_ai_findings_confidence_idx" ON "${tenantHash}".ai_detection_findings(confidence);`,
  ];

  for (const query of queries) {
    await queryInterface.sequelize.query(query, { transaction });
  }

  logger.success(`Created AI Detection tables for tenant: ${tenantHash}`);
}
```

**ALSO UPDATE `createNewTenant.ts`** to include these tables for new organizations.

### 18.10 Logging Pattern

```typescript
import {
  logFailure,
  logProcessing,
  logSuccess,
} from "../utils/logger/logHelper";

// 1. At start of function
logProcessing({
  description: "starting startScan",
  functionName: "startScan",
  fileName: "aiDetection.ctrl.ts",
});

// 2. On success
await logSuccess({
  eventType: "Create",  // "Create", "Read", "Update", "Delete"
  description: `Started scan for ${repository_url}`,
  functionName: "startScan",
  fileName: "aiDetection.ctrl.ts",
});

// 3. On failure
await logFailure({
  eventType: "Create",
  description: "Failed to start scan",
  functionName: "startScan",
  fileName: "aiDetection.ctrl.ts",
  error: error as Error,
});
```

### 18.11 STATUS_CODE Response Pattern

```typescript
import { STATUS_CODE } from "../utils/statusCode.utils";

// Success responses
return res.status(200).json(STATUS_CODE[200](data));      // OK
return res.status(201).json(STATUS_CODE[201](data));      // Created
return res.status(202).json(STATUS_CODE[202](data));      // Accepted
return res.status(204).json(STATUS_CODE[204](null));      // No Content

// Error responses
return res.status(400).json(STATUS_CODE[400](error.message));  // Bad Request
return res.status(401).json(STATUS_CODE[401]("Unauthorized")); // Unauthorized
return res.status(403).json(STATUS_CODE[403](error.message));  // Forbidden
return res.status(404).json(STATUS_CODE[404](null));           // Not Found
return res.status(409).json(STATUS_CODE[409](error.message));  // Conflict
return res.status(422).json(STATUS_CODE[422](error.message));  // Unprocessable
return res.status(429).json(STATUS_CODE[429](error.message));  // Rate Limited
return res.status(500).json(STATUS_CODE[500](error.message));  // Server Error
```

### 18.12 UI Component Guidelines (No MUI - Use VerifyWise Components)

**CRITICAL:** The AI Detection feature must use VerifyWise components exclusively. Do NOT import directly from `@mui/material`. Use the components below instead.

#### Component Mapping (MUI → VerifyWise)

| MUI Component | VerifyWise Component | Import Path |
|---------------|---------------------|-------------|
| `Button` | `CustomizableButton` | `@components/Button/CustomizableButton` |
| `IconButton` | `IconButton` | `@components/IconButton` |
| `TextField` | `Field` | `@components/Inputs/Field` |
| `Select` | `Select` | `@components/Inputs/Select` |
| `Autocomplete` | `AutoCompleteField` | `@components/Inputs/Autocomplete` |
| `Checkbox` | `Checkbox` | `@components/Inputs/Checkbox` |
| `Switch` | `Toggle` | `@components/Inputs/Toggle` |
| `Radio` | `Radio` | `@components/Inputs/Radio` |
| `DatePicker` | `DatePicker` | `@components/Inputs/Datepicker` |
| `Dialog/Modal` | `StandardModal` | `@components/Modals/StandardModal` |
| `Table` | `Table` | `@components/Table` |
| `Chip` | `Chip` | `@components/Chip` |
| `Tooltip` | `VWTooltip` | `@components/VWTooltip` |
| `Alert` | `Alert` | `@components/Alert` |
| `Tabs` | `TabBar` | `@components/TabBar` |
| `Breadcrumbs` | `Breadcrumbs` | `@components/Breadcrumbs` |
| `Skeleton` | `Skeletons` | `@components/Skeletons` |
| `Avatar` | `Avatar` | `@components/Avatar` |
| `CircularProgress` | `Toast` | `@components/Toast` |

#### AI Detection Component Requirements

| UI Element | VerifyWise Component | Notes |
|------------|---------------------|-------|
| "Detect AI" button | `CustomizableButton` | `variant="contained"`, `color="primary"` |
| URL input field | `Field` | `type="url"` |
| Search in findings | `SearchBox` | `@components/Search/SearchBox` |
| Findings table | `Table` | With `TablePaginationActions` |
| Summary cards | `StatsCard` | For total count, by confidence |
| File list modal | `StandardModal` | With custom content |
| Cancel confirmation | `ConfirmationModal` | `@components/Dialogs/ConfirmationModal` |
| Status chips | `Chip` | Use `variant` prop for colors |
| Empty state | `EmptyState` | `@components/EmptyState` |
| Loading state | `Skeletons` or `Toast` | For progress indication |
| Tooltips | `VWTooltip` | For file path truncation |
| History dropdown | `Select` or popover pattern | Follow existing patterns |
| Progress bar | Custom or MUI allowed | No VerifyWise equivalent |
| Donut chart | Recharts | External library - OK to use |

#### Design System Constants

```typescript
// Use these values consistently:
const DESIGN = {
  colors: {
    primary: '#13715B',
    border: '#d0d5dd',
    textPrimary: '#101828',
    textSecondary: '#475467',
  },
  borderRadius: '4px',
  buttonHeight: '34px',
  spacing: {
    section: 48,  // spacing={6} in MUI
    content: 16,
    modal: 24,
  },
};
```

#### Icons - Use lucide-react

```typescript
// ✅ Correct - use lucide-react
import { Radar, Search, X, ChevronDown, Copy, ExternalLink } from 'lucide-react';

// ❌ Wrong - don't use MUI icons
import SearchIcon from '@mui/icons-material/Search';
```

#### Allowed MUI Exceptions

These MUI components are allowed because VerifyWise doesn't have equivalents:
- `Box` - Layout container
- `Stack` - Flex layout
- `Grid` - Grid layout
- `Typography` - Text styling
- `Divider` - Visual separator
- `LinearProgress` - Progress bar (for scan progress)
- `Popover` - Dropdown positioning
- `Menu/MenuItem` - Dropdown menus (if not using IconButton)

#### Pre-Implementation Checklist

Before creating any component, verify:
- [ ] Is there a VerifyWise component for this? Check `@components/`
- [ ] Am I using `CustomizableButton` instead of MUI `Button`?
- [ ] Am I using `Field` instead of MUI `TextField`?
- [ ] Am I using `StandardModal` instead of MUI `Dialog`?
- [ ] Am I using `Chip` instead of MUI `Chip`?
- [ ] Am I using lucide-react icons instead of MUI icons?
- [ ] Does my button height = 34px?
- [ ] Does my border radius = 4px?
- [ ] Am I using the correct primary color (#13715B)?

### 18.13 Summary of Clean Code Rules

1. **Layer Separation**: Routes → Controllers → Services → Utils → Models
2. **Tenant Isolation**: Every query includes `"${tenant}".table_name`
3. **Exception Types**: Use appropriate exception for each error type
4. **Transactions**: Wrap multi-step operations in transactions
5. **Logging**: logProcessing → logSuccess or logFailure
6. **Response Format**: Always use STATUS_CODE utility
7. **Validation**: Validate in both controller and model
8. **JSDoc**: Document @param, @returns, @throws for service functions
9. **Migration**: Create tables for all existing tenants + update createNewTenant.ts
10. **Context**: Pass ServiceContext (userId, role, tenantId) through service layer
11. **UI Components**: Use VerifyWise components (not MUI) - see Section 18.12
12. **Icons**: Use lucide-react (not @mui/icons-material)

---

---

## 19. Model Security Scanning (Phase 2 Enhancement)

### 19.1 Overview

Model Security Scanning extends AI Detection to identify **malicious code hidden inside ML model files** found in GitHub repositories. When a model file is loaded, it can execute arbitrary code - this feature detects such threats before they cause harm.

### 19.2 The Threat: Deserialization Attacks

Serialized Python objects can contain instructions to import and execute any Python module. When loaded, these execute automatically without user knowledge.

**Affected formats:**
- `.pkl` / `.pickle` - Python serialization (CRITICAL risk)
- `.pt` / `.pth` / `.bin` - PyTorch models (CRITICAL - uses Python serialization internally)
- `.h5` / `.keras` - Keras models (HIGH - Lambda layers can execute code)
- `.pb` - TensorFlow SavedModel (HIGH - custom ops)
- `.safetensors` - Hugging Face format (LOW - designed to be safe)

### 19.3 Research Summary

| Tool | Approach | Strengths | Weaknesses |
|------|----------|-----------|------------|
| Picklescan | Blocklist | Industry standard | 3 CVEs in 2025 (patched v0.0.31) |
| ModelScan (ProtectAI) | Blocklist | Multi-format, enterprise | Python dependency |
| Fickling (Trail of Bits) | Allowlist | 100% detection rate | More complex |
| pickleparser (npm) | Native TS | No deps, browser-compatible | Parsing only |

**Hugging Face + ProtectAI Stats (April 2025):**
- 4.47 million models scanned
- 352,000 unsafe issues found across 51,700 models

### 19.4 Implementation: Hybrid Approach

**Phase 1: Native TypeScript (No Dependencies)**
- Serialized file opcode parsing via pickleparser npm
- Dangerous module/function detection
- SafeTensors header validation
- H5 Lambda layer detection

**Future: Deep Scan Mode (Python)**
- ModelScan integration
- Fickling for decompilation

### 19.5 Dangerous Operators - Complete Reference

This section documents all dangerous operators detected by the model security scanner. These patterns are implemented in `Servers/config/modelSecurityPatterns.ts`.

#### CRITICAL Severity (22 Patterns)

These operators can directly execute arbitrary code or access system resources.

| Module | Operators | Description |
|--------|-----------|-------------|
| `builtins` | eval, exec, compile, open, __import__, breakpoint, getattr, setattr, delattr | Python 3 built-in functions that can execute arbitrary code |
| `__builtin__` | eval, exec, compile, open, __import__, execfile, file, input, raw_input | Python 2 built-in functions (legacy but common in model files) |
| `os` | * (all) | Operating system interface - can execute commands, modify files |
| `nt` | * (all) | Windows NT system interface |
| `posix` | * (all) | POSIX system interface |
| `subprocess` | * (all) | Can spawn arbitrary processes |
| `socket` | * (all) | Can establish network connections |
| `sys` | * (all) | System-specific parameters and functions |
| `runpy` | * (all) | Run Python modules as scripts |
| `asyncio` | create_subprocess_shell, create_subprocess_exec | Async subprocess creation |
| `code` | * (all) | Interactive interpreter - can execute arbitrary code |
| `commands` | * (all) | Legacy command execution module |
| `popen2` | * (all) | Legacy process spawning |
| `pty` | * (all) | Pseudo-terminal utilities - can spawn shells (CVE-2025-67748) |
| `pickle` | * (all) | Recursive pickle deserialization can execute arbitrary code |
| `_pickle` | * (all) | C-accelerated pickle module - same risks as pickle |
| `bdb` | * (all) | Python debugger framework - can execute arbitrary code |
| `pdb` | * (all) | Python debugger - can execute arbitrary code interactively |
| `marshal` | * (all) | Internal Python object serialization - can deserialize code objects (CVE-2025-67747) |
| `types` | FunctionType, CodeType, LambdaType, GeneratorType, CoroutineType | Type constructors that can create executable code objects (CVE-2025-67747) |
| `operator` | attrgetter, itemgetter, methodcaller | Operator functions that can access and call arbitrary methods |
| `apply` | * (all) | Python 2 apply function - can call arbitrary functions |

#### HIGH Severity (15 Patterns)

These operators enable indirect code execution, network access, or data exfiltration.

| Module | Operators | Description |
|--------|-----------|-------------|
| `webbrowser` | * (all) | Can open arbitrary URLs in the user's browser |
| `httplib` | * (all) | HTTP client library - can send data to external servers |
| `http.client` | * (all) | HTTP client library - can send data to external servers |
| `urllib` | * (all) | URL handling module - can fetch remote resources |
| `urllib.request` | * (all) | URL request module - can fetch remote resources |
| `urllib2` | * (all) | Legacy URL handling module |
| `requests` | * (all) | HTTP library - can send data to external servers |
| `requests.api` | * (all) | Requests API module |
| `aiohttp` | * (all) | Async HTTP client - can send data to external servers |
| `aiohttp.client` | * (all) | Async HTTP client module |
| `shutil` | * (all) | File operations - can copy, move, or delete files and directories |
| `pathlib` | unlink, rmdir, rename, replace, write_bytes, write_text | Path operations that can modify files |
| `tensorflow.io` | read_file, write_file | TensorFlow file I/O operations |
| `tensorflow.io.gfile` | * (all) | TensorFlow GFile operations |
| `ctypes` | * (all) | Foreign function library - can call arbitrary C code |

#### MEDIUM Severity (12 Patterns)

These operators are potentially dangerous depending on context.

| Module | Operators | Description |
|--------|-----------|-------------|
| `keras.layers` | Lambda | Keras Lambda layers can contain arbitrary Python code |
| `tensorflow.keras.layers` | Lambda | TensorFlow Keras Lambda layers can contain arbitrary code |
| `keras.layers.core` | Lambda | Keras core Lambda layer |
| `numpy` | load | NumPy load can execute code when allow_pickle=True |
| `numpy.lib.npyio` | load | NumPy load function |
| `joblib` | load | Joblib load can execute arbitrary code |
| `dill` | load, loads | Extended serialization - can execute code |
| `cloudpickle` | load, loads | CloudPickle - can execute code during deserialization |
| `functools` | partial | Can wrap and defer execution of dangerous functions |
| `importlib` | import_module, __import__ | Dynamic module import - can load arbitrary code |
| `multiprocessing` | Process | Can spawn new processes |
| `threading` | Thread | Can spawn new threads |

#### Total: 71 Distinct Module Patterns

#### Additional HIGH Severity (12 Patterns Added)

| Module | Operators | Description |
|--------|-----------|-------------|
| `tempfile` | * (all) | Temporary file utilities - commonly used for staging malicious payloads |
| `torch` | load, jit.load, package.load_pickle | PyTorch model loading - uses serialization internally |
| `torch.serialization` | load | PyTorch serialization - can execute arbitrary code |
| `onnx` | load, load_model, load_from_string | ONNX model loading - can contain custom operators |
| `xgboost` | Booster, load_model | XGBoost model loading - can use serialization internally |
| `lightgbm` | Booster, load_model, model_from_string | LightGBM model loading |
| `sklearn.externals.joblib` | load | Legacy scikit-learn joblib - uses unsafe serialization |
| `atexit` | register, unregister | Deferred execution on interpreter exit - sandbox evasion |
| `signal` | signal, alarm, setitimer | Signal handlers - can defer execution |
| `weakref` | finalize, ref | Weak reference finalizers - execute on garbage collection |
| `sched` | scheduler, enter, enterabs | Event scheduler - can defer malicious code execution |
| `yaml` | load, unsafe_load, full_load, Loader, UnsafeLoader, FullLoader | YAML unsafe loaders (CRITICAL) |
| `ruamel.yaml` | load, load_all | ruamel.yaml loaders (CRITICAL) |

#### Additional MEDIUM Severity (8 Patterns Added)

| Module | Operators | Description |
|--------|-----------|-------------|
| `base64` | b64decode, b64encode, decodebytes, decodestring, urlsafe_b64decode | Base64 decoding - commonly used to obfuscate payloads |
| `zlib` | decompress, decompressobj | Zlib decompression - used to hide compressed malicious code |
| `bz2` | decompress, BZ2Decompressor | BZ2 decompression - used to hide compressed malicious code |
| `lzma` | decompress, LZMADecompressor | LZMA decompression - used to hide compressed malicious code |
| `gzip` | decompress, GzipFile | Gzip decompression - used to hide compressed malicious code |
| `codecs` | decode, getdecoder, open | Codec operations - can be used for payload obfuscation |
| `struct` | unpack, unpack_from | Binary unpacking - can extract hidden code from binary data |

#### Pickle Magic Methods Detection

The scanner now detects these lifecycle hooks that execute during deserialization:
- `__reduce__` - Returns callable + args for reconstruction
- `__reduce_ex__` - Extended reduce with protocol version
- `__setstate__` - Called with deserialized state dict
- `__getstate__` - Called during pickling
- `__del__` - Destructor - executes on garbage collection
- `__new__` - Object creation hook
- `__init__` - Initialization hook

#### Pickle Opcode-Level Detection

The scanner now detects critical opcodes at the byte level:
- `GLOBAL` (0x63) - Import module.name (proto 0-2)
- `STACK_GLOBAL` (0x93) - Import from stack (proto 4+)
- `REDUCE` (0x52) - Call function with args from stack
- `BUILD` (0x62) - Call `__setstate__` with state
- `INST` (0x69) - Legacy instantiate
- `NEWOBJ` (0x81) - Build new object

**Contextual Escalation:**
- GLOBAL + REDUCE = CRITICAL (definite code execution)
- GLOBAL + BUILD = CRITICAL (`__setstate__` execution)
- Just REDUCE without GLOBAL = HIGH (may be obfuscated)

#### CVE References

| CVE | Module | Description |
|-----|--------|-------------|
| CVE-2025-67747 | marshal, types.FunctionType | Missing from picklescan detection (fixed in v0.0.31) |
| CVE-2025-67748 | pty.spawn | Shell spawn bypass (fixed in v0.0.31) |

#### Pattern Matching Implementation

The scanner uses regex to detect GLOBAL opcode patterns in serialized files:

```typescript
// Pattern: c<module>\n<operator>\n (GLOBAL opcode in pickle)
const GLOBAL_PATTERN = /c([a-zA-Z_][a-zA-Z0-9_.]*)\n([a-zA-Z_][a-zA-Z0-9_]*)\n/g;
```

For each match, the scanner:
1. Extracts module name and operator name
2. Looks up in dangerous operators list
3. Creates finding with severity, CWE, and OWASP ML references

### 19.6 Compliance Mapping

| Threat Type | CWE | OWASP ML |
|-------------|-----|----------|
| Deserialization | CWE-502 | ML06 - AI Supply Chain Attacks |
| Code Injection | CWE-94 | ML06 - AI Supply Chain Attacks |
| DoS Attack | CWE-400 | ML06 - AI Supply Chain Attacks |

### 19.7 Database Changes

Add columns to ai_detection_findings:
- severity: critical/high/medium/low
- cwe_id, cwe_name
- owasp_ml_id, owasp_ml_name
- threat_type, operator_name, module_name

### 19.8 New Files

- Servers/config/modelSecurityPatterns.ts
- Servers/utils/modelSecurity/pickleScanner.ts
- Servers/utils/modelSecurity/safetensorsScanner.ts
- Servers/utils/modelSecurity/h5Scanner.ts
- Servers/utils/modelSecurity/complianceMapping.ts

### 19.9 npm Dependency

pickleparser: ^0.2.1

### 19.10 References

- https://huggingface.co/docs/hub/security-pickle
- https://github.com/protectai/modelscan
- https://github.com/trailofbits/fickling
- https://cwe.mitre.org/data/definitions/502.html
- https://owasp.org/www-project-machine-learning-security-top-10/

---

*Document Version: 2.5*
*Last Updated: December 29, 2024*
