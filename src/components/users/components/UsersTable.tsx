
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRow } from "./UserRow";
import { UserProfile } from "../types/userTypes";

interface UsersTableProps {
  users: UserProfile[];
  filteredUsers: UserProfile[];
  isLoading: boolean;
  onEditRole: (userId: string, currentRole: string) => void;
  onResetPassword: (userId: string) => void;
}

export function UsersTable({
  users,
  filteredUsers,
  isLoading,
  onEditRole,
  onResetPassword,
}: UsersTableProps) {
  console.log("UsersTable - Received users:", users);
  console.log("UsersTable - Filtered users:", filteredUsers);
  console.log(`UsersTable - User count: ${users.length}, Filtered count: ${filteredUsers.length}`);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name / Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                  <span>Loading users...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                {users.length === 0 ? "No users found." : "No users match your search."}
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map(user => (
              <UserRow 
                key={user.id}
                user={user}
                onEditRole={onEditRole}
                onResetPassword={onResetPassword}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
