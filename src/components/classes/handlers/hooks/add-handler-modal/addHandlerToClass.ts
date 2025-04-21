
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";
import { fetchScheduleId } from "./fetchScheduleId";
import { fetchClassDetails } from "./fetchClassDetails";
import { fetchDogName } from "./fetchDogName";
import { createInvoiceForHandler, CreateInvoiceProps } from "./createInvoiceForHandler";

interface AddHandlerToClassProps {
  handlerId: string;
  dogId: string;
  classId: string;
  setIsProcessing: (processing: boolean) => void;
  isProcessing: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  queryClient: QueryClient;
  toast: any;
  createInvoiceProps: Omit<CreateInvoiceProps, 'bookingId' | 'className' | 'classPrice' | 'dogName' | 'enrollmentFee'>;
}

export const addHandlerToClass = async ({
  handlerId,
  dogId,
  classId,
  setIsProcessing,
  isProcessing,
  onOpenChange,
  onSuccess,
  queryClient,
  toast,
  createInvoiceProps
}: AddHandlerToClassProps): Promise<void> => {
  if (isProcessing) return; // Prevent multiple submissions
  
  setIsProcessing(true);
  
  try {
    // First, find the correct schedule ID for this class
    const scheduleId = await fetchScheduleId(classId);
    
    if (!scheduleId) {
      throw new Error("Could not find a schedule for this class");
    }
    
    // Get class details for the invoice
    const classDetails = await fetchClassDetails(classId);
    if (!classDetails) {
      throw new Error("Could not fetch class details");
    }
    
    console.log("Adding handler to class schedule:", { 
      handlerId, 
      dogId, 
      scheduleId,
      classDetails // Now includes all fee information
    });
    
    // First check if this handler-dog combination is already booked for this class schedule
    const { data: existingBookings, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('client_id', handlerId)
      .eq('dog_id', dogId)
      .eq('class_schedule_id', scheduleId);
    
    if (checkError) {
      console.error("Error checking existing bookings:", checkError);
      throw checkError;
    }
    
    if (existingBookings && existingBookings.length > 0) {
      throw new Error("This handler and dog are already enrolled in this class");
    }
    
    // Create a booking record that connects the handler to the class
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        client_id: handlerId,
        dog_id: dogId,
        class_schedule_id: scheduleId,
        is_enrolled: true,
        payment_status: 'pending'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error("Error creating booking:", error);
      throw error;
    }

    // Get dog name for the invoice
    const dogName = await fetchDogName(dogId);
    
    // Create an invoice for this booking with all needed details
    const invoiceCreated = await createInvoiceForHandler({
      ...createInvoiceProps,
      bookingId: booking.id, 
      className: classDetails.name, 
      classPrice: classDetails.courseFee, // Use courseFee directly
      enrollmentFee: classDetails.enrollmentFee, // Pass enrollment fee separately
      dogName
    });
    
    // Invalidate relevant queries to refresh data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["handlers"] }),
      queryClient.invalidateQueries({ queryKey: ["class-handlers", classId] }),
      queryClient.invalidateQueries({ queryKey: ["available-handlers", classId] }),
      queryClient.invalidateQueries({ queryKey: ["client-invoices", handlerId] }),
      queryClient.invalidateQueries({ queryKey: ["my-invoices"] })
    ]);
    
    toast({
      title: "Success",
      description: invoiceCreated 
        ? "Handler added to class and invoice created."
        : "Handler added to class, but invoice creation failed. Please create it manually.",
    });
    
    // Close modal
    onOpenChange(false);
    
    // Call the onSuccess callback
    onSuccess();
  } catch (error: any) {
    console.error("Error adding handler to class:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to add handler to class.",
      variant: "destructive"
    });
  } finally {
    setIsProcessing(false);
  }
};
