
-- Create table for tracking substitute trainers on specific class dates
CREATE TABLE public.class_date_substitutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_schedule_id UUID NOT NULL REFERENCES public.class_schedules(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  substitute_trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  original_trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Only one substitute per date per schedule
  UNIQUE(class_schedule_id, class_date)
);

-- Enable RLS
ALTER TABLE public.class_date_substitutes ENABLE ROW LEVEL SECURITY;

-- Admins can read all substitutes
CREATE POLICY "Admins can read substitutes"
ON public.class_date_substitutes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert substitutes
CREATE POLICY "Admins can insert substitutes"
ON public.class_date_substitutes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update substitutes
CREATE POLICY "Admins can update substitutes"
ON public.class_date_substitutes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete substitutes
CREATE POLICY "Admins can delete substitutes"
ON public.class_date_substitutes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trainers can read their own substitutions (where they are the sub or the original)
CREATE POLICY "Trainers can read own substitutes"
ON public.class_date_substitutes
FOR SELECT
TO authenticated
USING (
  substitute_trainer_id IN (SELECT id FROM public.trainers WHERE user_id = auth.uid())
  OR original_trainer_id IN (SELECT id FROM public.trainers WHERE user_id = auth.uid())
);

-- Index for efficient lookups
CREATE INDEX idx_class_date_subs_schedule ON public.class_date_substitutes(class_schedule_id);
CREATE INDEX idx_class_date_subs_sub_trainer ON public.class_date_substitutes(substitute_trainer_id);
CREATE INDEX idx_class_date_subs_orig_trainer ON public.class_date_substitutes(original_trainer_id);
