
import { useState, useEffect } from "react";
import { UserProfile } from "../types/userTypes";
import { useFetchUsers } from "./useFetchUsers";
import { useFetchTrainers } from "./useFetchTrainers";
import { useTrainerLinking } from "./useTrainerLinking";
import { useUserRoleManagement } from "./useUserRoleManagement";
import { useAdminSetup } from "./useAdminSetup";

export { UserProfile } from "../types/userTypes";

export function useUsersData() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Fetch users data
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

  // Listen for user creation events and refetch
  useEffect(() => {
    const handleUserCreated = () => {
      console.log("User created event detected, refetching users...");
      refetch();
    };

    window.addEventListener('user-created', handleUserCreated);
    
    return () => {
      window.removeEventListener('user-created', handleUserCreated);
    };
  }, [refetch]);

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
