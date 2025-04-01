
import React, { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AuthContext } from "./AuthContext";
import { fetchUserProfile, ensureAdminRole } from "./utils";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Fetch user profile when signed in
          fetchUserProfile(newSession?.user?.id).then(profileData => {
            if (profileData) {
              setUserRole(profileData.role || null);
              
              // Handle special admin user case
              ensureAdminRole(
                newSession!.user.id, 
                newSession!.user.email, 
                profileData.role
              ).then(adminRole => {
                if (adminRole === 'admin' && profileData.role !== 'admin') {
                  setUserRole('admin');
                }
              });
            }
          });
        } else if (event === 'SIGNED_OUT') {
          setUserRole(null);
          setUser(null);
          setSession(null);
          
          // Force navigation to auth page on sign out
          window.location.href = '/auth';
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id).then(profileData => {
          if (profileData) {
            setUserRole(profileData.role || null);
            
            // Handle special admin user case
            ensureAdminRole(
              currentSession.user.id, 
              currentSession.user.email, 
              profileData.role
            ).then(adminRole => {
              if (adminRole === 'admin' && profileData.role !== 'admin') {
                setUserRole('admin');
              }
            });
          }
        });
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully. You can now sign in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Clear state before calling signOut to prevent timing issues
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }
      
      // Force navigation to auth page
      window.location.href = '/auth';
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "An error occurred during sign out.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Compute role-based flags
  const isAdmin = userRole === 'admin';
  const isTrainer = userRole === 'trainer';
  const isHandler = userRole === 'handler';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signIn,
        signUp,
        signOut,
        isLoading,
        isAdmin,
        isTrainer,
        isHandler,
        userRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
