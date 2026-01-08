-- Create class_invitations table for tracking enrollment invitations sent to handlers
CREATE TABLE public.class_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handler_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  class_schedule_id UUID NOT NULL REFERENCES public.class_schedules(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  completed_class_type TEXT, -- What class type they just completed (e.g., 'Puppy')
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.handler_tasks(id) ON DELETE SET NULL,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.class_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Admins and trainers can view all invitations
CREATE POLICY "Staff can view all invitations"
ON public.class_invitations
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'trainer')
);

-- Handlers can view their own invitations
CREATE POLICY "Handlers can view own invitations"
ON public.class_invitations
FOR SELECT
USING (
  handler_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);

-- Staff can insert invitations
CREATE POLICY "Staff can create invitations"
ON public.class_invitations
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'trainer')
);

-- Staff can update any invitation
CREATE POLICY "Staff can update invitations"
ON public.class_invitations
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'trainer')
);

-- Handlers can update their own invitations (to accept/decline)
CREATE POLICY "Handlers can update own invitations"
ON public.class_invitations
FOR UPDATE
USING (
  handler_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_class_invitations_updated_at
BEFORE UPDATE ON public.class_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for token lookups (used in the enrollment URL)
CREATE INDEX idx_class_invitations_token ON public.class_invitations(token);

-- Create index for handler lookups
CREATE INDEX idx_class_invitations_handler ON public.class_invitations(handler_id);

-- Create index for status filtering
CREATE INDEX idx_class_invitations_status ON public.class_invitations(status);