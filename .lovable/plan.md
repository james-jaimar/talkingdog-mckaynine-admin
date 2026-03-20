

# Fix: "Stopping" Filter Count Dropped from 6 to 3

## Root Cause

The display-side safety net added in the recent stale-icon fix (lines 263-277 of `useHandlersData.ts`) applies to **all** `next_action` types — including `'stopping'`. It checks whether the "next class" in the progression has been completed for that dog, and if so, marks the action as completed (hidden).

But "stopping" means the handler is **done** — there is no meaningful next class. When the fallback progression map resolves a target class (e.g., Puppy → EO), and the dog happens to have completed EO already, the safety net incorrectly suppresses the "stopping" icon. This hides ~3 legitimate "stopping" handlers.

## Fix

**File: `src/components/handlers/hooks/useHandlersData.ts`** (line 263)

Add `'stopping'` to the exclusion check. The safety net should only apply to forward-looking actions (`wants_info`, `continuing`), not terminal actions like `stopping`:

```typescript
if (effectiveNextAction && effectiveNextAction !== 'none' 
    && effectiveNextAction !== 'stopping'    // ← add this
    && !effectiveActionCompleted) {
```

**1 file, 1 line changed.**

