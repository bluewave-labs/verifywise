# Feature: Add deadline warning banners to relevant pages

## Description

Add a warning banner system that displays above the Tips component on relevant pages, alerting users to upcoming and overdue deadlines. The warning should show counts of items requiring attention and provide snooze options.

## Background

Currently, users have no proactive notification of approaching deadlines. They must manually check each entity to discover overdue or upcoming items. This feature will improve user awareness and help prevent missed deadlines.

## User Story

As a compliance manager, I want to see warnings about upcoming deadlines when I visit relevant pages, so that I can prioritize my work and avoid missing important dates.

## Scope

**Phase 1: Tasks**
- Display on Tasks page (`/tasks`)
- Show overdue tasks count
- Show tasks due within 14 days count

**Future Phases:**
- Vendors (review_date)
- Policies (next_review_date)
- Risks (mitigation deadline)

---

## Requirements

### Functional Requirements

1. **Warning Banner Position**
   - Display above TipBox component
   - Only show on relevant pages (Tasks page for Phase 1)
   - Do not show if there are no warnings

2. **Warning Categories**
   - 🔴 **Overdue**: Items past their due date
   - 🟡 **Due Soon**: Items due within 14 days

3. **Display Format**
   - Show aggregated counts, not individual items
   - Example: "3 overdue tasks • 5 tasks due within 14 days"
   - Clickable to filter/scroll to relevant items (optional)

4. **Snooze Options**
   - "Snooze for 1 hour"
   - "Snooze for 24 hours"
   - "Snooze for 1 week"
   - Store snooze state in localStorage with expiry timestamp

5. **Dismiss Behavior**
   - X button opens snooze menu (not immediate dismiss)
   - Snooze persists per user (localStorage keyed by userId)

### Technical Requirements

1. **Frontend Components**
   - Create `DeadlineWarningBox` component (similar to TipBox)
   - Create `useDeadlineWarnings` hook for data fetching and snooze management
   - Reuse existing `InfoBox` component with `variant="warning"`

2. **Backend API**
   - Create endpoint: `GET /api/deadlines/summary`
   - Response format:
     ```json
     {
       "tasks": {
         "overdue": 3,
         "dueSoon": 5,
         "threshold": 14
       }
     }
     ```
   - Filter by user's accessible projects

3. **Data Sources**

   | Entity | Field | Overdue Logic |
   |--------|-------|---------------|
   | Tasks | `due_date` | `due_date < today AND status != 'Done'` |

4. **localStorage Schema**
   ```json
   {
     "key": "verifywise_deadline_snooze_{userId}_{entity}",
     "value": {
       "snoozedUntil": "2024-12-03T10:00:00Z"
     }
   }
   ```

---

## UI Design

### Warning Banner Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Upcoming deadlines                                    [⋮] │
│  ───────────────────────────────────────────────────────────────│
│  🔴 3 overdue  •  🟡 5 due within 14 days                       │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  💡 Tip 1 of 3: Managing Tasks                             [×] │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Snooze Menu (on clicking ⋮)

```
┌──────────────────────┐
│ Snooze for 1 hour    │
│ Snooze for 24 hours  │
│ Snooze for 1 week    │
└──────────────────────┘
```

---

## Styling

| Element | Value |
|---------|-------|
| Background | `linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)` (amber/warning) |
| Border | `1px solid #FCD34D` |
| Border radius | `4px` |
| Overdue chip background | `#FEE2E2` |
| Overdue chip text | `#DC2626` |
| Due soon chip background | `#FEF3C7` |
| Due soon chip text | `#D97706` |

---

## Acceptance Criteria

- [ ] Warning banner appears on Tasks page when there are overdue or upcoming tasks
- [ ] Banner shows correct counts for overdue and due-soon items
- [ ] Snooze menu appears when clicking the menu icon
- [ ] Snooze persists across page refreshes (localStorage)
- [ ] Banner reappears after snooze period expires
- [ ] Banner does not appear if no deadlines exist
- [ ] Banner appears above Tips component
- [ ] Responsive design works on mobile

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `Clients/src/presentation/components/DeadlineWarningBox/index.tsx` | Main warning banner component |
| `Clients/src/application/hooks/useDeadlineWarnings.ts` | Hook for fetching and managing warnings |
| `Clients/src/application/config/deadlineConfig.ts` | Configuration constants |
| `Servers/controllers/deadline.ctrl.ts` | Backend controller |
| `Servers/routes/deadline.route.ts` | API routes |
| `Servers/utils/deadline.utils.ts` | Database queries |

### Modified Files

| File | Change |
|------|--------|
| `Clients/src/presentation/pages/Tasks/index.tsx` | Add DeadlineWarningBox component |
| `Servers/index.ts` | Register deadline routes |

---

## Dependencies

- **Existing components to reuse:**
  - `InfoBox` component (supports `variant="warning"`)
  - `DaysChip` component (for deadline display)

- **Existing backend logic:**
  - Tasks model already has `isOverdue()` method

---

## Available Entities with Deadlines (Future Phases)

| Entity | Field | Type | Current State |
|--------|-------|------|---------------|
| Tasks | `due_date` | DATE | ✅ Has `isOverdue()` method |
| Vendors | `review_date` | DATE | Has review status enum |
| Policies | `next_review_date` | DATE | Field exists |
| Risks | `deadline` | DATE | Mitigation deadline |
| Models | `status_date` | DATE | Status tracking only |
| Training | N/A | ENUM | No date field |

---

## Labels

`enhancement`, `frontend`, `backend`, `ux`, `phase-1`

---

## Estimated Effort

| Area | Time |
|------|------|
| Backend API | 2-3 hours |
| Frontend Component | 4-5 hours |
| Testing | 2 hours |
| **Total** | **8-10 hours** |
