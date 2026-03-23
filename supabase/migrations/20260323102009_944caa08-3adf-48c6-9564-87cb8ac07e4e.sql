ALTER TABLE public.email_queue DROP CONSTRAINT IF EXISTS email_queue_status_check;
ALTER TABLE public.email_queue ADD CONSTRAINT email_queue_status_check 
  CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'review'));