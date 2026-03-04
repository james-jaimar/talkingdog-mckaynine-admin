
import React, { PropsWithChildren } from 'react';
import { AuthContext } from './AuthContext';
import { useAuthState } from './useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { loginWithEmailAndPassword, signupWithEmailAndPassword, logout } from './authOperations';
import { useAuthSetup } from './useAuthSetup';
import { useTrainerProfile } from './useTrainerProfile';

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
    isPlatformAdmin,
    isTrainer,
    isHandler,
    isBranchOwner,
    isAssistant,
    isLoading,
    setUser,
    setSession,
    setRole,
    trainerProfile,
    setTrainerProfile
  } = authState;

  // Use the trainer profile hook instead of inline effect
  useTrainerProfile(user, isTrainer, setTrainerProfile);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin,
        isPlatformAdmin,
        isTrainer,
        isHandler,
        isBranchOwner,
        isAssistant,
        isLoading,
        trainerProfile,
        login: loginWithEmailAndPassword,
        signup: signupWithEmailAndPassword,
        logout: async () => {
          setUser(null);
          setSession(null);
          setRole(null);
          setTrainerProfile(null);
          
          try {
            const result = await logout();
            window.location.href = '/auth';
            return result;
          } catch (error) {
            console.error("Error during logout:", error);
            window.location.href = '/auth';
            return { success: false, error: "Failed to logout" };
          }
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
