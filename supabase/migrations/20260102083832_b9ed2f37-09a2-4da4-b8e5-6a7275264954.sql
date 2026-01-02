-- Add insert policy for handler_onboarding so users can create their own records
CREATE POLICY "Users can insert their own onboarding record"
ON public.handler_onboarding
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add policy for staff to insert onboarding records (for admin-created handlers)
CREATE POLICY "Staff can insert onboarding records"
ON public.handler_onboarding
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'platform_admin'));