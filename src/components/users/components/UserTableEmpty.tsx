
import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UserProfile } from "../types/userTypes";

interface UserTableEmptyProps {
  users: UserProfile[];
  filteredUsers: UserProfile[];
  filter: string;
  isLoading: boolean;
}

export function UserTableEmpty({ users, filteredUsers, filter, isLoading }: UserTableEmptyProps) {
  if (isLoading) {
    return (
      <>
        {Array(3).fill(0).map((_, i) => (
          <TableRow key={`loading-${i}`}>
            <TableCell>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24 mt-1" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8 ml-auto" />
            </TableCell>
          </TableRow>
        ))}
      </>
    );
  }
  
  if (filteredUsers.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="h-32 text-center">
          {users.length === 0 ? (
            <div className="text-muted-foreground">
              No users found. Add users to get started.
            </div>
          ) : (
            <div className="text-muted-foreground">
              No users match your search criteria.
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  }
  
  return null;
}
