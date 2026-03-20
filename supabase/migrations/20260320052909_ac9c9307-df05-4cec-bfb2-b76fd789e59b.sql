
-- One-time cleanup: mark stale next_actions as completed where the referenced
-- next class has already been completed for that handler+dog
UPDATE handler_class_status hcs
SET action_completed = true, action_completed_at = now()
WHERE hcs.action_completed = false
  AND hcs.next_action IS NOT NULL
  AND hcs.next_action != 'none'
  AND hcs.next_class_type IS NOT NULL
  AND hcs.dog_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM handler_class_status hcs2
    WHERE hcs2.handler_id = hcs.handler_id
      AND hcs2.dog_id = hcs.dog_id
      AND hcs2.completed = true
      AND hcs.next_class_type ILIKE '%' || hcs2.class_type || '%'
  );

-- Backfill missing dog_id/dog_name on old handler_tasks using class_status_id linkage
UPDATE handler_tasks ht
SET 
  dog_id = hcs.dog_id,
  dog_name = d.name
FROM handler_class_status hcs
LEFT JOIN dogs d ON d.id = hcs.dog_id
WHERE ht.class_status_id = hcs.id
  AND ht.dog_id IS NULL
  AND hcs.dog_id IS NOT NULL;
