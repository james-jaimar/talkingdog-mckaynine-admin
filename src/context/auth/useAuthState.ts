
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

  // Derived states - simple role checks
  const isAdmin = useMemo(() => {
    if (!role) return false;
    return role.split(',').includes('admin') || role.split(',').includes('platform_admin');
  }, [role]);

  const isPlatformAdmin = useMemo(() => {
    if (!role) return false;
    return role.split(',').includes('platform_admin');
  }, [role]);

  const isTrainer = useMemo(() => {
    if (!role) return false;
    return role.split(',').includes('trainer') || role.split(',').includes('admin') || role.split(',').includes('platform_admin');
  }, [role]);

  const isHandler = useMemo(() => {
    if (!role) return false;
    return role.split(',').includes('handler');
  }, [role]);

  const isBranchOwner = useMemo(() => {
    if (!role) return false;
    return isAdmin || isPlatformAdmin; // For now, admins and platform admins are considered branch owners
  }, [isAdmin, isPlatformAdmin]);

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
    isPlatformAdmin,
    isTrainer,
    isHandler,
    isBranchOwner
  };
};
