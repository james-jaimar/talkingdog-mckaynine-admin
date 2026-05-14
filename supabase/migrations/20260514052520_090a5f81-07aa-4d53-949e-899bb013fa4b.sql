-- Defensive trigger: auto-populate handler_tasks.branch_id from the linked client
-- when an insert omits it. Prevents future raw SQL backfills (or any code path
-- that forgets the column) from creating "branchless" tasks invisible to the
-- branch-filtered Tasks page.

CREATE OR REPLACE FUNCTION public.set_handler_task_branch_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.branch_id IS NULL AND NEW.handler_id IS NOT NULL THEN
    SELECT c.branch_id
    INTO NEW.branch_id
    FROM public.clients c
    WHERE c.id = NEW.handler_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_handler_task_branch_id ON public.handler_tasks;

CREATE TRIGGER trg_set_handler_task_branch_id
BEFORE INSERT ON public.handler_tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_handler_task_branch_id();