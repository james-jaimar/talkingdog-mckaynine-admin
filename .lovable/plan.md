

## Audit: Class Closure Writing to Handler Class Status

### Finding: The core data flow is already compatible

The class closure modal writes `classType` (from `classes.class_type`, e.g., "Puppy", "EO") directly into `handler_class_status.class_type`. The Handlers table reads `handler_class_status.class_type` and matches it against `class_types.name`. Since these are all the same strings, the data flows correctly end-to-end. No migration or linking to UUIDs is needed.

Similarly, `useMarkHandlersCompleted` (the auto-complete path) reads `class_type` from the `classes` table and writes it as-is to `handler_class_status`. This also works.

### One issue found: Hardcoded `NEXT_CLASS_MAP`

In `ClassClosureModal.tsx` (line 21-26), there is a hardcoded progression map used for auto-generating task titles:

```typescript
const NEXT_CLASS_MAP = {
  "Puppy": "EO",
  "EO": "CGC Bronze",
  "CGC Bronze": "CGC Silver",
  "Beginner": "Novice",
};
```

This is used when creating follow-up tasks (lines 207, 218) to generate descriptions like "Send EO info pack" when the handler's `next_class_type` isn't explicitly set. If Ady adds or renames class types via the admin UI, this map won't reflect those changes.

### Plan

1. **Add a `next_class_type` column to the `class_types` table** -- a self-referencing text field (stores the name of the suggested next class type). This makes class progression configurable from the Admin Settings alongside the existing class type management.

2. **Update `ClassClosureModal.tsx`** -- Replace the hardcoded `NEXT_CLASS_MAP` with a lookup from the dynamic class types data. Fetch the `next_class_type` for the current class type from the database. Fall back gracefully if not set.

3. **Update `ClassTypesManager.tsx`** -- Add an optional "Next Class" dropdown to each class type row so Ady can configure progressions (e.g., Puppy -> EO) from the admin UI.

4. **Seed the new column** with the current hardcoded values during migration so nothing breaks.

### What does NOT need changing
- The `handler_class_status.class_type` write path -- already uses the correct string names
- The `useMarkHandlersCompleted` hook -- same, already compatible
- The `HandlerCompletionRow` "Next Class" dropdown -- already uses `useClassTypes()` dynamically (line 167)

### Technical Detail

Migration SQL:
```sql
ALTER TABLE class_types ADD COLUMN next_class_type text;

-- Seed existing progressions
UPDATE class_types SET next_class_type = 'EO' WHERE name = 'Puppy';
UPDATE class_types SET next_class_type = 'CGC Bronze' WHERE name = 'EO';
UPDATE class_types SET next_class_type = 'CGC Silver' WHERE name = 'CGC Bronze';
UPDATE class_types SET next_class_type = 'Novice' WHERE name = 'Beginner';
```

In the closure modal, replace:
```typescript
const nextClass = NEXT_CLASS_MAP[classType] || "next class";
```
with a lookup from the fetched class types data.

