-- Resolve Robin/Dan CGC Bronze stuck status
UPDATE handler_class_status
SET action_completed = true, action_completed_at = now()
WHERE id = '751f947e-e6a3-422d-97dd-d72529ea863d';

-- Sweep any other rows in the same orphaned state:
-- next_action set, action_completed=false, but every linked handler_tasks
-- row is non-pending (cancelled/completed). Nothing actionable remains.
UPDATE handler_class_status hcs
SET action_completed = true, action_completed_at = now()
WHERE action_completed = false
  AND next_action IS NOT NULL
  AND next_action NOT IN ('none', 'stopping')
  AND EXISTS (
    SELECT 1 FROM handler_tasks ht WHERE ht.class_status_id = hcs.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM handler_tasks ht
    WHERE ht.class_status_id = hcs.id AND ht.status = 'pending'
  );