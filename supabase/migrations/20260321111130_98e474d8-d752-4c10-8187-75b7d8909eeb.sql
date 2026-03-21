
-- One-time cleanup: auto-resolve stale handler_class_status records
-- where the handler+dog is already enrolled in the target class type
UPDATE handler_class_status hcs
SET action_completed = true, action_completed_at = now()
WHERE hcs.action_completed = false
  AND hcs.next_action IN ('wants_info', 'continuing')
  AND hcs.dog_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM bookings b
    JOIN class_schedules cs ON cs.id = b.class_schedule_id
    JOIN classes c ON c.id = cs.class_id
    WHERE b.client_id = hcs.handler_id
      AND b.dog_id = hcs.dog_id
      AND b.is_enrolled = true
      AND hcs.next_class_type LIKE '%' || c.class_type || '%'
  );
