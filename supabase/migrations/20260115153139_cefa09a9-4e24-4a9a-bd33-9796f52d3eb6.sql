-- Create trainer_branches junction table for many-to-many relationship
CREATE TABLE public.trainer_branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trainer_id, branch_id)
);

-- Enable RLS
ALTER TABLE public.trainer_branches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view trainer branches" 
ON public.trainer_branches 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage trainer branches" 
ON public.trainer_branches 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'platform_admin')
  )
);

-- Migrate existing trainer-branch relationships to the new table
INSERT INTO public.trainer_branches (trainer_id, branch_id)
SELECT id, branch_id 
FROM public.trainers 
WHERE branch_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create index for better query performance
CREATE INDEX idx_trainer_branches_trainer_id ON public.trainer_branches(trainer_id);
CREATE INDEX idx_trainer_branches_branch_id ON public.trainer_branches(branch_id);