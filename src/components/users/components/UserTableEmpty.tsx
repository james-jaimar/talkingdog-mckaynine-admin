
import { TableRow, TableCell } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface UserTableEmptyProps {
  users: any[];
  filteredUsers: any[];
  filter: string;
  isLoading?: boolean; // Make isLoading optional
}

export function UserTableEmpty({ users, filteredUsers, filter, isLoading = false }: UserTableEmptyProps) {
  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="h-24 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <span className="mt-2 block text-sm text-muted-foreground">
            Loading users...
          </span>
        </TableCell>
      </TableRow>
    );
  }
  
  if (!users || users.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
          No users found in database.
        </TableCell>
      </TableRow>
    );
  }
  
  if (filteredUsers.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
          No users match your search.
        </TableCell>
      </TableRow>
    );
  }
  
  return null;
}
