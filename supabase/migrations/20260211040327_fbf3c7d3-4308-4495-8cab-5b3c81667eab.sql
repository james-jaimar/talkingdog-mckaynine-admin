
-- 1. Restore Ady's profiles.role to admin
UPDATE public.profiles SET role = 'admin' WHERE id = 'ae0b1b9d-6942-45ad-a0ab-49c601bb26e8';

-- 2. Drop the old handler_tasks RLS policy that uses profiles.role
DROP POLICY IF EXISTS "Staff can manage handler tasks" ON public.handler_tasks;

-- 3. Create new policy using has_role() which checks user_roles table
CREATE POLICY "Staff can manage handler tasks"
ON public.handler_tasks
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
