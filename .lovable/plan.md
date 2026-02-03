

# Fix: Infinite Recursion in Assistants RLS Policy

## Problem

When trying to add an assistant, the database returns a **500 error** with the message:
> "infinite recursion detected in policy for relation 'assistants'"

## Root Cause

The `assistants` table has an RLS policy called **"Assistants can read all assistants in their branch"** with this logic:

```sql
has_role(auth.uid(), 'assistant') AND (branch_id IN (
  SELECT a.branch_id FROM assistants a WHERE a.user_id = auth.uid()
))
```

This policy queries the `assistants` table **from within its own RLS policy**, creating infinite recursion:
1. User tries to access `assistants` table
2. Policy checks: "What branch is this assistant in?"
3. To answer that, it queries `assistants` again
4. Which triggers the same policy check again
5. ...infinite loop

## Solution

Replace the problematic policy with one that doesn't self-reference. There are two approaches:

### Option A: Use a Security Definer Function (Recommended)

Create a helper function that bypasses RLS to get the assistant's branch:

```sql
-- Create function to get user's assistant branch (bypasses RLS)
CREATE OR REPLACE FUNCTION get_assistant_branch_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT branch_id FROM assistants WHERE user_id = user_uuid LIMIT 1;
$$;

-- Drop and recreate the policy using the function
DROP POLICY IF EXISTS "Assistants can read all assistants in their branch" ON assistants;

CREATE POLICY "Assistants can read all assistants in their branch"
ON assistants FOR SELECT
USING (
  has_role(auth.uid(), 'assistant'::app_role)
  AND branch_id = get_assistant_branch_id(auth.uid())
);
```

### Option B: Simplify the Policy (Simpler)

If assistants don't actually need branch-level isolation, use a simple policy like the other tables:

```sql
DROP POLICY IF EXISTS "Assistants can read all assistants in their branch" ON assistants;

CREATE POLICY "Authenticated users can read assistants"
ON assistants FOR SELECT
USING (auth.role() = 'authenticated');
```

---

## Implementation

### Step 1: Create Helper Function

Run this SQL in Supabase to create a SECURITY DEFINER function that safely looks up the assistant's branch:

```sql
CREATE OR REPLACE FUNCTION public.get_assistant_branch_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT branch_id FROM assistants WHERE user_id = user_uuid LIMIT 1;
$$;
```

### Step 2: Replace the Problematic Policy

```sql
-- Remove the recursive policy
DROP POLICY IF EXISTS "Assistants can read all assistants in their branch" ON assistants;

-- Create a fixed policy using the helper function
CREATE POLICY "Assistants can read all assistants in their branch"
ON assistants FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'assistant'::app_role)
    AND branch_id = get_assistant_branch_id(auth.uid())
  )
);
```

---

## SQL to Run

Here's the complete SQL to fix the issue (run in Supabase SQL Editor):

```sql
-- Step 1: Create helper function
CREATE OR REPLACE FUNCTION public.get_assistant_branch_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT branch_id FROM assistants WHERE user_id = user_uuid LIMIT 1;
$$;

-- Step 2: Drop the problematic policy
DROP POLICY IF EXISTS "Assistants can read all assistants in their branch" ON assistants;

-- Step 3: Create fixed policy
CREATE POLICY "Assistants can read all assistants in their branch"
ON assistants FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'assistant'::app_role)
    AND branch_id = get_assistant_branch_id(auth.uid())
  )
);
```

---

## Why This Works

The `SECURITY DEFINER` function runs with the privileges of the function owner (typically superuser), not the calling user. This means it bypasses RLS when fetching the branch_id, breaking the infinite loop.

The policy then uses the returned branch_id for comparison, which is a simple equality check that doesn't trigger further RLS evaluations.

---

## After Fix

Once you run this SQL in your Supabase dashboard:
1. The "Add Assistant" form will work
2. Admins can still see all assistants
3. Assistants (when logged in) will only see assistants in their branch

