-- Step 1: Create helper function to get assistant's branch (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_assistant_branch_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT branch_id FROM assistants WHERE user_id = user_uuid LIMIT 1;
$$;

-- Step 2: Drop the problematic recursive policy
DROP POLICY IF EXISTS "Assistants can read all assistants in their branch" ON assistants;

-- Step 3: Create fixed policy using the helper function
CREATE POLICY "Assistants can read all assistants in their branch"
ON assistants FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'assistant'::app_role)
    AND branch_id = get_assistant_branch_id(auth.uid())
  )
);