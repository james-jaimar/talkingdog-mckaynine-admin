
import { useState } from "react";
import type { UserProfile } from "../types/userTypes";
import { useFetchUsers } from "./useFetchUsers";
import { useFetchTrainers } from "./useFetchTrainers";
import { useTrainerLinking } from "./useTrainerLinking";
import { useUserRoleManagement } from "./useUserRoleManagement";
import { useAdminSetup } from "./useAdminSetup";

// Re-export the type for external use
export type { UserProfile };

export function useUsersData() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Fetch users data - this now includes proper error handling
  const { 
    data: users = [], 
    isLoading, 
    error, 
    refetch 
  } = useFetchUsers();
  
  // Fetch trainers data
  const { 
    data: trainers = [], 
    isLoading: isLoadingTrainers 
  } = useFetchTrainers();
  
  // Get trainer linking functionality
  const { 
    linkTrainerToUser, 
    unlinkTrainerFromUser 
  } = useTrainerLinking();
  
  // Get user role management functionality
  const { 
    updateUserRole, 
    isUpdating 
  } = useUserRoleManagement();
  
  // Get admin setup functionality
  const { 
    adminSetupAttempted,
    setUserAsAdmin 
  } = useAdminSetup();

  return {
    users,
    isLoading,
    error,
    selectedUserId,
    setSelectedUserId,
    updateUserRole,
    isUpdating,
    setUserAsAdmin,
    trainers,
    isLoadingTrainers,
    linkTrainerToUser,
    unlinkTrainerFromUser,
    refetchUsers: refetch,
    adminSetupAttempted
  };
}
