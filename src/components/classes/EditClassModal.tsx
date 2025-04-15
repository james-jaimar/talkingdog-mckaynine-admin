import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { classFormSchema, ClassFormValues } from "./schemas/classFormSchema";
import { useBranch } from "@/context/BranchContext";

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
      duration: classData?.duration ? String(classData.duration) : "",
      price: classData?.price ? String(classData.price) : "",
      capacity: classData?.capacity ? String(classData.capacity) : "8",
      description: classData?.description || "",
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
          duration: parseInt(values.duration, 10),
          price: parseFloat(values.price),
          capacity: parseInt(values.capacity, 10),
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>
            Make changes to your class here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name"  className="col-span-3" {...form.register("name")} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="level" className="text-right">
              Level
            </Label>
            <Input id="level"  className="col-span-3" {...form.register("level")} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Duration
            </Label>
            <Input
              id="duration"
               className="col-span-3"
              {...form.register("duration")}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input
              id="price"
               className="col-span-3"
              {...form.register("price")}
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="capacity" className="text-right">
              Capacity
            </Label>
            <Input
              id="capacity"
               className="col-span-3"
              {...form.register("capacity")}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
               className="col-span-3"
              {...form.register("description")}
            />
          </div>
        </form>
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
      </DialogContent>
    </Dialog>
  );
}
