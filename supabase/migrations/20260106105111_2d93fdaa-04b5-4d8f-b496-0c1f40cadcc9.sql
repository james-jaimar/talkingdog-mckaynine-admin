-- Create template_configurations table for storing admin-configurable template settings
CREATE TABLE public.template_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  template_code TEXT NOT NULL, -- e.g., "eo_info_pack", "puppy_info_pack"
  class_type TEXT, -- e.g., "EO", "Puppy", "CGC Bronze"
  name TEXT NOT NULL, -- Display name for admins
  description TEXT, -- Brief description of when to use this template
  variables JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores the configured values like class_day_time, pricing, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(branch_id, template_code)
);

-- Enable RLS
ALTER TABLE public.template_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage template configurations"
ON public.template_configurations
FOR ALL
USING (
  has_role(auth.uid(), 'platform_admin'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'platform_admin'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Trainers can view template configurations"
ON public.template_configurations
FOR SELECT
USING (has_role(auth.uid(), 'trainer'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_template_configurations_updated_at
BEFORE UPDATE ON public.template_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();