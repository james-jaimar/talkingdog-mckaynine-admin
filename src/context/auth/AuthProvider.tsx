
import React, { PropsWithChildren } from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextType } from './types';
import { useAuthState } from './useAuthState';
import { useAuthSetup } from './useAuthSetup';
import { useTrainerProfile } from './useTrainerProfile';
import { loginWithEmailAndPassword, signupWithEmailAndPassword, logout } from './authOperations';

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Get all auth state from custom hook
  const authState = useAuthState();
  
  const {
    session,
    user,
    role,
    isLoading,
    trainerProfile,
    isAdmin,
    isTrainer,
    isHandler,
    setUser,
    setSession,
    setRole,
    setTrainerProfile
  } = authState;

  // Initialize auth and subscribe to changes
  useAuthSetup(authState);
  
  // Fetch trainer profile when needed
  useTrainerProfile(user, isTrainer, setTrainerProfile);

  // Create the auth context value
  const value: AuthContextType = {
    session,
    user,
    role,
    isAdmin,
    isTrainer,
    isHandler,
    isLoading,
    trainerProfile,
    
    // Authentication methods
    login: loginWithEmailAndPassword,
    signup: signupWithEmailAndPassword,
    logout: async () => {
      try {
        // Clear local state first to prevent UI issues
        setUser(null);
        setSession(null);
        setRole(null);
        
        return await logout();
      } catch (error) {
        console.error("Logout error in provider:", error);
        
        // Even if there's an error, we should still clear local state
        setUser(null);
        setSession(null);
        setRole(null);
        
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
