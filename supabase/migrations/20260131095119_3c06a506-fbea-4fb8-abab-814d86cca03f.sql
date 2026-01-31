-- Create system_settings table for app-wide configuration
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only platform admins and admins can view settings
CREATE POLICY "Admins can view system settings"
ON public.system_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

-- Only platform admins can modify settings
CREATE POLICY "Platform admins can manage system settings"
ON public.system_settings
FOR ALL
USING (has_role(auth.uid(), 'platform_admin'))
WITH CHECK (has_role(auth.uid(), 'platform_admin'));

-- Insert default IO offline mode setting
INSERT INTO public.system_settings (key, value, description)
VALUES ('io_offline_mode', 'false'::jsonb, 'When true, uses local PDF generation instead of InvoicesOnline');

-- Add updated_at trigger
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();