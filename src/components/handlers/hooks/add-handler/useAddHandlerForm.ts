
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { formSchema, type FormValues } from "../../form/handlerAddFormSchema";
import { useClientCreation } from "./createClient";
import { useDogCreation } from "./createDog";
import { useEnrollmentCreation } from "./createEnrollment";
import { useClientNotesUpdate } from "./updateClientNotes";

export function useAddHandlerForm(onSuccess: () => void) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  
  // Import all the service hooks
  const { createClient } = useClientCreation();
  const { createDog } = useDogCreation();
  const { createEnrollment } = useEnrollmentCreation();
  const { updateClientNotes } = useClientNotesUpdate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      dogName: "",
      breed: "",
      dogDob: "",
      assessment: "",
      comments: "",
      whatsApp: false,
      photoPermission: false,
      classEnrollment: "",
      puppyClass: "",
      eoClass: "",
      bronzeCgcClass: "",
      silverCgcClass: "",
      beginnerNoviceClass: "",
      wtClass: "",
      yogaClass: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    console.log("Form submitted with data:", data);

    try {
      // Check if the currentBranch exists
      if (!currentBranch?.id) {
        toast({
          title: "Error",
          description: "No branch selected. Please select a branch to add a handler.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const clientData = await createClient(data, currentBranch.id);
      const dogData = await createDog(data, clientData.id);
      
      // Create enrollments (non-blocking)
      await createEnrollment(data, dogData.id);
      
      // Update client notes with preferences
      await updateClientNotes(data, clientData.id);

      console.log("Handler creation complete, refreshing data");
      
      // Force immediate data refresh
      await queryClient.invalidateQueries({ queryKey: ["handlers"] });
      
      toast({
        title: "Handler added successfully",
        description: "The new handler and dog have been added to the system.",
      });

      // Reset form
      form.reset();
      
      console.log("Calling onSuccess to close modal");
      // Close the modal
      onSuccess();
    } catch (error: any) {
      console.error("Error adding handler:", error);
      toast({
        title: "Failed to add handler",
        description: error.message || "There was an error adding the handler. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    isSubmitting,
    onSubmit
  };
}
