
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { formSchema, type FormValues } from "../../form/handlerAddFormSchema";
import { useHandlerSubmission } from "./useHandlerSubmission";

export function useAddHandlerForm(onSuccess: () => void) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  
  // Import the submission handler
  const { submitHandler } = useHandlerSubmission(queryClient, toast);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      branch_id: currentBranch?.id || "", // Set default branch to current branch
      dogName: "",
      breed: "",
      dogDob: "",
      dogAge: "",
      assessment: "",
      comments: "",
      whatsApp: false,
      photoPermission: false,
      
      // Puppy class specific fields
      puppyVaccinated: false,
      puppyVaccinationDate: "",
      puppyMicrochipped: false,
      puppyMicrochipNumber: "",
      puppyVetName: "",
      puppyVetPhone: "",
      puppyVetAddress: "",
      puppyDewormingDate: "",
      puppyDiet: "",
      puppyPreviousTraining: "",
      puppyBehaviorIssues: "",
      puppyMedicalConditions: "",
      indemnityAgreement: false,
      
      // Class enrollment fields
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

  // Update branch_id field when currentBranch changes
  useState(() => {
    if (currentBranch?.id) {
      form.setValue('branch_id', currentBranch.id);
    }
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);
    console.log("Form submitted with data:", data);

    // Validate required puppy information if puppy class is selected
    if (data.puppyClass && !data.indemnityAgreement) {
      setErrorMessage("Indemnity agreement is required for puppy class enrollment.");
      setIsSubmitting(false);
      toast({
        title: "Missing Required Information",
        description: "Indemnity agreement is required for puppy class enrollment.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if the currentBranch exists
      const branchId = data.branch_id || currentBranch?.id;
      if (!branchId) {
        setErrorMessage("No branch selected. Please select a branch to add a handler.");
        toast({
          title: "Missing Branch",
          description: "No branch selected. Please select a branch to add a handler.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      await submitHandler(data, branchId);
      
      toast({
        title: "Handler added successfully",
        description: "The new handler and dog have been added to the system.",
      });

      // Reset form
      form.reset({
        ...form.formState.defaultValues,
        branch_id: currentBranch?.id || "" // Keep current branch
      });
      
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
