

## Fix: Mobile Logout Not Working

### Root Cause

The logout function in `AuthProvider.tsx` redirects (`window.location.href = '/auth'`) **before** the actual `supabase.auth.signOut()` completes. The redirect triggers a full page reload, which re-initializes auth via `getSession()` — but since `signOut()` hasn't finished yet, the session token is still in storage, so the user gets logged right back in.

On desktop this race condition may resolve due to timing differences, but on mobile (slower network/CPU) the redirect consistently wins.

### Fix

In `AuthProvider.tsx`, reverse the order: call `signOut()` first, **then** redirect. Also simplify the `authOperations.ts` logout to avoid the localStorage iteration bug (removing items while iterating shifts indices and skips items).

### Changes

**`src/context/auth/AuthProvider.tsx`** (logout handler, ~lines 55-74):
```typescript
logout: async () => {
  setUser(null);
  setSession(null);
  setRole(null);
  setTrainerProfile(null);
  
  try {
    // Sign out FIRST, then redirect
    const result = await logout();
    window.location.href = '/auth';
    return result;
  } catch (error) {
    console.error("Error during logout:", error);
    // Redirect even on error
    window.location.href = '/auth';
    return { success: false, error: "Failed to logout" };
  }
}
```

**`src/context/auth/authOperations.ts`** (logout function, ~lines 59-98):
- Fix the localStorage cleanup to collect keys first, then remove (avoids skipping items during iteration)
- Use `scope: 'local'` instead of `'global'` to avoid unnecessary server-side revocation failures on poor connections
- Remove the post-signout `getSession()` check and artificial delay (unnecessary)

### Files to modify
- `src/context/auth/AuthProvider.tsx`
- `src/context/auth/authOperations.ts`

