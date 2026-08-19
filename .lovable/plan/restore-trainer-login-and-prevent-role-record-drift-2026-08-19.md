# Restore trainer login and prevent role/record drift

## Confirmed diagnosis

Michelle Beukes successfully authenticates, but her account is inconsistent across the database:

- `profiles.role` is `trainer`.
- Her account is linked to a valid `trainers` record.
- The authoritative `user_roles` table has no role for her.

Authentication correctly reads `user_roles`, so her resolved role is `null`. The root route sends an authenticated account with no role to `/dashboard`; the admin-protected dashboard then sends it back to `/dashboard`, producing the blank/stuck navigation loop. Other pure trainer accounts checked have the expected `trainer` role.

A second confirmed weakness is that the trainer-account linking control updates only `trainers.user_id`; it does not ensure the linked account receives a `trainer` row in `user_roles`, allowing these records to drift apart.

## Implementation

1. **Repair the affected account**
   - Add Michelle's missing `trainer` role to `user_roles` without changing her existing trainer profile or credentials.
   - Keep `profiles.role` synchronized for backward-compatible screens.

2. **Make trainer linking role-safe**
   - Route trainer-account linking through the existing privileged role-management function instead of relying on a direct `trainers.user_id` update alone.
   - When linking, add the `trainer` role while preserving any other roles on the account.
   - Only show eligible user accounts from the authoritative role data, while retaining the currently linked account in the selector.
   - Report a clear error and leave the UI unconfirmed if either role assignment or linking fails.

3. **Remove the redirect loop safety hazard**
   - Give authenticated accounts with no recognized role a visible access/configuration screen with a working sign-out action rather than redirecting them to an admin route they cannot access.
   - Make protected-route fallback use the same role-priority destination logic, so an invalid role can never redirect to the route currently denying it.

4. **Verify the complete flow**
   - Confirm Michelle resolves as a trainer and reaches `/trainer/dashboard` after login/session restoration.
   - Confirm her trainer profile loads and trainer navigation, including logout, is visible.
   - Check admin, platform-admin, assistant, handler, and multi-role redirects for regressions.
   - Re-query linked trainer accounts to confirm no pure trainer remains without an authoritative role.

## Technical notes

- `user_roles` remains the sole authorization source; the fix will not weaken access by trusting `profiles.role` on the client.
- Existing admin/platform-admin users linked to trainer records remain valid because those roles already grant trainer-route access; no unnecessary trainer role will be backfilled for them.
- The account repair will be idempotent through the existing unique `(user_id, role)` constraint/upsert pattern.
