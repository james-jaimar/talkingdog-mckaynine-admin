
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile, ensureAdminRole } from './utils';

/**
 * Hook to handle auth initialization and subscription
 */
export const useAuthSetup = (authState: any) => {
  const {
    setSession,
    setUser,
    setRole,
    setIsLoading,
    user
  } = authState;

  // Auth state initialization and subscription
  useEffect(() => {
    console.log("AuthProvider initializing");
    setIsLoading(true);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        // Handle synchronous updates first to avoid deadlocks
        setSession(session);
        setUser(session?.user ?? null);
        
        // If session exists, fetch profile in separate async operation
        if (session?.user) {
          try {
            // Use setTimeout to avoid Supabase deadlock
            setTimeout(async () => {
              try {
                const profileData = await fetchUserProfile(session.user.id);
                
                console.log("Fetched user profile data:", profileData);
                
                // IMPORTANT: Handle special admin case but preserve handler role
                const finalRole = await ensureAdminRole(
                  session.user.id, 
                  session.user.email,
                  profileData?.role
                );
                
                console.log("User role set to:", finalRole);
                setRole(finalRole);
                setIsLoading(false);
              } catch (error) {
                console.error("Error in deferred profile fetch:", error);
                setRole(null);
                setIsLoading(false);
              }
            }, 0);
          } catch (error) {
            console.error("Error fetching user profile:", error);
            setRole(null);
            setIsLoading(false);
          }
        } else {
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch user role if session exists
      if (session?.user) {
        fetchUserProfile(session.user.id)
          .then(profileData => {
            console.log("Fetched user profile data:", profileData);
            return ensureAdminRole(session.user.id, session.user.email, profileData?.role);
          })
          .then(finalRole => {
            console.log("Initial role check:", finalRole);
            setRole(finalRole);
            setIsLoading(false);
          })
          .catch(error => {
            console.error("Error in initial profile fetch:", error);
            setRole(null);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    }).catch(error => {
      console.error("Error checking initial session:", error);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [setIsLoading, setSession, setUser, setRole]);
};
