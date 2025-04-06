
import { useState, useCallback } from "react";
import type { UserProfile } from "../types/userTypes";
import { useFetchUsers } from "./useFetchUsers";
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

  // Ensure refetch is wrapped with error handling and proper logging
  const refetchUsers = useCallback(async () => {
    try {
      console.log("Manually refetching ALL users data...");
      // Invalidate the cache first to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      await refetch();
      console.log("Users data refetched successfully, found", (await refetch()).data?.length || 0, "users");
    } catch (error) {
      console.error("Error refetching users data:", error);
    }
  }, [queryClient, refetch]);

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
    refetchUsers,
    adminSetupAttempted
  };
}
