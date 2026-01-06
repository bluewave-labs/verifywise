# Repository Layer Type Cleanup Plan

## Overview

This document outlines a phased approach to remove `any` types from the repository layer (`Clients/src/application/repository/`). The refactoring uses **Option A**: preserve existing return patterns and add proper types.

**Current State:**
- 52 repository files total
- 42 files (81%) contain `any` types
- Inconsistent return patterns between files

---

## Critical Architecture Understanding

### 1. Backend Response Format

**ALL backend endpoints return the same structure:**
```typescript
{ message: string, data: T }
```

This is enforced by `STATUS_CODE` utility in `Servers/utils/statusCode.utils.ts`:
```typescript
static 200 = (data: any) => {
  return { message: "OK", data };
};
```

### 2. Frontend API Layer

`apiServices` in `infrastructure/api/networkServices.ts` wraps responses:

```typescript
interface ApiResponse<T> {
  data: T;           // Contains the backend response { message, data }
  status: number;
  statusText: string;
  headers?: AxiosResponseHeaders;
}
```

**Critical: `ApiResponse` is NOT exported!** This must be fixed first.

### 3. Data Flow Pattern

```
Backend returns:     { message: "OK", data: actualData }
                            ↓
apiServices returns: ApiResponse<{ message, data }>
                     where .data = { message: "OK", data: actualData }
                            ↓
Repository returns:  response.data = { message: "OK", data: actualData }
                            ↓
Caller accesses:     result.data = actualData
```

### 4. The Three Return Patterns

| Pattern | Repository Returns | Caller Access | Files |
|---------|-------------------|---------------|-------|
| **A: Partially unwrapped** | `response.data` = `{ message, data }` | `result.data` | vendor, project, most files |
| **B: Fully unwrapped** | `response.data.data` = actual data | `result` directly | policy, notes (via extractData) |
| **C: Full response** | `response` = full ApiResponse | `result.data.data` | entity.repository.ts |

---

## Existing Domain Types (DO NOT RECREATE)

**Already exist in `domain/types/`:**
- ✅ `Subcontrol.ts` - Full type with 20+ fields
- ✅ `Subtopic.ts` - Full type
- ✅ `VendorRisk.ts` - Full type (but needs input types added)
- ✅ `Project.ts`, `ProjectRisk.ts`, `User.ts`
- ✅ `Question.ts`, `Control.ts`, `Event.ts`, `File.ts`

**Already exist in `domain/models/`:**
- ✅ `VendorModel` in `domain/models/Common/vendor/vendor.model.ts`

**Need to be created:**
- ❌ `CreateVendorRiskInput`, `UpdateVendorRiskInput` (add to VendorRisk.ts)
- ❌ `BackendResponse<T>` generic type
- ❌ Export `ApiResponse` from networkServices.ts

---

## Prerequisites (Must Do First)

### Step 0a: Export ApiResponse

```typescript
// infrastructure/api/networkServices.ts
// Change from:
interface ApiResponse<T> { ... }

// To:
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers?: AxiosResponseHeaders;
}
```

### Step 0b: Create BackendResponse Type

```typescript
// domain/types/ApiTypes.ts (NEW FILE)
/**
 * Standard backend response wrapper.
 * All API endpoints return { message: string, data: T }
 */
export interface BackendResponse<T> {
  message: string;
  data: T;
}
```

### Step 0c: Add Input Types to VendorRisk

```typescript
// domain/types/VendorRisk.ts (ADD TO EXISTING)
export type CreateVendorRiskInput = Partial<Omit<VendorRisk, 'risk_id'>>;
export type UpdateVendorRiskInput = Partial<Omit<VendorRisk, 'risk_id'>>;
```

---

## Phased Implementation

### Phase 1: Error Handling Only (Safest - 30 mins)

**Scope:** Only fix `catch (error: any)` patterns.

**Files:**
1. `policy.repository.ts` - 6 catches
2. `notes.repository.ts` - 5 catches

**Pattern:**
```typescript
// Before
catch (error: any) {
  throw new APIError("Message", error?.response?.status, error);
}

// After
catch (error: unknown) {
  const axiosError = error as { response?: { status?: number } };
  throw new APIError("Message", axiosError?.response?.status, error);
}
```

---

### Phase 2: Fully Unwrapped Repositories (1 hour)

**Scope:** Files using `extractData()` that return actual data directly.

**Files:**
1. `policy.repository.ts` - Already has `extractData`, just needs return types
2. `notes.repository.ts` - Same pattern

**These files return data directly, so:**
```typescript
// Return type is the actual data type
export async function getAllPolicies(): Promise<PolicyManagerModel[]>
export async function getAllNotes(): Promise<Note[]>
```

---

### Phase 3: Simple GET Functions (1-2 hours)

**Scope:** Files where GET functions return `response.data` (the `{ message, data }` wrapper).

