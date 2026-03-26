
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
