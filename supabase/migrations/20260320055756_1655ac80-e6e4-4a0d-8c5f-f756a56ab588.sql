-- Backfill next_class_type on handler_class_status using class_types progression map
UPDATE handler_class_status hcs
SET next_class_type = ct.next_class_type
FROM class_types ct
WHERE ct.name = hcs.class_type
  AND ct.next_class_type IS NOT NULL
  AND hcs.next_class_type IS NULL
  AND hcs.next_action IS NOT NULL
  AND hcs.next_action != 'none';

-- Mark action_completed=true where the handler+dog has already completed the target class
UPDATE handler_class_status hcs
SET action_completed = true, action_completed_at = now()
WHERE hcs.action_completed = false
  AND hcs.next_action IS NOT NULL
  AND hcs.next_action != 'none'
  AND hcs.next_class_type IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM handler_class_status hcs2
    WHERE hcs2.handler_id = hcs.handler_id
      AND hcs2.completed = true
      AND hcs.next_class_type ILIKE '%' || hcs2.class_type || '%'
      AND (
        (hcs.dog_id IS NOT NULL AND hcs2.dog_id = hcs.dog_id)
        OR (hcs.dog_id IS NULL OR hcs2.dog_id IS NULL)
      )
  );

-- Mark action_completed=true where all linked tasks are completed/cancelled (none pending)
UPDATE handler_class_status hcs
SET action_completed = true, action_completed_at = now()
WHERE hcs.action_completed = false
  AND hcs.next_action IS NOT NULL
  AND hcs.next_action != 'none'
  AND NOT EXISTS (
    SELECT 1 FROM handler_tasks ht
    WHERE ht.class_status_id = hcs.id AND ht.status = 'pending'
  )
  AND EXISTS (
    SELECT 1 FROM handler_tasks ht
    WHERE ht.class_status_id = hcs.id AND ht.status IN ('completed', 'cancelled')
  );

-- Backfill class_status_id on unlinked pending tasks (unambiguous match only)
UPDATE handler_tasks ht
SET class_status_id = matched.status_id
FROM (
  SELECT DISTINCT ON (ht2.id) ht2.id as task_id, hcs.id as status_id
  FROM handler_tasks ht2
  JOIN handler_class_status hcs 
    ON hcs.handler_id = ht2.handler_id
    AND hcs.class_type = ht2.class_type
    AND hcs.dog_id = ht2.dog_id
    AND hcs.next_action IS NOT NULL
    AND hcs.next_action != 'none'
  WHERE ht2.class_status_id IS NULL
    AND ht2.status = 'pending'
    AND ht2.dog_id IS NOT NULL
  -- Only keep tasks that match exactly one status row
  AND (SELECT COUNT(*) FROM handler_class_status hcs3
       WHERE hcs3.handler_id = ht2.handler_id
         AND hcs3.class_type = ht2.class_type
         AND hcs3.dog_id = ht2.dog_id
         AND hcs3.next_action IS NOT NULL
         AND hcs3.next_action != 'none') = 1
) matched
WHERE ht.id = matched.task_id;

-- Backfill dog_id/dog_name on handler_tasks that have class_status_id but missing dog info
UPDATE handler_tasks ht
SET 
  dog_id = hcs.dog_id,
  dog_name = d.name
FROM handler_class_status hcs
LEFT JOIN dogs d ON d.id = hcs.dog_id
WHERE ht.class_status_id = hcs.id
  AND ht.dog_id IS NULL
  AND hcs.dog_id IS NOT NULL;