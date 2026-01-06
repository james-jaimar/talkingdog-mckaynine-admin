-- Drop old policy
DROP POLICY IF EXISTS "Platform admins can manage branch email templates" ON public.branch_email_templates;

-- Create new policy that allows platform_admin and admin roles
CREATE POLICY "Admins can manage branch email templates"
ON public.branch_email_templates
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'platform_admin') OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'platform_admin') OR 
  public.has_role(auth.uid(), 'admin')
);