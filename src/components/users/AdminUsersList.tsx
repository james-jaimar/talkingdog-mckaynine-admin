
import { useState } from "react";
import { useFetchUsers } from "./hooks/useFetchUsers";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

// Import the components
import { UserTableActions } from "./components/UserTableActions";
import { UserFilterBar } from "./components/UserFilterBar";
import { UsersTable } from "./components/UsersTable";
import { UserRoleDialog } from "./components/UserRoleDialog";
import { UserResetPasswordDialog } from "./components/UserResetPasswordDialog";
import { AddUserDialog } from "./AddUserDialog";
import { useUserRoleManagement } from "./hooks/useUserRoleManagement";

export function AdminUsersList() {
  // Use the enhanced useFetchUsers hook
  const { data: users = [], isLoading, refetch, error } = useFetchUsers();
  const { toast } = useToast();
  const { updateUserRole } = useUserRoleManagement();
  
  // State management
  const [filterText, setFilterText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Get selected user
  const selectedUser = users.find(user => user.id === selectedUserId);
  
  // Filter users by name or email
  const filteredUsers = users.filter(
    user => (
      (user.full_name?.toLowerCase() || '').includes(filterText.toLowerCase()) || 
      (user.email?.toLowerCase() || '').includes(filterText.toLowerCase())
    )
  );
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };
  
  // Open role dialog
  const handleEditRole = (userId: string, currentRole: string) => {
    console.log(`Editing role for user ID: ${userId}, current role: ${currentRole}`);
    setSelectedUserId(userId);
    setRoleDialogOpen(true);
  };
  
  // Save role using our improved hook
  const handleSaveRole = async (newRole: string) => {
    if (!selectedUserId) return;
    
    try {
      await updateUserRole({
        userId: selectedUserId,
        role: newRole
      });
      
      setRoleDialogOpen(false);
    } catch (error) {
      console.error("Error in handleSaveRole:", error);
    }
  };
  
  // Open password reset dialog
  const handleResetPassword = (userId: string) => {
    console.log(`Resetting password for user ID: ${userId}`);
    setSelectedUserId(userId);
    setPasswordDialogOpen(true);
  };
  
  // Save password
  const handleSavePassword = async (newPassword: string) => {
    if (!selectedUserId) return;
    
    try {
      console.log(`Attempting to reset password for user ID: ${selectedUserId}`);
      // Reset user password using admin API
      const { error } = await supabase.auth.admin.updateUserById(selectedUserId, {
        password: newPassword,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password reset",
        description: "User password has been reset successfully",
      });
      
      setPasswordDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
      console.error("Error resetting password:", error);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <UserTableActions 
          onRefresh={handleRefresh} 
          onAddUser={() => setAddUserOpen(true)}
          isRefreshing={isRefreshing}
          userCount={users.length}
        />
      </CardHeader>
      <CardContent>
        <UserFilterBar 
          filterText={filterText}
          onFilterChange={setFilterText}
        />
        
        <UsersTable 
          users={users}
          filteredUsers={filteredUsers}
          isLoading={isLoading}
          onEditRole={handleEditRole}
          onResetPassword={handleResetPassword}
        />
      </CardContent>
      
      {/* Dialogs */}
      <UserRoleDialog 
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        selectedUser={selectedUser}
        onSaveRole={handleSaveRole}
      />
      
      <UserResetPasswordDialog 
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        selectedUser={selectedUser}
        onResetPassword={handleSavePassword}
      />
      
      <AddUserDialog 
        open={addUserOpen} 
        onOpenChange={setAddUserOpen} 
        onUserAdded={() => refetch()} 
      />
    </Card>
  );
}
