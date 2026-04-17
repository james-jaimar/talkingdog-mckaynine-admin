
ALTER TABLE public.handler_tasks
  ADD COLUMN IF NOT EXISTS created_by_trainer_id uuid REFERENCES public.trainers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_trainer_id uuid REFERENCES public.trainers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_handler_tasks_target_trainer
  ON public.handler_tasks(target_trainer_id)
  WHERE target_trainer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_handler_tasks_created_by_trainer
  ON public.handler_tasks(created_by_trainer_id)
  WHERE created_by_trainer_id IS NOT NULL;