**Files:**
1. `logs.repository.ts` - 1 function
2. `tokens.repository.ts` - 3 functions
3. `userPreferences.repository.ts` - 3 functions
4. `task.repository.ts` - 8 functions (uses ITask interface)

**Pattern for GET functions:**
```typescript
import { BackendResponse } from "../../domain/types/ApiTypes";
import { ITask } from "../../domain/interfaces/i.task";

export async function getAllTasks(...): Promise<BackendResponse<ITask[]>> {
  const response = await apiServices.get<BackendResponse<ITask[]>>("/tasks", ...);
  return response.data;
}
```

**Callers continue to use:**
```typescript
const result = await getAllTasks();
const tasks = result.data;  // ITask[]
```

---

### Phase 4: Mixed Pattern Repositories (3-4 hours)

**Scope:** Files with GET returning `response.data` and POST/PATCH returning `response`.

**Files:**
1. `vendor.repository.ts` - Uses VendorModel
2. `vendorRisk.repository.ts` - Uses VendorRisk
3. `project.repository.ts` - Uses Project
4. `projectRisk.repository.ts` - Uses ProjectRisk
5. `question.repository.ts`
6. `subcontrol.repository.ts` - Uses existing Subcontrol type
7. `subtopic.repository.ts` - Uses existing Subtopic type
8. `event.repository.ts` - returns full `response`

**Pattern for GET:**
```typescript
import { BackendResponse } from "../../domain/types/ApiTypes";
import { VendorModel } from "../../domain/models/Common/vendor/vendor.model";

export async function getAllVendors(...): Promise<BackendResponse<VendorModel[]>> {
  const response = await apiServices.get<BackendResponse<VendorModel[]>>("/vendors", ...);
  return response.data;
}
```

**Pattern for POST/PATCH/PUT (returning full response):**
```typescript
import { ApiResponse, BackendResponse } from "...";

export async function createNewVendor(...): Promise<ApiResponse<BackendResponse<VendorModel>>> {
  const response = await apiServices.post<BackendResponse<VendorModel>>("/vendors", body);
  return response;  // Full ApiResponse
}
```

**Callers for POST:**
```typescript
const response = await createNewVendor({ body });
const vendor = response.data.data;  // VendorModel
```

---

### Phase 5: Complex Files (4-6 hours)

**Files:**
1. `entity.repository.ts` (313 lines)
   - **Recommendation:** Keep `/* eslint-disable */` - intentionally generic
   - Used as utility across entire app with dynamic routes

2. `aiTrustCentre.repository.ts` (306 lines)
   - Create specific response interfaces

3. `integration.repository.ts` (153 lines)
   - Has partial types already (MlflowConfigResponse, etc.)

4. `comments.repository.ts` (223 lines)
   - Needs: Comment, Reaction, FileInfo interfaces

5. `deepEval.repository.ts` (242 lines)
   - Needs evaluation-specific types

---

### Phase 6: Remaining Files (4-6 hours)

33 remaining files - work through alphabetically:
- `advisor.repository.ts`
- `annexCategory_iso.repository.ts`
- `annex_struct_iso.repository.ts`
- `assesment.repository.ts`
- `auth.repository.ts`
- `automations.repository.ts`
- `ceMarking.repository.ts`
- `changeHistory.repository.ts`
- `clause_struct_iso.repository.ts`
- `controlCategory_eu_act.repository.ts`
- `control_eu_act.repository.ts`
- `entityGraph.repository.ts`
- `euaiact.repository.ts`
- `evidenceHub.repository.ts`
- `file.repository.ts`
- `incident_management.repository.ts`
- `llmKeys.repository.ts`
- `mail.repository.ts`
- `modelInventory.repository.ts`
- `modelInventoryChangeHistory.repository.ts`
- `modelInventoryHistory.repository.ts`
- `organization.repository.ts`
- `policyLinkedObjects.repository.ts`
- `projectScope.repository.ts`
- `riskHistory.repository.ts`
- `role.repository.ts`
- `search.repository.ts`
- `share.repository.ts`
- `slack.integration.repository.ts`
- `subClause_iso.repository.ts`
- `trainingregistar.repository.ts`
- `user.repository.ts`
- `vendorsProjects.repository.ts`

---

## Types to Create

### New Files

```typescript
// domain/types/ApiTypes.ts
export interface BackendResponse<T> {
  message: string;
  data: T;
}

// Re-export ApiResponse after it's exported from networkServices
export type { ApiResponse } from "../../infrastructure/api/networkServices";
```

### Additions to Existing Files

```typescript
// domain/types/VendorRisk.ts - ADD these lines
export type CreateVendorRiskInput = Partial<Omit<VendorRisk, 'risk_id'>>;
export type UpdateVendorRiskInput = Partial<Omit<VendorRisk, 'risk_id'>>;
```

