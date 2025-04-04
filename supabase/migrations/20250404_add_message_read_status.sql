
-- Create a table to track which messages have been read by clients
CREATE TABLE IF NOT EXISTS public.message_read_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.client_messages(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Create a unique constraint to prevent duplicate entries
    UNIQUE(client_id, message_id)
);

-- Add comment to table
COMMENT ON TABLE public.message_read_status IS 'Tracks which messages have been read by which clients';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_message_read_status_client_id ON public.message_read_status(client_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON public.message_read_status(message_id);

-- Add RLS policies
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- Allow clients to mark their own messages as read
CREATE POLICY "Clients can mark their own messages as read"
ON public.message_read_status
FOR INSERT TO authenticated
WITH CHECK (
    client_id IN (
        SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'
    )
);

-- Allow staff and admins to view read status
CREATE POLICY "Staff and admins can view read status"
ON public.message_read_status
FOR SELECT TO authenticated
USING (true);

-- Allow staff and admins to mark messages as read for any client
CREATE POLICY "Staff and admins can mark messages as read"
ON public.message_read_status
FOR INSERT TO authenticated
WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff')
);
