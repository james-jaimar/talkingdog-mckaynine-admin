
import React, { createContext, useState, useEffect, PropsWithChildren } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { AuthContextType } from './types';
import { AuthContext } from './AuthContext';
import { fetchUserProfile, ensureAdminRole } from './utils';

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Session and user state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trainerProfile, setTrainerProfile] = useState(null);

  // Derived states
  const isAdmin = role === 'admin';
  const isTrainer = role === 'trainer';
  const isHandler = role === 'handler';

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
                
                // Handle special admin case and set role
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
          .then(profileData => 
            ensureAdminRole(session.user.id, session.user.email, profileData?.role)
          )
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
  }, []);

  // Fetch trainer profile if user is a trainer
  useEffect(() => {
    const fetchTrainerProfile = async () => {
      if (user && isTrainer) {
        try {
          const { data, error } = await supabase
            .from('trainers')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error("Error fetching trainer profile:", error);
            setTrainerProfile(null);
          } else {
            setTrainerProfile(data);
          }
        } catch (error) {
          console.error("Error in fetchTrainerProfile:", error);
          setTrainerProfile(null);
        }
      } else {
        setTrainerProfile(null);
      }
    };

    fetchTrainerProfile();
  }, [user, isTrainer]);

  // Auth context value
  const value: AuthContextType = {
    session,
    user,
    role,
    isAdmin,
    isTrainer,
    isHandler,
    isLoading,
    trainerProfile,
    
    // Login, signup and logout functions
    login: async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        return { success: true, error: null };
      } catch (error) {
        console.error("Login error:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
      }
    },
    
    signup: async (email, password, metadata) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata
          }
        });
        
        if (error) throw error;
        return { success: true, error: null };
      } catch (error) {
        console.error("Signup error:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
      }
    },
    
    logout: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true, error: null };
      } catch (error) {
        console.error("Logout error:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
