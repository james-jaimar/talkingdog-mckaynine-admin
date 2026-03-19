ALTER TABLE public.handler_tasks 
  ADD COLUMN target_term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL;