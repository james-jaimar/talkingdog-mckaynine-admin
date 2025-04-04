
import React, { PropsWithChildren, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useAuthState } from './useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { loginWithEmailAndPassword, signupWithEmailAndPassword, logout } from './authOperations';
import { useAuthSetup } from './useAuthSetup';

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Get auth state from custom hook
  const authState = useAuthState();
  
  // Use the auth setup hook to initialize auth state
  useAuthSetup(authState);

  // Destructure values from auth state
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
    trainerProfile,
    setTrainerProfile
  } = authState;

  // Fetch trainer profile if user is a trainer
  useEffect(() => {
    if (user && isTrainer && !trainerProfile) {
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
        })
        .catch(error => {
          // This addresses the TypeScript error by properly handling promise rejection
          console.error("Exception in trainer profile fetch:", error);
          setTrainerProfile(null);
        });
    }
  }, [user, isTrainer, trainerProfile, setTrainerProfile]);

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
          try {
            return await logout();
          } catch (error) {
            console.error("Error during logout:", error);
            return { success: false, error: "Failed to logout" };
          }
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
