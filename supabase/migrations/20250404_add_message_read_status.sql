
-- Add is_read column to client_messages table
ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Create index for better query performance with the is_read column
CREATE INDEX IF NOT EXISTS idx_client_messages_is_read ON public.client_messages(is_read);

-- Add comment to column
COMMENT ON COLUMN public.client_messages.is_read IS 'Whether the message has been read by the recipient';
