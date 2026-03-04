
ALTER TABLE public.handler_tasks 
  ADD COLUMN dog_id uuid REFERENCES public.dogs(id) ON DELETE SET NULL,
  ADD COLUMN dog_name text;
