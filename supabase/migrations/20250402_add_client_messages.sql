
-- Create client_messages table for the communication feature
CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_from_client BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_client_messages_updated_at
BEFORE UPDATE ON public.client_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Staff can view, insert and update messages for all clients
CREATE POLICY "Staff can view all client messages" 
ON public.client_messages
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'trainer')
  )
);

CREATE POLICY "Staff can insert client messages" 
ON public.client_messages
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'trainer')
  )
);

-- Clients can view their own messages only
CREATE POLICY "Clients can view their own messages" 
ON public.client_messages
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_id 
    AND clients.email = (
      SELECT email FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  )
);

-- Clients can insert messages only for themselves
CREATE POLICY "Clients can insert their own messages" 
ON public.client_messages
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_id 
    AND clients.email = (
      SELECT email FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  )
);

-- Enable realtime for client messages
ALTER PUBLICATION supabase_realtime ADD TABLE client_messages;
