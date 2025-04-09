
import { useState } from "react";
import { useFetchUsers } from "./hooks/useFetchUsers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

// Import the new component files
import { UserTableActions } from "./components/UserTableActions";
import { UserFilterBar } from "./components/UserFilterBar";
import { UsersTable } from "./components/UsersTable";
import { UserRoleDialog } from "./components/UserRoleDialog";
import { UserResetPasswordDialog } from "./components/UserResetPasswordDialog";
import { AddUserDialog } from "./AddUserDialog";

export function AdminUsersList() {
  const { data: users = [], isLoading, refetch } = useFetchUsers();
  const { toast } = useToast();
  
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
      user.full_name?.toLowerCase().includes(filterText.toLowerCase()) || 
      user.email?.toLowerCase().includes(filterText.toLowerCase())
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
    setSelectedUserId(userId);
    setRoleDialogOpen(true);
  };
  
  // Save role
  const handleSaveRole = async (newRole: string) => {
    if (selectedUserId) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', selectedUserId);
        
        if (error) throw error;
        
        toast({
          title: "Role updated",
          description: `User role has been updated to ${newRole}`,
        });
        
        refetch();
        setRoleDialogOpen(false);
      } catch (error: any) {
        toast({
          title: "Update failed",
          description: error.message || "Failed to update role",
          variant: "destructive",
        });
        console.error("Error updating role:", error);
      }
    }
  };
  
  // Open password reset dialog
  const handleResetPassword = (userId: string) => {
    setSelectedUserId(userId);
    setPasswordDialogOpen(true);
  };
  
  // Save password
  const handleSavePassword = async (newPassword: string) => {
    if (selectedUserId) {
      try {
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
