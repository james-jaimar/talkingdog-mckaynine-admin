-- Create missing handler_tasks for handler_class_status records that have next_action but no corresponding task
INSERT INTO handler_tasks (handler_id, class_type, class_status_id, task_type, title, description, status)
SELECT 
  hcs.handler_id,
  hcs.class_type,
  hcs.id as class_status_id,
  CASE 
    WHEN hcs.next_action = 'wants_info' THEN 'send_info_pack'
    WHEN hcs.next_action = 'continuing' THEN 'enrollment'
    ELSE 'follow_up'
  END as task_type,
  CASE 
    WHEN hcs.next_action = 'wants_info' THEN 
      'Send ' || COALESCE(
        CASE hcs.class_type
          WHEN 'Puppy' THEN 'EO'
          WHEN 'EO' THEN 'CGC Bronze'
          WHEN 'CGC Bronze' THEN 'CGC Silver'
          WHEN 'Beginner' THEN 'Novice'
          ELSE 'next class'
        END, 'next class') || ' info pack'
    WHEN hcs.next_action = 'continuing' THEN 
      'Enroll in ' || COALESCE(hcs.next_class_type, 
        CASE hcs.class_type
          WHEN 'Puppy' THEN 'EO'
          WHEN 'EO' THEN 'CGC Bronze'
          WHEN 'CGC Bronze' THEN 'CGC Silver'
          WHEN 'Beginner' THEN 'Novice'
          ELSE 'next class'
        END)
    ELSE 'Follow up required'
  END as title,
  'Handler completed ' || hcs.class_type || '. Follow up on next steps.' as description,
  'pending' as status
FROM handler_class_status hcs
WHERE hcs.next_action IN ('wants_info', 'continuing')
  AND hcs.action_completed = false
  AND NOT EXISTS (
    SELECT 1 FROM handler_tasks ht 
    WHERE ht.class_status_id = hcs.id
  );