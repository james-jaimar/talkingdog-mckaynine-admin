
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClassDeletion } from "./hooks/utils/class-deletion";
import { ClassWithSchedules } from "./hooks/types/class-with-schedules";

interface DeleteClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: ClassWithSchedules | null;
}

export function DeleteClassDialog({ open, onOpenChange, classData }: DeleteClassDialogProps) {
  const { deleteClass } = useClassDeletion();

  const handleDelete = async () => {
    if (!classData) return;
    
    const success = await deleteClass(classData.id, classData.name);
    if (success) {
      onOpenChange(false);
    }
  };

  if (!classData) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Class</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{classData.name}"? This action cannot be undone.
            {classData.class_schedules && classData.class_schedules.length > 0 && (
              <span className="block mt-2 text-destructive font-medium">
                This class has schedules that will also be deleted.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Delete Class
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
