
import { TableRow, TableCell } from "@/components/ui/table";

interface UserTableEmptyProps {
  users: any[];
  filteredUsers: any[];
  filter: string;
}

export function UserTableEmpty({ users, filteredUsers, filter }: UserTableEmptyProps) {
  if (!users || users.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
          No users found in database.
        </TableCell>
      </TableRow>
    );
  }
  
  if (filteredUsers.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
          No users match your search.
        </TableCell>
      </TableRow>
    );
  }
  
  return null;
}
