

# Fix: Manage Roles Dialog Should Show All Roles and Stay Open

## Problem
Two issues with the Manage Roles dialog:

1. **Dialog closes after each role add/remove** -- After adding a role, the dialog closes (line 83: `onOpenChange(false)`). When you reopen it, the data may not have refetched yet, so you only see the old role.
2. **Roles come from a stale prop** -- The dialog reads `user.role` (a comma-separated string passed from the parent), but this only updates after the query refetches. It should fetch roles directly from `user_roles` table.

Katherine actually has all 3 roles in the database (handler, trainer, assistant) -- the UI just isn't showing them.

## Fix

### 1. Fetch roles directly from `user_roles` table in the dialog
**File: `src/components/users/UserManageDialog.tsx`**

Instead of parsing `user.role` string, the dialog will query `user_roles` for the user's actual roles when it opens. This ensures it always shows the current state.

- Add a small `useQuery` to fetch roles from `user_roles` where `user_id = user.id`
- Use the fetched roles as the source of truth for "Current Roles"
- Invalidate/refetch this query after add or remove operations

### 2. Keep dialog open after adding/removing a role
**File: `src/components/users/UserManageDialog.tsx`**

Remove `onOpenChange(false)` from `handleAddRole` and `handleRemoveRole`. Instead, just refetch the roles query so the badges update in-place. The user can close the dialog manually when done.

## Technical Details

**New query in `UserManageDialog.tsx`:**
```typescript
const { data: currentRoles = [], refetch: refetchRoles } = useQuery({
  queryKey: ['user-roles', user.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    return (data || []).map(r => r.role);
  },
  enabled: open,
});
```

**After add/remove:** call `refetchRoles()` and `onUserUpdated()` but do NOT close the dialog.

**Files to modify:** `src/components/users/UserManageDialog.tsx`
