UPDATE public.handler_tasks ht
SET branch_id = c.branch_id
FROM public.clients c
WHERE ht.handler_id = c.id
  AND ht.branch_id IS NULL
  AND c.branch_id IS NOT NULL;