
import { FormValues } from "../../form/handlerAddFormSchema";
import { useClientCreation } from "./createClient";
import { useDogCreation } from "./createDog";
import { useEnrollmentCreation } from "./createEnrollment";
import { useClientNotesUpdate } from "./updateClientNotes";
import { QueryClient } from "@tanstack/react-query";

export function useHandlerSubmission(queryClient: QueryClient, toast: any) {
  // Import all the service hooks
  const { createClient } = useClientCreation();
  const { createDog } = useDogCreation();
  const { createEnrollment } = useEnrollmentCreation();
  const { updateClientNotes } = useClientNotesUpdate();
  
  const submitHandler = async (data: FormValues, branchId: string) => {
    if (!branchId) {
      throw new Error("Branch ID is required to create a handler");
    }
    
    console.log("Creating handler with branch ID:", branchId);
    
    // Create client with branch_id
    const clientData = await createClient(data, branchId).catch(error => {
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
    
    // Force immediate data refresh
    await queryClient.invalidateQueries({ queryKey: ["handlers", branchId] });
    // Additional invalidations that might be needed
    await queryClient.invalidateQueries({ queryKey: ["class-handlers"] });
    await queryClient.invalidateQueries({ queryKey: ["dogs"] });
  };
  
  return { submitHandler };
}
