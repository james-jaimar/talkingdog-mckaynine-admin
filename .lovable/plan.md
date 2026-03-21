

# Data Audit Results + Fix for Stale Status Icons

## Audit Findings

### Current active status counts (action_completed = false)
- **wants_info**: 46 records
- **continuing**: 10 records
- **stopping**: 6 records
- **Total**: 62 active status records

### Issue 1: Safety net blind spot — 35+ stale records not suppressed
For class types with no `next_class_type` in the `class_types` table (Yoga, WT, Novice, CGC Silver, A-Test, Tricks), the safety net in `useHandlersData.ts` never checks enrollment because `targetStr` is null and the entire check is skipped.

Examples of handlers showing stale icons despite being actively enrolled:
- Allison Gilbert — "wants_info" + "continuing" for Yoga, but enrolled in Yoga
- Heike Hardingham — "continuing" + "wants_info" for Yoga, but enrolled in Yoga
- Suzette Nel — "continuing" + "wants_info" for Yoga, but enrolled in Yoga
- Amy Humphrey — "continuing" + "wants_info" for Yoga (Nelson), but enrolled
- Benjamin McNally — "wants_info" for WT (Gordon), but enrolled in WT
- Beryl Kolb — "wants_info" for WT (Luigi), but enrolled in WT
- Emma Done — "wants_info" for WT (Jagger), but enrolled in WT
- And ~25 more...

### Issue 2: 30 active statuses with NO pending tasks
These handlers have a "wants_info" or "continuing" status but no corresponding pending task. Many are stale (enrolled already) and will be caught by fixing Issue 1. A few may need manual review.

### Issue 3: Stopping count is correct at 6
The 6 stopping handlers are genuine — these are excluded from auto-resolve by design.

## Fix

### Code fix: `src/components/handlers/hooks/useHandlersData.ts` (~line 296)

When `next_class_type` is null AND there's no fallback from `class_types`, the target class should be the **source class itself** for `continuing` and `wants_info`. If someone "wants info for Yoga" or is "continuing Yoga", the target IS Yoga — check if they're enrolled in Yoga.

```typescript
// Current (line 299):
const targetStr = nextClassTypeStr || fallbackNext;

// Fixed:
const targetStr = nextClassTypeStr || fallbackNext || classType;
```

This single change means: if neither `next_class_type` on the record nor the class_types table provides a target, fall back to the source class. This correctly handles Yoga continuing (target = Yoga), WT wants_info (target = WT), etc.

### DB cleanup: Mark enrolled handlers as resolved

Run a one-time update to set `action_completed = true` on the ~35 status records where the handler+dog is already enrolled in the target class. This cleans the underlying data so even without the display safety net, the records are correct.

## Impact
- ~35 stale icons will be suppressed (Yoga continuing, WT wants_info, etc.)
- Active statuses drop from 62 to ~27 genuinely actionable items
- 6 stopping handlers remain untouched
- Handlers with real pending tasks (Angela Glover, etc.) still show icons correctly

## Files Changed
1. `src/components/handlers/hooks/useHandlersData.ts` — 1 line changed (fallback to source class)
2. DB migration — resolve stale records where handler is enrolled

