
# Fix: Show All Users (Including Handlers) in User Management

## The Problem
Katherine Sinclaire doesn't appear in User Management because the `useUsers` hook filters profiles by `app_id = 'mckaynine-training'`, and her profile (along with 301 other handler/client profiles) has a `null` app_id. Only 7 profiles have the app_id set -- those are the staff users you see now.

## The Fix

### Step 1: Update `useUsers` query to include users with roles
**File: `src/hooks/useUsers.ts`**

Instead of filtering only by `app_id`, also include any user who has an entry in the `user_roles` table. This ensures handlers (who have a `handler` role in `user_roles`) appear in the list even without an `app_id`.

The query will fetch profiles that either:
- Have `app_id = 'mckaynine-training'`, OR
- Have at least one entry in `user_roles`

This way Katherine shows up because she has a `handler` role in `user_roles`.

### Step 2: Update the role badge display for multi-role users
**File: `src/components/users/UserAdmin.tsx`**

Currently the role column shows a single badge. For multi-role users (like Katherine will be after adding trainer), update the display to show multiple badges when the role string contains commas (e.g., "handler,assistant,trainer").

### Step 3: Update "Change Role" to use the multi-role Manage Roles dialog
**File: `src/components/users/UserAdmin.tsx`**

Replace the old single-role "Change Role" dialog with the `UserManageDialog` component that was already built to support adding/removing individual roles via badges.

### Step 4: Set Katherine's app_id
As part of the fix, set Katherine's `app_id` so she's properly associated with the app going forward. The `manage-user-role` edge function already does this when adding roles.

## Technical Details

**`useUsers.ts` query change:**
- Current: `supabase.from('profiles').select('*').eq('app_id', APP_ID)`
- New: Use an `.or()` filter to include profiles with the correct `app_id` OR profiles that exist in `user_roles`
- Alternatively, join with `user_roles` to get profiles that have any role assigned

**`UserAdmin.tsx` role display:**
- Split `user.role` by comma and render a badge for each role
- Use the existing color scheme but add colors for `handler` and `assistant` roles

**`UserAdmin.tsx` dialog swap:**
- Import and use `UserManageDialog` instead of the inline single-role dialog
- This gives Katherine the ability to have trainer added alongside handler
