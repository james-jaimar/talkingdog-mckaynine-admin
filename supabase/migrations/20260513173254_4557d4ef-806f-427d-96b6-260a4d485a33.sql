INSERT INTO handler_tasks (handler_id, class_status_id, class_type, dog_id, task_type, title, description, status)
SELECT hcs.handler_id, hcs.id, hcs.class_type, hcs.dog_id,
  'send_info_pack',
  'Send info pack: ' || COALESCE(hcs.next_class_type, 'next class') || COALESCE(' (' || d.name || ')', ''),
  'Backfilled — handler asked for info on ' || COALESCE(hcs.next_class_type, 'next class') || ' after ' || hcs.class_type || '.',
  'pending'
FROM handler_class_status hcs
LEFT JOIN dogs d ON d.id = hcs.dog_id
WHERE hcs.next_action = 'wants_info'
  AND hcs.action_completed = false
  AND NOT EXISTS (SELECT 1 FROM handler_tasks ht WHERE ht.class_status_id = hcs.id);