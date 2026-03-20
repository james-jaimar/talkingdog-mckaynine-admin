update public.handler_class_status hcs
set action_completed = false,
    action_completed_at = null
where hcs.next_action = 'stopping'
  and coalesce(hcs.action_completed, false) = true
  and not exists (
    select 1
    from public.handler_tasks ht
    where ht.class_status_id = hcs.id
      and ht.status = 'completed'
  );