

# Fix: Ady Can't See Tasks After Being Marked as Assistant

## Root Cause

When Ady was given the "assistant" role, her `profiles.role` column was overwritten from `admin` to `assistant`. The `handler_tasks` table has an RLS policy that checks `profiles.role` for access:

```text
Policy: "Staff can manage handler tasks"
Condition: profiles.role IN ('admin', 'trainer', 'platform_admin')
```

Since her profile now says `assistant` (not `admin`), she's blocked from seeing any tasks.

The `user_roles` table correctly has both `admin` AND `assistant` roles for Ady, but the RLS policy checks the old single-role `profiles` table instead.

## Fix (Two Parts)

### 1. Restore Ady's profile role (immediate data fix)
Update her `profiles.role` back to `admin` so she regains access right away.

### 2. Update the RLS policy to use `user_roles` table (proper fix)
Replace the `handler_tasks` RLS policy so it checks the `user_roles` table (via the `has_role()` function) instead of the legacy `profiles.role` column. This prevents the issue from recurring if roles are modified in the future.

**Current policy:**
```sql
-- Checks profiles.role (single value, can be overwritten)
EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin','trainer','platform_admin'))
```

**New policy:**
```sql
-- Checks user_roles table (supports multiple roles correctly)
has_role(auth.uid(), 'admin') OR 
has_role(auth.uid(), 'trainer') OR 
has_role(auth.uid(), 'platform_admin')
```

### 3. Prevent future overwrites
Review the `manage-user-role` Edge Function to ensure it does NOT overwrite `profiles.role` when adding a new role -- it should only update `user_roles`. This prevents the same bug from happening to other users.

## Files to Change

- **Database migration**: Update `profiles.role` for Ady + replace the `handler_tasks` RLS policy
- **`supabase/functions/manage-user-role/index.ts`**: Audit and fix any code that overwrites `profiles.role` when adding roles

