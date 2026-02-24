
-- Add branch_id column to handler_tasks
ALTER TABLE public.handler_tasks
ADD COLUMN branch_id uuid REFERENCES public.branches(id);

-- Backfill existing tasks from their handler's branch
UPDATE public.handler_tasks
SET branch_id = clients.branch_id
FROM public.clients
WHERE handler_tasks.handler_id = clients.id
  AND handler_tasks.branch_id IS NULL;
