
import { useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';

/**
 * Custom hook for managing auth state
 */
export const useAuthState = () => {
  // Core auth state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trainerProfile, setTrainerProfile] = useState(null);

  // Derived states - ensure handler role is properly identified
  const isAdmin = useMemo(() => role === 'admin', [role]);
  const isTrainer = useMemo(() => role === 'trainer' || role === 'admin', [role]);
  
  // CRITICAL: Explicitly check for handler role
  const isHandler = useMemo(() => role === 'handler', [role]);

  return {
    // Core state
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
