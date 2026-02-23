

# Show Only Latest Yoga Entry Per Dog

## What Changes

In the handlers table, the Yoga column currently shows every completed month for each dog. Since Yoga is a recurring monthly class, this list grows indefinitely. We will filter Yoga entries so only the most recent one per dog is shown.

## How It Works

In `src/components/handlers/hooks/useHandlersData.ts`, where class statuses are mapped (around line 241-260), after collecting all statuses for a class type, we add a filter specifically for "Yoga":

- Group Yoga entries by `dog_id`
- For each dog, keep only the entry with the latest `period` (e.g., "Feb 26" > "Jan 26")
- All other class types remain unchanged -- every entry is shown as before

## Technical Detail

**File: `src/components/handlers/hooks/useHandlersData.ts`** (lines ~242-259)

After the line `const foundAll = allStatuses.filter(...)`, add logic:

```typescript
// For Yoga, only keep the latest entry per dog
let statusesToUse = foundAll;
if (classType === 'Yoga' && foundAll.length > 1) {
  const latestByDog = new Map<string, typeof foundAll[0]>();
  for (const entry of foundAll) {
    const dogKey = entry.dog_id || 'unknown';
    const existing = latestByDog.get(dogKey);
    if (!existing || (entry.period && (!existing.period || entry.period > existing.period))) {
      latestByDog.set(dogKey, entry);
    }
  }
  statusesToUse = Array.from(latestByDog.values());
}
```

Then map `statusesToUse` instead of `foundAll`. This is a single, contained change -- no other files are affected.

