
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    setErrorMessage(null);
    console.log("Form submitted with data:", data);

    try {
      // Check if the currentBranch exists
      if (!currentBranch?.id) {
        setErrorMessage("No branch selected. Please select a branch to add a handler.");
        toast({
          title: "Missing Branch",
          description: "No branch selected. Please select a branch to add a handler.",
          variant: "destructive",
        });
        return;
      }

      // Create client
      const clientData = await createClient(data, currentBranch.id).catch(error => {
        console.error("Client creation error caught:", error);
        // Convert error to more user-friendly message
        if (error.message.includes("already exists")) {
          throw new Error(`A handler with email ${data.email} already exists in the system. Please use a different email.`);
        }
        throw error;
      });
      
      // Create dog using the client ID
      const dogData = await createDog(data, clientData.id).catch(error => {
        console.error("Dog creation error caught:", error);
        // Add additional context for the user
        throw new Error(`Created handler but failed to create dog: ${error.message}. The handler was created but you'll need to add the dog manually.`);
      });
      
      // Create enrollments (non-blocking)
      await createEnrollment(data, dogData.id);
      
      // Update client notes with preferences
      await updateClientNotes(data, clientData.id);

      console.log("Handler creation complete, refreshing data");
      
      // Force immediate data refresh - make multiple attempts in case of network issues
      try {
        await queryClient.invalidateQueries({ queryKey: ["handlers"] });
        // Additional invalidations that might be needed
        await queryClient.invalidateQueries({ queryKey: ["class-handlers"] });
        await queryClient.invalidateQueries({ queryKey: ["dogs"] });
      } catch (refreshError) {
        console.error("Error refreshing data:", refreshError);
        // Still show success but warn about potential stale data
        toast({
          title: "Handler added successfully",
          description: "The handler was added but the list might not reflect changes immediately. Try refreshing the page.",
          variant: "default",
        });
      }
      
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
      
      // Set the error message that can be displayed in the UI
      setErrorMessage(error.message || "There was an error adding the handler. Please try again.");
      
      // Show toast with the error
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
    errorMessage,
    onSubmit
  };
}
