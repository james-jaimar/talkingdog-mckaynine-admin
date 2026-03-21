

# Simplify Status Icons: Show Only What Needs Action

## The Core Problem

The status column currently shows **every historical action** — completed or not. Angela Glover has 4 status records all with `action_completed = true`, so they all show as green "Info Sent" icons. But this is noise: the info was sent months ago, the dogs are enrolled, and the only actionable items are 2 pending tasks for June 2026.

The status column is trying to do two things at once:
1. Show the **current state** of follow-up actions (historical record)
2. Show what **needs attention now** (actionable items)

These conflict. A handler who had "wants info" 3 months ago, got info sent, enrolled, and now has a future task — shows a green icon for something that's long resolved.

## Proposed Rules for Status Icons

The status icon should answer ONE question: **"Does this handler need attention?"**

```text
Decision tree for each status record:
┌─────────────────────────────────────────┐
│ Has next_action (not 'none')?           │
│   NO → skip (no icon)                   │
│   YES ↓                                 │
│ Is action_completed = true?             │
│   YES → Has pending tasks for this      │
│          handler+dog+target class?      │
│          YES → Show task icon (amber)   │
│          NO  → skip (fully resolved)    │
│   NO ↓                                  │
│ Action type?                            │
│   wants_info → blue mail icon           │
│   continuing → green arrow icon         │
│   stopping   → red stop icon            │
└─────────────────────────────────────────┘
```

Key changes:
- **Remove "Info Sent" as a status icon entirely** — once info is sent AND there are no pending tasks, the action is done. No icon needed.
- **If info was sent but tasks remain** — show the task badge (already exists via `TaskBadge`), not a green mail icon
- **Only show icons for actions that genuinely need attention**

## Implementation

### File 1: `src/components/handlers/table/HandlerStatusCell.tsx`

**Change**: Skip statuses where `action_completed = true`. The "info_sent" concept is removed from the icon display. If a handler has completed actions but still has pending tasks, those show via the existing TaskBadge component (separate column).

Lines 45-64 — replace the grouping logic:
```typescript
for (const s of classStatuses) {
  if (!s.next_action || s.next_action === 'none') continue;
  // Skip fully completed actions — they don't need attention
  if (s.action_completed) continue;
  
  const effectiveType = s.next_action;
  // ... rest of grouping
}
```

This means Angela Glover would show **no status icon** (all her actions are completed), but she'd still show the task badge with her 2 pending June tasks.

### File 2: `src/components/handlers/hooks/useHandlersData.ts`

No changes needed — the safety net logic is correct. The filtering already works properly. The issue is purely in the display layer.

### No DB changes needed

Angela's data is correct: all `action_completed = true`, 2 pending tasks exist for June. The data is fine — we just need to stop displaying resolved actions as icons.

## Impact

- Handlers with only completed actions → **no icon** (clean)
- Handlers with pending "wants info" → **blue mail icon** (needs attention)
- Handlers with pending tasks → **amber task badge** (already works)
- Handlers stopping → **red stop icon** (always shown, never auto-resolved)
- Filter counts remain unchanged (they already check `!action_completed`)

## Files Changed
1. `src/components/handlers/table/HandlerStatusCell.tsx` — remove "info_sent" grouping, skip completed actions (~3 lines changed)

This is a small, focused change that removes the confusing "Info Sent" green icon and lets the existing TaskBadge handle the "has pending work" signal.

