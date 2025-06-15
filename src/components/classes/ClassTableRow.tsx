
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClassActionButtons } from "./ClassActionButtons";
import { ClassWithSchedules } from "./hooks/types/class-with-schedules";

interface ClassRowProps {
  classItem: ClassWithSchedules;
  index: number;
  totalClasses?: number;
  onEdit: (id: string) => void;
  isLoading?: boolean;
  isMoving?: boolean;
}

export function ClassTableRow({ classItem, index, totalClasses, onEdit, isLoading, isMoving }: ClassRowProps) {
  const navigate = useNavigate();

  const {
    id,
    name,
    class_type,
    capacity,
    duration,
    course_fee,
    enrollment_fee,
    admin_fee_value,
    admin_fee_type,
    mckaynine_commission_value,
    mckaynine_commission_type,
    trainer_fee_value,
    trainer_fee_type,
    status,
  } = classItem;

  const handleViewSchedules = () => {
    navigate(`/class-schedules?classId=${id}`);
  };

  const handleViewHandlers = () => {
    navigate(`/class-handlers?classId=${id}`);
  };

  return (
    <tr>
      <td>{name}</td>
      <td>{class_type}</td>
      <td>{capacity}</td>
      <td>{duration}</td>
      <td>{course_fee}</td>
      <td>{enrollment_fee}</td>
      <td>
        {admin_fee_value} ({admin_fee_type})
      </td>
      <td>
        {mckaynine_commission_value} ({mckaynine_commission_type})
      </td>
      <td>
        {trainer_fee_value} ({trainer_fee_type})
      </td>
      <td>
        <Badge
          variant={status === "open" ? "default" : "secondary"}
        >
          {status}
        </Badge>
      </td>
      <td>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewSchedules}>View Schedules</DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewHandlers}>View Handlers</DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the class and remove its data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-500 text-white"
                    onClick={() => onEdit(id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      <td>
        <ClassActionButtons classId={classItem.id} classStatus={classItem.status ?? "open"} />
      </td>
    </tr>
  );
}
