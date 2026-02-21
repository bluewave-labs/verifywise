# Color Palette Migration Plan

> **Goal**: Replace all hardcoded hex colors across the VerifyWise codebase with imports from the unified palette (`Clients/src/presentation/themes/palette.ts`), creating a coherent, calm, pastel visual identity across all four modules.

---

## Design principles

1. **Chip component is canonical** — its light-pastel-bg + muted-text style is the target aesthetic for every status indicator, badge, chart segment, and icon accent.
2. **No bright Tailwind-500 colors** — `#EF4444`, `#F59E0B`, `#10B981`, `#3B82F6` etc. are replaced by their muted equivalents from `palette.ts`.
3. **One import, one source** — every file imports from `@/presentation/themes/palette` instead of defining its own hex constants.
4. **Theme alignment** — `light.ts` and `alerts.ts` will be updated to reference `palette.ts` values so MUI theme tokens stay in sync.

---

## Palette summary

| Semantic | Background | Text | Replaces |
|----------|-----------|------|----------|
| success | `#E6F4EA` | `#138A5E` | `#10B981`, `#22C55E`, `#079455`, `#17b26a`, `#4CAF50`, `#12b76a`, `#039855`, `#027a48` |
| error | `#FFD6D6` | `#D32F2F` | `#EF4444`, `#DC2626`, `#f04438`, `#d92d20`, `#b42318`, `#F44336`, `#FF5722` |
| warning | `#FFF8E1` | `#795548` | `#F59E0B`, `#DC6803`, `#fdb022`, `#FF9800`, `#b54708` |
| info | `#E3F2FD` | `#1565C0` | `#3B82F6`, `#0288d1`, `#0369a1`, `#175cd3` |
| default | `#F3F4F6` | `#6B7280` | `#9CA3AF`, `#6B7280`, `#667085` |
| critical | `#FFD6D6` | `#D32F2F` | `#DC2626`, `#B91C1C`, `#F44336` |
| high | `#FFE5D0` | `#E64A19` | `#EF4444`, `#FF5722`, `#EA580C` |
| medium | `#FFF8E1` | `#795548` | `#F59E0B`, `#FF9800` |
| low | `#E6F4EA` | `#138A5E` | `#10B981`, `#4CAF50` |
| very-low | `#E0F7FA` | `#00695C` | `#22C55E` |

### Feature accent colors (top-bar icons)

| Feature | Old color | New text | New bg |
|---------|-----------|----------|--------|
| Approval workflows | `#13715B` | `#13715B` | `#E6F0EC` (no change — already primary) |
| Integrations/Plugins | `#8B5CF6` | `#5E35B1` | `#EDE7F6` |
| Automations | `#F97316` | `#E65100` | `#FFF3E0` |

### Chart colors (replacing bright Tailwind)

Old: `#DC2626`, `#EF4444`, `#F59E0B`, `#10B981`, `#3B82F6`, `#8B5CF6`...
New: `#5C8A7D`, `#7986CB`, `#A1887F`, `#9575CD`, `#4DB6AC`, `#E57373`, `#FFB74D`, `#81C784`

---

## Migration phases

### Phase 1: Theme alignment (this PR)

**Files:**
- `themes/palette.ts` — **created** (single source of truth)
- `themes/index.ts` — **updated** (export palette)
- `themes/light.ts` — align `status.*` values to palette
- `themes/alerts.ts` — align to palette values

**Changes in `light.ts`:**
```
status.success.text  → palette.status.success.text (#138A5E, was #079455)
status.success.main  → #138A5E (was #17b26a)
status.success.light → palette.status.success.border
status.success.bg    → palette.status.success.bg

status.error.text    → palette.status.error.text (#D32F2F, was #f04438)
status.error.main    → #D32F2F (stays same)
status.error.light   → palette.status.error.border
status.error.bg      → palette.status.error.bg (#FFD6D6, was #f9eced)

status.warning.text  → palette.status.warning.text (#795548, was #DC6803)
status.warning.main  → #795548 (was #fdb022)
status.warning.light → palette.status.warning.border
status.warning.bg    → palette.status.warning.bg

status.info.text     → palette.status.info.text (#1565C0, was text.primary)
status.info.main     → #1565C0 (was text.tertiary)
status.info.bg       → palette.status.info.bg (#E3F2FD, was background.main)
```

**Changes in `alerts.ts`:**
```
info.text  → #1565C0 (was #0288d1)
info.bg    → #E3F2FD (was #e5f6fd)
success.text → #138A5E (was #079455)
error.text → #D32F2F (was #f04438)
warning.text → #795548 (was #DC6803)
```

### Phase 2: Dashboard overview

**File:** `pages/DashboardOverview/constants.ts`

Replace the entire `COLORS` object to import from palette:

```ts
import { palette } from '@/presentation/themes/palette';

export const COLORS = {
  critical: palette.risk.critical.text,
  high: palette.risk.high.text,
  medium: palette.risk.medium.text,
  low: palette.risk.low.text,
  veryLow: palette.risk.veryLow.text,
  completed: palette.status.success.text,
  approved: palette.status.success.text,
  inProgress: palette.status.warning.text,
  pending: palette.status.default.text,
  draft: palette.text.accent,
  archived: palette.status.default.text,
  implemented: palette.brand.primary,
  awaitingReview: palette.status.info.text,
  awaitingApproval: palette.accent.purple.text,
  needsRework: palette.accent.orange.text,
  notStarted: palette.status.default.text,
  open: palette.status.error.text,
  investigating: palette.status.warning.text,
  mitigated: palette.status.info.text,
  closed: palette.status.success.text,
  restricted: palette.accent.orange.text,
  blocked: palette.status.error.text,
  primary: palette.brand.primary,
  textPrimary: palette.text.primary,
  textSecondary: palette.text.tertiary,
  border: palette.border.dark,
  backgroundHover: palette.background.hover,
  backgroundLight: palette.background.accent,
} as const;
```

