
import { useState, useEffect } from "react";
import type { UserProfile } from "../types/userTypes";
import { useFetchUsers } from "./useFetchUsers";
import { useFetchTrainers } from "./useFetchTrainers";
import { useTrainerLinking } from "./useTrainerLinking";
import { useUserRoleManagement } from "./useUserRoleManagement";
import { useAdminSetup } from "./useAdminSetup";
import { useQueryClient } from "@tanstack/react-query";

// Re-export the type for external use
export type { UserProfile };

export function useUsersData() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch users data with proper error handling
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

  // Initial fetch on mount and set up a periodic refresh
  useEffect(() => {
    console.log("useUsersData hook mounted, fetching initial users data");
    // Do an immediate fetch
    refetchUsers();
    
    // Set up a periodic refresh
    const intervalId = setInterval(() => {
      console.log("Periodic refresh in useUsersData triggered");
      refetchUsers();
    }, 5000);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Ensure refetch is wrapped with error handling and proper logging
  const refetchUsers = async () => {
    try {
      console.log("Manually refetching ALL users data...");
      // Invalidate the cache first to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      await refetch();
      console.log("Users data refetched successfully, found", users.length, "users");
    } catch (error) {
      console.error("Error refetching users data:", error);
    }
  };

  // Debug the users array
  console.log(`useUsersData hook - current users count: ${users.length}`);
  if (users.length > 0) {
    console.log("Current users in useUsersData:", users.map(u => ({
      id: u.id.substring(0, 8), 
      email: u.username,
      role: u.role,
      isCurrentUser: u.isCurrentUser
    })));
  }

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
    refetchUsers,
    adminSetupAttempted
  };
}
