

# Fix: Show All Roles and Use Multi-Role Management

## Problem
The User Management UI has two issues:
1. **Roles not loading from the correct source** - The `useUsers` hook reads the old `profile.role` column instead of fetching roles from the `user_roles` table. Katherine has both `handler` and `trainer` in `user_roles`, but the UI only shows whatever is in `profiles.role`.
2. **Edit User dialog overwrites roles** - The "Edit User" dialog has a single-role dropdown that replaces all roles with one selection, instead of using the multi-role system.

## Fix

### 1. Update `useUsers.ts` to fetch roles from `user_roles` table
- After fetching profiles, also fetch all roles from `user_roles` for those user IDs
- Group roles by `user_id` and join them as comma-separated strings
- Use these combined roles instead of `profile.role`

### 2. Remove the role dropdown from the "Edit User" dialog
- The Edit User dialog should only handle name changes (and email display)
- Role management should only happen through the "Manage Roles" dialog, which already supports adding/removing individual roles

## Technical Details

**`src/hooks/useUsers.ts`** changes:
- Already fetches `user_roles` for filtering -- extend this to fetch `role` column too (not just `user_id`)
- Build a `Map<user_id, string>` of comma-joined roles
- Replace line 67 `role: profile.role || 'user'` with the roles from the map

**`src/components/users/UserAdmin.tsx`** changes:
- Remove the Role `<Select>` from the Edit User dialog (lines 616-629)
- Remove `editRole` state and its usage in `handleSaveEditUser`
- The "Manage Roles" menu item already opens `UserManageDialog` which handles multi-role correctly