### Phase 3: Top-bar / layout icons

**File:** `components/Layout/style.ts`

| Button | Old | New |
|--------|-----|-----|
| `integrations` | `#8B5CF6` | `palette.accent.purple.text` (`#5E35B1`) |
| `automations` | `#F97316` | `palette.accent.orange.text` (`#E65100`) |
| hover borders | bright hex | `palette.accent.*.border` |

### Phase 4: Model inventory

**Files (8):**
- `ModelRisksTable.tsx` — status dots: use `palette.status.*`
- `ModelRiskSummary.tsx` — chips: use `palette.risk.*` (replace `#4CAF50`, `#FF9800`, `#FF5722`, `#F44336`)
- `ModelInventorySummary.tsx` — chips: use `palette.status.*` + `palette.risk.*`
- `DatasetSummary.tsx` — chips: use `palette.status.*`
- `modelInventoryTable.tsx` — `#98A2B3` → `palette.text.disabled`
- `evidenceHubTable.tsx` — `#9CA3AF` → `palette.text.disabled`
- `style.ts` — `#13715B` → `palette.brand.primary`, grays → `palette.text.*`
- `index.tsx` — border/background → `palette.border.*`, `palette.background.*`

### Phase 5: AI Detection

**Files (4):**
- `ScanDetailsPage.tsx` — largest file; replace all 8 CONFIG objects:
  - `SEVERITY_BORDER_CONFIG` → derive from `palette.risk.*.border`
  - `LICENSE_RISK_CONFIG` → `palette.risk.{high,medium,low}`
  - `SECURITY_SEVERITY_CONFIG` → same as LICENSE_RISK_CONFIG
  - `GOVERNANCE_STATUS_CONFIG` → `palette.status.{info,success,error}`
  - `EU_AI_ACT_CATEGORY_CONFIG` → use `palette.accent.*`
  - `PRIORITY_CONFIG` → `palette.risk.{high,medium,low}`
  - Inline alert colors → `palette.status.*`
  - Code block theme colors (dark) can stay as-is (these are syntax highlighting)
- `ScanPage.tsx` — status colors → `palette.status.*`, grays → `palette.text.*`
- `HistoryPage.tsx` — grays → `palette.text.*`, delete icon → `palette.status.error.text`
- `SettingsPage.tsx` — `#13715B` → `palette.brand.primary`, `#dc3545` → `palette.status.error.text`

### Phase 6: Shadow AI

**Files (7):**
- `AIToolsPage.tsx` — `TOOL_STATUS_CONFIG`: map each status to `palette.status.*` / `palette.accent.*`
- `InsightsPage.tsx` — chart color array → `palette.chart`; bar fill → `palette.brand.primary`
- `SettingsPage.tsx` — `#13715B` → `palette.brand.primary`, `#DC2626` → `palette.status.error.text`, `#10B981` → `palette.status.success.text`
- `RulesPage.tsx` — buttons/icons → `palette.brand.*`, `palette.status.error.*`
- `GovernanceWizardModal.tsx` — `#374151` → `palette.text.secondary`
- `UserActivityPage.tsx` — `#9CA3AF` → `palette.text.disabled`
- `constants.tsx` — `#9CA3AF` → `palette.text.disabled`

### Phase 7: LLM Evals (largest scope — ~1,063 occurrences)

**Strategy:** Create `EvalsDashboard/evalColors.ts` that re-exports palette values plus any evals-specific tokens (arena contestant colors, markdown code-block theme). Then replace inline hex in all 17 files.

**Files (17):**
- `EvalsDashboard.tsx` (156 occurrences)
- `NewExperimentModal.tsx` (181 occurrences)
- `ExperimentDetailContent.tsx` (181 occurrences)
- `ProjectDatasets.tsx` (149 occurrences)
- `ArenaPage.tsx`
- `ArenaResultsPage.tsx`
- `BiasAuditDetail.tsx`
- `ProjectsList.tsx`
- `components/PerformanceChart.tsx` — `CHART_COLORS` → `palette.chart`
- ...and 8 more files

**Evals-specific tokens** (in `evalColors.ts`):
```ts
import { palette } from '@/presentation/themes/palette';

// Arena contestant colors — use accent palette
export const CONTESTANT_COLORS = [
  palette.accent.blue,
  { bg: palette.status.error.bg, text: palette.status.error.text, border: palette.status.error.border },
  palette.accent.primary,
  palette.accent.amber,
  palette.accent.purple,
  palette.accent.pink,
];

// Chart colors for performance metrics
export const EVAL_CHART_COLORS = palette.chart;
```

---

## Testing checklist per phase

- [ ] Visual comparison: screenshot before vs. after each module
- [ ] Dark backgrounds (code blocks, tooltips) remain readable
- [ ] Chart legends remain distinguishable with new muted palette
- [ ] Status dots / badges have sufficient contrast (WCAG AA)
- [ ] No TypeScript errors after replacing string literals
- [ ] No broken imports or missing palette keys
