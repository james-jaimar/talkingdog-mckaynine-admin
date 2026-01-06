-- Extend branch_email_templates table with new columns
ALTER TABLE branch_email_templates 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS class_type TEXT,
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create email_attachments table for reusable attachments
CREATE TABLE IF NOT EXISTS public.email_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  class_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_attachments
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for email_attachments (admin/trainer access)
CREATE POLICY "Staff can view email attachments" 
ON public.email_attachments 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can create email attachments" 
ON public.email_attachments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can update email attachments" 
ON public.email_attachments 
FOR UPDATE 
USING (true);

CREATE POLICY "Staff can delete email attachments" 
ON public.email_attachments 
FOR DELETE 
USING (true);

-- Create email_log table to track sent emails
CREATE TABLE IF NOT EXISTS public.email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handler_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  task_id UUID REFERENCES handler_tasks(id) ON DELETE SET NULL,
  template_id UUID REFERENCES branch_email_templates(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_by UUID,
  status TEXT DEFAULT 'sent',
  error_message TEXT
);

-- Enable RLS on email_log
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- Create policies for email_log (admin/trainer can view/create)
CREATE POLICY "Staff can view email logs" 
ON public.email_log 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can create email logs" 
ON public.email_log 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updated_at on email_attachments
CREATE TRIGGER update_email_attachments_updated_at
BEFORE UPDATE ON public.email_attachments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();