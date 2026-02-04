

# Simplified Fix: Link Existing Accounts Instead of Creating New Ones

## The Problem

When you click "Create Login" for Amy:
- Amy already has an auth account (as a handler with email `ahumphrer@gmail.com`)
- The edge function tries to create a **new** auth user with that email
- Supabase rejects it because the email already exists
- Result: 500 error

## The Simple Solution

Instead of always trying to create a new user, check if one already exists and link it:

```text
User clicks "Create Login"
        ↓
Check if email exists in auth.users
        ↓
    ┌───┴───┐
   YES      NO
    ↓        ↓
  Link     Create new
existing   auth user
 account      ↓
    ↓      Link to
Add        assistant
assistant     ↓
  role    Add assistant
    ↓        role
 Reset       ↓
password   Done
    ↓
  Done
```

---

## Technical Changes

### 1. Update Edge Function (`supabase/functions/assistant-account/index.ts`)

Modify `handleCreateAccount` to:

1. **First check if email exists** using `auth.admin.getUserByEmail(email)`
2. **If user exists:**
   - Verify they're not an admin/trainer (security check)
   - Link their existing `user_id` to the assistant record
   - Add `assistant` role to `user_roles`
   - Reset their password to the provided one
   - Return success
3. **If user doesn't exist:**
   - Create new auth user (current behavior)
   - Link and add role as before

### 2. Update UI Labels

Since the action now handles both "create" and "link" scenarios:
- Keep the button label as "Create Account" (it still creates access for the assistant)
- The dialog description can explain: "This will set up portal access for the assistant"

---

## Security Considerations

Before linking an existing account, verify:
- The email belongs to a handler or has no conflicting roles
- Never link to admin/trainer/platform_admin accounts
- Log all linking operations for audit

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/assistant-account/index.ts` | Add email existence check, link existing users, set password |

---

## Result After Fix

- Clicking "Create Login" for Amy will:
  1. Find her existing auth account
  2. Link it to her assistant record  
  3. Set the password you specified
  4. Add the `assistant` role
  5. Show success message

- No more 500 errors for existing emails
- Amy can now log in via `/auth` and be redirected to the assistant portal

