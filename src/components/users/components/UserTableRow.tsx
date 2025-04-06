
import { useState } from "react";
import { format } from "date-fns";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Key, UserCog } from "lucide-react";
import { UserProfile } from "../types/userTypes";
import { 
  Dialog, 
  DialogTrigger 
} from "@/components/ui/dialog";

interface UserTableRowProps {
  user: UserProfile;
  isLoadingTrainers: boolean;
  trainers: any[];
  onEditUser: (user: UserProfile) => void;
  onResetPassword: (user: UserProfile) => void;
  onLinkTrainer: (userId: string, trainerId: string) => void;
  onUnlinkTrainer: (userId: string, trainerId: string) => void;
}

export function UserTableRow({
  user,
  isLoadingTrainers,
  trainers,
  onEditUser,
  onResetPassword,
  onLinkTrainer,
  onUnlinkTrainer,
}: UserTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        {user.full_name || "—"}
        {user.isCurrentUser && (
          <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
            You
          </span>
        )}
      </TableCell>
      <TableCell>{user.username}</TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          user.role === "admin" 
            ? "bg-blue-100 text-blue-800" 
            : user.role === "trainer" 
              ? "bg-green-100 text-green-800" 
              : user.role === "handler"
                ? "bg-orange-100 text-orange-800"
                : "bg-gray-100 text-gray-800"
        }`}>
          {user.role || "user"}
        </span>
      </TableCell>
      <TableCell>
        <TrainerCellContent 
          user={user}
          isLoadingTrainers={isLoadingTrainers}
          trainers={trainers}
          onLinkTrainer={onLinkTrainer}
          onUnlinkTrainer={onUnlinkTrainer}
        />
      </TableCell>
      <TableCell>
        {user.created_at 
          ? format(new Date(user.created_at), "PPP") 
          : "—"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onResetPassword(user)}
          >
            <Key className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEditUser(user)}
              >
                <UserCog className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface TrainerCellContentProps {
  user: UserProfile;
  isLoadingTrainers: boolean;
  trainers: any[];
  onLinkTrainer: (userId: string, trainerId: string) => void;
  onUnlinkTrainer: (userId: string, trainerId: string) => void;
}

function TrainerCellContent({
  user,
  isLoadingTrainers,
  trainers,
  onLinkTrainer,
  onUnlinkTrainer
}: TrainerCellContentProps) {
  if (isLoadingTrainers) {
    return <span className="text-sm text-muted-foreground">Loading...</span>;
  }
  
  if (user.trainer) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {user.trainer.first_name} {user.trainer.last_name}
        </span>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 p-0 text-xs text-red-500 hover:text-red-700"
          onClick={() => onUnlinkTrainer(user.id, user.trainer!.id)}
        >
          Unlink
        </Button>
      </div>
    );
  }
  
  if (user.role === "trainer") {
    return (
      <select 
        className="h-7 text-xs w-[180px] rounded-md border border-input"
        onChange={(e) => onLinkTrainer(user.id, e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>Link to trainer</option>
        {trainers.filter(t => !t.user_id).map((trainer) => (
          <option key={trainer.id} value={trainer.id}>
            {trainer.first_name} {trainer.last_name}
          </option>
        ))}
        {trainers.filter(t => !t.user_id).length === 0 && (
          <option value="none" disabled>
            No unlinked trainers
          </option>
        )}
      </select>
    );
  }
  
  return <span className="text-sm text-muted-foreground">Not a trainer</span>;
}
