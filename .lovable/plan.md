

# Fix: Stopping Icon Not Showing in Handler Status Lane

## Problem

Tanja Oosthuizen has `next_action = 'stopping'` with `action_completed = true` for Puppy (Rollo). The status icon is being suppressed by line 48 of `HandlerStatusCell.tsx`:

```typescript
if (s.action_completed && pendingTasks.length === 0) continue;
```

This logic is meant to hide resolved follow-up actions (like "wants info" after info has been sent). But **"stopping" is a terminal status** — it should always display so admins can see at a glance who is leaving.

## Fix

### File: `src/components/handlers/table/HandlerStatusCell.tsx`

Line 48 — exclude `stopping` from the suppression check:

```typescript
// Skip fully completed/resolved actions — but never hide 'stopping' (terminal status)
if (s.action_completed && pendingTasks.length === 0 && s.next_action !== 'stopping') continue;
```

One line changed. The stopping icon will now always appear in the status lane regardless of `action_completed`.

