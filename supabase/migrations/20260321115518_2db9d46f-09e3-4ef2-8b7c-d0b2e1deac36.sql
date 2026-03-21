
-- One-time cleanup: mark stale status records as resolved where handler+dog is already enrolled in the target class
UPDATE handler_class_status 
SET action_completed = true
WHERE next_action IN ('wants_info', 'continuing')
  AND (action_completed IS NULL OR action_completed = false)
  AND EXISTS (
    SELECT 1 FROM bookings b
    JOIN class_schedules cs ON cs.id = b.class_schedule_id
    JOIN classes cl ON cl.id = cs.class_id
    WHERE b.client_id = handler_class_status.handler_id
      AND b.is_enrolled = true
      AND (
        (handler_class_status.dog_id IS NOT NULL AND b.dog_id = handler_class_status.dog_id)
        OR handler_class_status.dog_id IS NULL
      )
      AND cl.class_type = COALESCE(handler_class_status.next_class_type, handler_class_status.class_type)
  );
