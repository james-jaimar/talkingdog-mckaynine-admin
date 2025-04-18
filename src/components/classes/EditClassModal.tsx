
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { classFormSchema, ClassFormValues } from "./schemas/classFormSchema";
import { useBranch } from "@/context/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { FormTextField } from "@/components/handlers/form/FormTextField";
import { Form } from "@/components/ui/form";
import { FeeFields } from "./form-sections/FeeFields";

interface EditClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: any;
  onSuccess?: () => void;
}

export function EditClassModal({ open, onOpenChange, classData, onSuccess }: EditClassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: classData?.name || "",
      level: classData?.level || "",
      duration: classData?.duration || 60,
      course_fee: classData?.course_fee || 0,
      enrollment_fee: classData?.enrollment_fee || 0,
      mckaynine_commission_type: classData?.mckaynine_commission_type || 'percentage',
      mckaynine_commission_value: classData?.mckaynine_commission_value || 0,
      admin_fee_type: classData?.admin_fee_type || 'percentage',
      admin_fee_value: classData?.admin_fee_value || 0,
      trainer_fee_type: classData?.trainer_fee_type || 'percentage',
      trainer_fee_value: classData?.trainer_fee_value || 0,
      capacity: classData?.capacity || 8,
      description: classData?.description || "",
      branchId: currentBranch?.id || "",
    },
  });

  const onSubmit = async (values: ClassFormValues) => {
    if (!currentBranch) {
      toast({
        title: "No branch selected",
        description: "Please select a branch before updating a class",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("classes")
        .update({
          name: values.name,
          level: values.level,
          duration: values.duration,
          course_fee: values.course_fee,
          enrollment_fee: values.enrollment_fee,
          mckaynine_commission_type: values.mckaynine_commission_type,
          mckaynine_commission_value: values.mckaynine_commission_value,
          admin_fee_type: values.admin_fee_type,
          admin_fee_value: values.admin_fee_value,
          trainer_fee_type: values.trainer_fee_type,
          trainer_fee_value: values.trainer_fee_value,
          capacity: values.capacity,
          description: values.description,
          branch_id: currentBranch.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", classData.id);

      if (error) throw error;

      toast({
        title: "Class updated successfully",
        description: `${values.name} has been updated`,
      });

      queryClient.invalidateQueries({ queryKey: ["classes", currentBranch.id] });
      queryClient.invalidateQueries({ queryKey: ["active-classes", currentBranch.id] });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating class:", error);
      toast({
        title: "Error updating class",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>
            Make changes to your class here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormTextField
                control={form.control}
                name="name"
                label="Name"
                required
              />
              <FormTextField
                control={form.control}
                name="level"
                label="Level"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormTextField
                control={form.control}
                name="duration"
                label="Duration (minutes)"
                type="number"
                required
              />
              <FormTextField
                control={form.control}
                name="capacity"
                label="Capacity"
                type="number"
                required
              />
            </div>

            <FormTextField
              control={form.control}
              name="description"
              label="Description"
              required
            />

            <FeeFields control={form.control} />

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
