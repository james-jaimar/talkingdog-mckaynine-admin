
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";
import { fetchScheduleId, ScheduleInfo } from "./fetchScheduleId";
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
  createInvoiceProps: Omit<CreateInvoiceProps, 'bookingId' | 'className' | 'classPrice' | 'dogName' | 'enrollmentFee' | 'classDate'>;
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
    // First, find the correct schedule ID for this class (now returns schedule info with date)
    const scheduleInfo = await fetchScheduleId(classId);
    
    if (!scheduleInfo) {
      throw new Error("Could not find a schedule for this class");
    }
    
    const { id: scheduleId, firstDate: classDate } = scheduleInfo;
    
    // Get class details for the invoice
    const classDetails = await fetchClassDetails(classId);
    if (!classDetails) {
      throw new Error("Could not fetch class details");
    }
    
    console.log("Adding handler to class schedule with details:", { 
      handlerId, 
      dogId, 
      scheduleId,
      classDate,
      classDetails
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
    
    // Only create an invoice if class price is greater than zero
    const classPrice = classDetails.courseFee || 0;
    const enrollmentFee = classDetails.enrollmentFee || 0;
    const totalInvoiceAmount = classPrice + enrollmentFee;

    let invoiceCreated = false;
    
    if (totalInvoiceAmount > 0) {
      // Attempt to create an invoice for the booking
      try {
        invoiceCreated = await createInvoiceForHandler({
          ...createInvoiceProps,
          bookingId: booking.id, 
          className: classDetails.name, 
          classPrice,
          enrollmentFee,
          dogName,
          classDate, // Pass the class schedule date for proper invoice dating
        });
        
        if (!invoiceCreated) {
          console.warn("Invoice creation failed for booking", booking.id);
          toast({
            title: "Warning",
            description: "Handler was added but invoice creation failed. Please create the invoice manually.",
            variant: "warning"
          });
        }
      } catch (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        toast({
          title: "Warning",
          description: "Handler was added but invoice creation failed. Please create the invoice manually.",
          variant: "warning"
        });
      }
    } else {
      console.log("Skipping invoice creation as class price and enrollment fee are zero");
      invoiceCreated = true; // No need for invoice in this case
    }
    
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
        : totalInvoiceAmount > 0 
          ? "Handler added to class, but invoice creation failed. Please create it manually."
          : "Handler added to class. No invoice needed (class has no fee).",
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