### For Phase 5: Comment Types

```typescript
// domain/types/Comment.ts (NEW FILE)
export interface Comment {
  id: number;
  message: string;
  tableId: string;
  rowId: string | number;
  author_id: number;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  emoji: string;
  user_id: number;
  created_at: string;
}

export interface FileInfo {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  upload_date: string;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

---

## Implementation Checklist

### Prerequisites
- [ ] Export `ApiResponse` from `networkServices.ts`
- [ ] Create `domain/types/ApiTypes.ts` with `BackendResponse<T>`
- [ ] Add input types to `VendorRisk.ts`
- [ ] Run TypeScript check
- [ ] Commit: "chore: add shared API types"

### Phase 1: Error Handling
- [ ] `policy.repository.ts` - Fix 6 `error: any`
- [ ] `notes.repository.ts` - Fix 5 `error: any`
- [ ] Run TypeScript check + build
- [ ] Commit: "fix: use unknown instead of any for error handling"

### Phase 2: Fully Unwrapped
- [ ] `policy.repository.ts` - Add return types
- [ ] `notes.repository.ts` - Add return types
- [ ] Run TypeScript check + build
- [ ] Commit

### Phase 3: Simple GET
- [ ] `logs.repository.ts`
- [ ] `tokens.repository.ts`
- [ ] `userPreferences.repository.ts`
- [ ] `task.repository.ts`
- [ ] Run TypeScript check + build
- [ ] Commit

### Phase 4: Mixed Pattern
- [ ] Verify each file's callers first
- [ ] `vendor.repository.ts` (use VendorModel)
- [ ] `vendorRisk.repository.ts`
- [ ] `project.repository.ts`
- [ ] `projectRisk.repository.ts`
- [ ] `question.repository.ts`
- [ ] `subcontrol.repository.ts` (use existing Subcontrol type)
- [ ] `subtopic.repository.ts` (use existing Subtopic type)
- [ ] `event.repository.ts`
- [ ] Run TypeScript check + build after each
- [ ] Commit per file

### Phase 5: Complex Files
- [ ] Create Comment types
- [ ] Decide on entity.repository.ts (keep eslint-disable?)
- [ ] `aiTrustCentre.repository.ts`
- [ ] `integration.repository.ts`
- [ ] `comments.repository.ts`
- [ ] `deepEval.repository.ts`
- [ ] Commit per file

### Phase 6: Remaining
- [ ] Work through 33 remaining files
- [ ] Commit in logical batches

---

## Caller Verification Commands

```bash
# Find all callers of a repository
grep -r "from.*vendor.repository" Clients/src --include="*.ts" --include="*.tsx"

# Find specific function usage
grep -r "createNewVendor" Clients/src --include="*.ts" --include="*.tsx"

# Check what callers do with response
grep -rA3 "await getAllVendors" Clients/src --include="*.ts" --include="*.tsx"

# Verify caller pattern
grep -rB2 -A5 "getVendorById" Clients/src/application/hooks/
```

---

## Risk Mitigation

1. **Prerequisites first** - Export types before using them
2. **One file per commit** - Easy rollback
3. **Run build after each file** - Catch errors early
4. **Preserve return patterns** - Don't change behavior
5. **Use existing types** - VendorModel, Subcontrol, Subtopic already exist
6. **Keep entity.repository.ts generic** - It's intentionally flexible

---

## Files to Keep with eslint-disable

- `entity.repository.ts` - Generic utility, would require typing all callers
- `networkServices.ts` - Already has eslint-disable, handles any HTTP response

---

## Estimated Effort

| Phase | Files | Effort |
|-------|-------|--------|
| Prerequisites | 3 changes | 15 mins |
| Phase 1 | 2 files | 30 mins |
| Phase 2 | 2 files | 30 mins |
| Phase 3 | 4 files | 1-2 hours |
| Phase 4 | 8 files | 3-4 hours |
| Phase 5 | 5 files | 4-6 hours |
| Phase 6 | 33 files | 4-6 hours |
| **Total** | **57 changes** | **14-20 hours** |

---

## Summary of Corrections from Original Plan

| Issue | Original | Corrected |
|-------|----------|-----------|
| VendorRisk input types | "Exist" | Need to be created |
| Subcontrol, Subtopic | "Need to create" | Already exist in domain/types |
| VendorModel | "Create Vendor type" | Use existing VendorModel |
| ApiResponse | "Use AxiosResponse" | Must export ApiResponse (different type) |
| Backend response | Not documented | ALL return `{ message, data }` |
| Return patterns | 2 patterns | 3 distinct patterns identified |
| event.repository.ts | Phase 1 | Phase 4 (returns full response) |
| Missing files | 20 files | 33 additional files added |
| Prerequisites | None | Export ApiResponse, create BackendResponse |
