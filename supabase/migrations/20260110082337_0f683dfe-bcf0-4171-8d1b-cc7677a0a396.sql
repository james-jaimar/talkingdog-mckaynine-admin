-- Create email queue table for outbox functionality
CREATE TABLE public.email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  from_email TEXT,
  from_name TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  handler_id UUID REFERENCES public.clients(id),
  template_id UUID REFERENCES public.branch_email_templates(id),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view email queue for their branch"
ON public.email_queue
FOR SELECT
USING (
  branch_id IN (
    SELECT branch_id FROM public.clients WHERE auth_user_id = auth.uid()
    UNION
    SELECT branch_id FROM public.trainers WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'platform_admin')
  )
);

CREATE POLICY "Admins can insert into email queue"
ON public.email_queue
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'platform_admin', 'trainer')
  )
);

CREATE POLICY "Admins can update email queue"
ON public.email_queue
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'platform_admin')
  )
);

CREATE POLICY "Admins can delete from email queue"
ON public.email_queue
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'platform_admin')
  )
);

-- Create index for queue processing
CREATE INDEX idx_email_queue_status_scheduled ON public.email_queue(status, scheduled_for) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_email_queue_branch ON public.email_queue(branch_id);

-- Add branch_id to email_log if not exists (for better tracking)
ALTER TABLE public.email_log ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.email_log ADD COLUMN IF NOT EXISTS html_content TEXT;
ALTER TABLE public.email_log ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.email_log ADD COLUMN IF NOT EXISTS from_email TEXT;
ALTER TABLE public.email_log ADD COLUMN IF NOT EXISTS from_name TEXT;