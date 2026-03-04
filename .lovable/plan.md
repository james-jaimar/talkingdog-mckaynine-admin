

## Backfill dog_id/dog_name on Recent Tasks (Last 30 Days)

A focused data fix targeting only tasks created in the last month, using the same 3-step approach but scoped with a date filter.

### SQL Scripts (run via insert tool)

**Step 1**: Fix tasks that have a `class_status_id` link (most reliable source):
```sql
UPDATE handler_tasks ht
SET dog_id = hcs.dog_id, dog_name = d.name,
    title = CASE WHEN ht.title NOT LIKE '%(' || d.name || ')%' 
            THEN ht.title || ' (' || d.name || ')' ELSE ht.title END
FROM handler_class_status hcs
JOIN dogs d ON hcs.dog_id = d.id
WHERE ht.class_status_id = hcs.id
  AND ht.dog_id IS NULL AND hcs.dog_id IS NOT NULL
  AND ht.created_at >= now() - interval '30 days';
```

**Step 2**: Fix tasks where handler has exactly 1 dog (no ambiguity):
```sql
UPDATE handler_tasks ht
SET dog_id = d.id, dog_name = d.name,
    title = CASE WHEN ht.title NOT LIKE '%(' || d.name || ')%'
            THEN ht.title || ' (' || d.name || ')' ELSE ht.title END
FROM dogs d
WHERE d.client_id = ht.handler_id
  AND ht.dog_id IS NULL AND ht.class_status_id IS NULL
  AND (SELECT COUNT(*) FROM dogs WHERE client_id = ht.handler_id) = 1
  AND ht.created_at >= now() - interval '30 days';
```

**Step 3**: For multi-dog handlers, match dog name from task title:
```sql
UPDATE handler_tasks ht
SET dog_id = d.id, dog_name = d.name
FROM dogs d
WHERE d.client_id = ht.handler_id
  AND ht.dog_id IS NULL AND ht.class_status_id IS NULL
  AND ht.title LIKE '%(' || d.name || ')%'
  AND ht.created_at >= now() - interval '30 days';
```

### No code changes needed
This is purely a data fix run via the Supabase insert tool. All 3 statements will be executed in sequence.

