
import React, { PropsWithChildren, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useAuthState } from './useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { loginWithEmailAndPassword, signupWithEmailAndPassword, logout } from './authOperations';

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Get auth state from custom hook
  const {
    user,
    session,
    role,
    isAdmin,
    isTrainer,
    isHandler,
    isLoading,
    setUser,
    setSession,
    setRole,
    setIsLoading,
    trainerProfile,
    setTrainerProfile
  } = useAuthState();

  // Handle auth state changes
  useEffect(() => {
    setIsLoading(true);
    console.log("Setting up auth listener");

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        // Update session and user state immediately
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role if we have a session
        if (session?.user) {
          try {
            // Wait a tick to prevent Supabase deadlock
            setTimeout(async () => {
              try {
                // Fetch profile for role
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('id', session.user.id)
                  .single();
                
                // Special admin check for specific email
                let finalRole = profile?.role || null;
                if (session.user.email === "ady@talkingdog.co.za" && finalRole !== "admin") {
                  await supabase.from('profiles').update({ role: 'admin' }).eq('id', session.user.id);
                  finalRole = "admin";
                }
                
                console.log("Setting user role:", finalRole);
                setRole(finalRole);
                setIsLoading(false);
              } catch (error) {
                console.error("Error in auth state profile fetch:", error);
                setRole(null);
                setIsLoading(false);
              }
            }, 0);
          } catch (error) {
            console.error("Error in auth state change:", error);
            setRole(null);
            setIsLoading(false);
          }
        } else {
          // No session = no role and not loading
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            // Check for special admin case
            let userRole = profile?.role || null;
            if (session.user.email === "ady@talkingdog.co.za" && userRole !== "admin") {
              supabase.from('profiles').update({ role: 'admin' }).eq('id', session.user.id)
                .then(() => {
                  setRole("admin");
                  setIsLoading(false);
                });
            } else {
              setRole(userRole);
              setIsLoading(false);
            }
          })
          .catch(error => {
            console.error("Error in initial profile fetch:", error);
            setRole(null);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    // Fetch trainer profile if user is a trainer
    if (user && isTrainer) {
      supabase
        .from('trainers')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching trainer profile:", error);
            setTrainerProfile(null);
          } else {
            setTrainerProfile(data);
          }
        });
    }

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [setIsLoading, setSession, setUser, setRole, user, isTrainer, setTrainerProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin,
        isTrainer,
        isHandler,
        isLoading,
        trainerProfile,
        login: loginWithEmailAndPassword,
        signup: signupWithEmailAndPassword,
        logout: async () => {
          // Clear state first for immediate UI update
          setUser(null);
          setSession(null);
          setRole(null);
          return logout();
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
