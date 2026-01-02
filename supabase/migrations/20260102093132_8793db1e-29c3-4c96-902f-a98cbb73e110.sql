-- Allow handlers to insert their own enrollment registrations
CREATE POLICY "Handlers can insert own enrollment registrations"
ON public.enrollment_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE auth_user_id = auth.uid()
  )
);

-- Allow handlers to view their own enrollment registrations
CREATE POLICY "Handlers can view own enrollment registrations"
ON public.enrollment_registrations
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE auth_user_id = auth.uid()
  )
);