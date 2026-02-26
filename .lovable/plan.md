

# Fix: Enrollment Form Setting Wrong auth_user_id

## Problem

When an admin submits the enrollment/puppy form on behalf of a handler, the code sets `auth_user_id` to the admin's own auth ID. Since the admin's ID is already linked to another client record, the unique constraint `clients_auth_user_id_key` is violated.

**File**: `src/components/enrollment/hooks/useEnrollmentSubmission.ts`
- Line 73: `auth_user_id: authUserId || undefined` (update path)
- Line 97: `auth_user_id: authUserId || undefined` (insert path)

## Fix

Only set `auth_user_id` when the logged-in user is a handler filling out their own form. When an admin is submitting on behalf of someone else, skip setting `auth_user_id` entirely.

### Changes to `useEnrollmentSubmission.ts`

1. In `findOrCreateClient`, check the user's role before setting `auth_user_id`.
2. Use a simple check: query `user_roles` for the current user to see if they have the `handler` role. If not (i.e., they're an admin), don't set `auth_user_id`.
3. Also skip the `completeOnboarding` call when the submitter is an admin (since it's not their onboarding).

### Technical Detail

```text
findOrCreateClient():
  - Fetch current user's roles from user_roles table
  - isHandler = roles include 'handler'
  - Only include auth_user_id in insert/update when isHandler is true
  - For the update path (existing client): skip auth_user_id entirely if admin
  - For the insert path (new client): skip auth_user_id entirely if admin

completeOnboarding():
  - Already handles missing user gracefully
  - No change needed (it will just update nothing if admin has no onboarding record)
```

This is a one-file fix. No database changes required.

