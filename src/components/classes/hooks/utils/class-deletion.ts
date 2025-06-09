
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { useTerm } from "@/context/TermContext";
import { toast } from "@/hooks/use-toast";

export function useClassDeletion() {
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const { termData } = useTerm();

  const deleteClass = async (classId: string, className: string) => {
    try {
      // First check if there are any schedules for this class
      const { data: schedules, error: schedulesError } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('class_id', classId);

      if (schedulesError) {
        throw schedulesError;
      }

      // If there are schedules, check for bookings
      if (schedules && schedules.length > 0) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id')
          .in('class_schedule_id', schedules.map(s => s.id));

        if (bookingsError) {
          throw bookingsError;
        }

        // Prevent deletion if there are bookings
        if (bookings && bookings.length > 0) {
          toast({
            title: "Cannot delete class",
            description: `${className} has existing bookings and cannot be deleted. Please remove all bookings first.`,
            variant: "destructive",
          });
          return false;
        }

        // Delete schedules first if no bookings
        const { error: deleteSchedulesError } = await supabase
          .from('class_schedules')
          .delete()
          .eq('class_id', classId);

        if (deleteSchedulesError) {
          throw deleteSchedulesError;
        }
      }

      // Delete the class
      const { error: deleteClassError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (deleteClassError) {
        throw deleteClassError;
      }

      // Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ["classes", currentBranch?.id],
          exact: false 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ["classes", currentBranch?.id, termData?.id],
          exact: false 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ["class-tab-order"],
          exact: false 
        })
      ]);

      toast({
        title: "Class deleted successfully",
        description: `${className} has been deleted.`,
      });

      return true;
    } catch (error) {
      console.error("Error deleting class:", error);
      toast({
        title: "Failed to delete class",
        description: String(error) || "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  return { deleteClass };
}
