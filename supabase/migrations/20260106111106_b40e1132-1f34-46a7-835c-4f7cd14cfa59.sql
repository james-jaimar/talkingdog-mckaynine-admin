-- Create platform_email_templates table for storing editable templates
CREATE TABLE public.platform_email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  class_type TEXT,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  configurable_fields JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_email_templates ENABLE ROW LEVEL SECURITY;

-- Platform admins can do everything
CREATE POLICY "Platform admins can manage all templates"
ON public.platform_email_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'platform_admin'
  )
);

-- Admins and trainers can read active templates
CREATE POLICY "Staff can read active templates"
ON public.platform_email_templates
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'trainer')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_platform_email_templates_updated_at
BEFORE UPDATE ON public.platform_email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();