
import { useState } from 'react';
import { Session, User } from '@supabase/supabase-js';

/**
 * Custom hook for managing auth state
 * Extracts state management from the AuthProvider
 */
export const useAuthState = () => {
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

  return {
    session,
    setSession,
    user,
    setUser,
    role,
    setRole,
    isLoading,
    setIsLoading,
    trainerProfile,
    setTrainerProfile,
    // Derived states
    isAdmin,
    isTrainer,
    isHandler
  };
};
