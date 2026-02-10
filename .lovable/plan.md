
# Supporting Multi-Role Users (Assistant + Trainer)

## The Situation
Katherine Sinclaire is an assistant who occasionally stands in as a trainer for puppy and yoga classes. The system needs to support users who hold both the `assistant` and `trainer` roles simultaneously.

## What Already Works
- The `user_roles` table already supports multiple roles per user (each role is a separate row)
- The auth system already joins multiple roles into a comma-separated string (e.g., `"assistant,trainer"`)
- The role-check flags (`isTrainer`, `isAssistant`) in `useAuthState` already use `.includes()`, so they correctly detect roles even in combined strings

## What Needs Fixing

### 1. Login Redirect Logic (Critical)
The redirect in `publicRoutes.tsx` uses exact equality checks like `role === 'assistant'`. If Katherine has both roles, her combined role string would be `"assistant,trainer"`, which wouldn't match any of the exact checks, causing unexpected behavior.

**Fix**: Update the redirect logic to use `.includes()` checks with a priority order:
- If roles include `admin` or `platform_admin` --> admin dashboard
- If roles include `trainer` (but not admin) --> trainer dashboard
- If roles include `assistant` (but not trainer/admin) --> assistant schedule
- If roles include `handler` --> customer dashboard

For someone like Katherine with both `assistant` and `trainer`, she'd get the **trainer dashboard** (since that's the higher-privilege view she needs to manage classes).

### 2. Create Trainer Record for Katherine
When adding the `trainer` role to an assistant, the system needs a corresponding record in the `trainers` table (since `class_schedules.trainer_id` references this table). The existing `manage-user-role` edge function should handle this, but we need to verify it creates the trainer record properly for multi-role users.

### 3. Admin UI for Adding a Second Role
Currently the user management interface likely replaces the role rather than adding a second one. We need to ensure the admin can **add** the trainer role to Katherine without removing her assistant role.

## Implementation Steps

### Step 1: Fix redirect routing for multi-role users
**File: `src/routes/publicRoutes.tsx`**
- Replace exact `role === 'x'` checks with `role.includes('x')` checks
- Use priority ordering so the most privileged matching role wins

### Step 2: Update the manage-user-role edge function
**File: `supabase/functions/manage-user-role/index.ts`**
- Add an `addRole` operation that inserts into `user_roles` without removing existing roles
- When adding `trainer`, also create the `trainers` table record
- Keep the existing `setRole` operation for cases where you want to replace all roles

### Step 3: Add "Add Role" option in user management UI
**File: `src/components/users/` (relevant user management components)**
- Add an option to assign an additional role to a user (alongside their existing role)
- Show current roles as tags/badges
- Allow removing individual roles

### Step 4: Immediate action for Katherine
- Add `trainer` role to Katherine's `user_roles` record
- Create a `trainers` table entry for her so she can be assigned to class schedules

## Technical Details

| Area | Current | After Fix |
|------|---------|-----------|
| Role storage | One row per role in `user_roles` (already supports multi) | No change needed |
| Role string | Comma-joined (e.g., `"assistant"`) | Works as-is (e.g., `"assistant,trainer"`) |
| Auth flags | `.includes()` checks (correct) | No change needed |
| Login redirect | `role === 'assistant'` (breaks for multi-role) | `role.includes('assistant')` with priority |
| Admin UI | Role dropdown replaces role | Add "Add Role" alongside replace |
| Trainer record | Only created on initial role set | Also created when adding trainer as second role |
