

# Fix: Admins Can't See Other Users' Roles (RLS Policy Issue)

## Root Cause

The `user_roles` table has two RLS policies:
1. **"Users can read their own roles"** -- SELECT where `auth.uid() = user_id`
2. **"Platform admins can manage all roles"** -- ALL where `has_role(auth.uid(), 'platform_admin')`

You're logged in as `ady@talkingdog.co.za` who has the `admin` role, **not** `platform_admin`. So the RLS only returns ady's own roles. When the app queries all user roles (for the user list) or Katherine's roles (for the dialog), the database returns nothing for other users -- that's why roles appear empty or show only what was just added (via the edge function which uses a service key).

## Fix

### 1. Add an RLS policy so admins can read all roles

Add a new SELECT policy on `user_roles`:

```sql
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

This allows any user with the `admin` role to read all rows in `user_roles`, which is necessary for the User Management page to display everyone's roles correctly.

### 2. No code changes needed

The existing code in `useUsers.ts` and `UserManageDialog.tsx` already fetches roles correctly from the `user_roles` table. The only problem was that the database was blocking the reads due to insufficient RLS permissions.

## What This Fixes
- The **user list** will show all roles for every user (e.g., Katherine will show "handler, trainer, assistant")
- The **Manage Roles dialog** will show all current roles when opened
- Adding/removing roles will immediately reflect in both the dialog and the list

## Technical Details

**Migration SQL:**
```sql
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
```

**Files to modify:** None -- only a database migration is needed.

