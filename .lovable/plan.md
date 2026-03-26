

# Fix: Login Hanging — AbortError Kills Auth Initialization

## Root Cause

The Supabase client is a **singleton**. In React StrictMode (development) or during hot-reload, the effect runs twice:

1. Mount 1: subscribes + calls `getSession()` — cancelled1=false
2. Cleanup 1: sets cancelled1=true, calls `subscription.unsubscribe()`
3. Mount 2: subscribes + calls `getSession()` — cancelled2=false
4. **Mount 2's `getSession()` rejects with AbortError** because the Supabase singleton's internal AbortController was disrupted by the unsubscribe in step 2

The catch handler on line 107-110 fires with `cancelled2 = false` (it's the second mount, not cancelled), so it logs the error and sets `isLoading(false)` with no session. The Auth page renders, the user enters credentials, `signInWithPassword` fires, the `onAuthStateChange` callback fires with a session — but then the `setTimeout(..., 0)` deferred profile fetch never resolves visibly because the UI already moved past the loading state, and the redirect logic gets confused.

**On the published URL** (no StrictMode double-mount), this manifests differently: if the Supabase backend is slow or the connection times out (the Supabase metadata fetch above timed out — "Connection terminated due to connection timeout"), `getSession()` can also throw an AbortError, and the same catch handler kills the auth flow.

## The Fix

Rewrite `useAuthSetup.ts` to follow the proven pattern from the Supabase docs:

1. **Call `getSession()` first** to restore the session, set state, and mark `isReady`
2. **Then** set up `onAuthStateChange` for subsequent events (login, logout, token refresh)
3. **Ignore AbortError** — never treat it as a terminal state. If getSession fails with AbortError, leave `isLoading = true` and let `onAuthStateChange` handle it
4. **Remove the `setTimeout` hack** — the deadlock concern it addressed is solved by not awaiting inside onAuthStateChange

### File: `src/context/auth/useAuthSetup.ts`

Replace the entire file with:

```typescript
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile, ensureAdminRole } from './utils';

const resolveRole = async (userId: string, email: string | undefined) => {
  const profileData = await fetchUserProfile(userId);
  return ensureAdminRole(userId, email, profileData?.role);
};

export const useAuthSetup = (authState: any) => {
  const { setSession, setUser, setRole, setIsLoading } = authState;

  useEffect(() => {
    console.log("AuthProvider initializing");
    let cancelled = false;

    // 1. Restore session from storage FIRST
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      console.log("Initial session check:", !!session);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const finalRole = await resolveRole(session.user.id, session.user.email);
          if (cancelled) return;
          console.log("Initial role resolved:", finalRole);
          setRole(finalRole);
        } catch (error) {
          if (cancelled) return;
          console.error("Error resolving initial role:", error);
          setRole(null);
        }
      }
      if (!cancelled) setIsLoading(false);
    }).catch(error => {
      if (cancelled) return;
      // AbortError = StrictMode or network blip — do NOT mark loading done.
      // onAuthStateChange will handle it.
      if (error?.name === 'AbortError') {
        console.warn("getSession aborted (StrictMode or network), waiting for onAuthStateChange");
        return;
      }
      console.error("Error checking initial session:", error);
      setIsLoading(false);
    });

    // 2. Listen for subsequent auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        console.log("Auth state changed:", event);

        // Synchronous state updates only — no awaits inside this callback
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fire-and-forget role resolution
          resolveRole(session.user.id, session.user.email)
            .then(finalRole => {
              if (cancelled) return;
              console.log("User role set to:", finalRole);
              setRole(finalRole);
              setIsLoading(false);
            })
            .catch(error => {
              if (cancelled) return;
              console.error("Error resolving role:", error);
              setRole(null);
              setIsLoading(false);
            });
        } else {
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setIsLoading, setSession, setUser, setRole]);
};
```

### Key differences from current code:

1. **AbortError is ignored** — if `getSession()` is aborted, we leave `isLoading = true` and let `onAuthStateChange` handle it when it fires
2. **No `setTimeout` hack** — role resolution uses fire-and-forget `.then()` chains instead of `setTimeout(async () => {}, 0)`
3. **No duplicate logic** — the `resolveRole` helper is shared between initial check and state change handler
4. **Single responsibility** — `getSession()` handles initial load, `onAuthStateChange` handles subsequent events

## Why This Fixes the Hang

Currently when a user types credentials and clicks Sign In:
- `signInWithPassword` succeeds
- `onAuthStateChange` fires with the session
- The `setTimeout` deferred fetch runs but `isLoading` was already set to `false` by the AbortError handler
- The redirect logic in `Auth.tsx` and `HandlerRedirect` sees `user` but `role` is still `null`, causing confusion

With the fix: `isLoading` stays `true` until role resolution completes, so the redirect only fires once everything is ready.

