-- Create handler_households table for linking handlers in the same household
CREATE TABLE handler_households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handler_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  linked_handler_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  -- Prevent duplicate links (A->B is same as B->A conceptually, but stored once)
  CONSTRAINT unique_household_pair UNIQUE (handler_id, linked_handler_id),
  
  -- Prevent self-linking
  CONSTRAINT no_self_link CHECK (handler_id != linked_handler_id)
);

-- Indexes for fast lookups in both directions
CREATE INDEX idx_households_handler ON handler_households(handler_id);
CREATE INDEX idx_households_linked ON handler_households(linked_handler_id);

-- Enable RLS
ALTER TABLE handler_households ENABLE ROW LEVEL SECURITY;

-- Staff can manage household links
CREATE POLICY "Staff can manage household links" ON handler_households
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'trainer'::app_role) OR 
    has_role(auth.uid(), 'platform_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'trainer'::app_role) OR 
    has_role(auth.uid(), 'platform_admin'::app_role)
  );