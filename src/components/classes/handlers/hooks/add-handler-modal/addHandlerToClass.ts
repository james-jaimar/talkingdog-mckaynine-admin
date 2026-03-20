
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";
import { fetchScheduleId } from "./fetchScheduleId";
import { fetchClassDetails } from "./fetchClassDetails";
import { fetchDogName } from "./fetchDogName";
import { createInvoiceForHandler, CreateInvoiceProps } from "./createInvoiceForHandler";
import { checkExistingTermEnrollment } from "./checkExistingTermEnrollment";
import { addToExistingInvoice, createMultiDogDiscountTasks } from "./addToExistingInvoice";
import { rebalanceHouseholdInvoices } from "./rebalanceHouseholdInvoices";

interface AddHandlerToClassProps {
  handlerId: string;
  dogIds: string[];
  classId: string;
  setIsProcessing: (processing: boolean) => void;
  isProcessing: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  queryClient: QueryClient;
  toast: any;
  createInvoiceProps: Omit<CreateInvoiceProps, 'bookingIds' | 'className' | 'classPrice' | 'dogNames' | 'enrollmentFee' | 'classDate' | 'dogIds' | 'classBranchId' | 'classReportMonthOverride' | 'classIOInventoryCode' | 'classTermId'>;
}

export const addHandlerToClass = async ({
  handlerId,
  dogIds,
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
    // First, find the correct schedule ID for this class (now returns schedule info with date and term)
    const scheduleInfo = await fetchScheduleId(classId);
    
    if (!scheduleInfo) {
      throw new Error("Could not find a schedule for this class");
    }
    
    const { id: scheduleId, firstDate: classDate, termId } = scheduleInfo;
    
    // Get class details for the invoice
    const classDetails = await fetchClassDetails(classId);
    if (!classDetails) {
      throw new Error("Could not fetch class details");
    }
    
    console.log("Adding handler to class schedule with details:", { 
      handlerId, 
      dogIds, 
      scheduleId,
      classDate,
      termId,
      classDetails
    });
    
    // Check for existing bookings for each dog
    for (const dogId of dogIds) {
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
        const dogName = await fetchDogName(dogId);
        throw new Error(`${dogName} is already enrolled in this class`);
      }
    }
    
    // Check for existing enrollments in this term (for multi-dog discount across classes)
    // Pass the class branch ID to ensure discounts only apply within same branch
    const existingEnrollment = await checkExistingTermEnrollment(handlerId, termId, dogIds, classDetails.branchId);
    
    // Create booking records for each dog
    const bookingIds: string[] = [];
    const dogNames: string[] = [];
    
    for (const dogId of dogIds) {
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
        console.error("Error creating booking for dog:", dogId, error);
        throw new Error(`Failed to create booking: ${error.message}`);
      }
      
      if (!booking || !booking.id) {
        throw new Error(`Booking creation failed for dog ${dogId} - no ID returned`);
      }
      
      bookingIds.push(booking.id);
      
      // Get dog name for the invoice
      const dogName = await fetchDogName(dogId);
      dogNames.push(dogName);
    }
    
    // Validate that we have booking IDs for all dogs before creating invoice
    if (bookingIds.length !== dogIds.length) {
      throw new Error(`Booking creation mismatch: expected ${dogIds.length} bookings but got ${bookingIds.length}`);
    }
    
    // Ensure no undefined booking IDs
    const validBookingIds = bookingIds.filter(id => id !== undefined && id !== null);
    if (validBookingIds.length !== dogIds.length) {
      throw new Error(`Some bookings have invalid IDs: ${bookingIds.join(', ')}`);
    }
    
    // Only create an invoice if class price is greater than zero
    const classPrice = classDetails.courseFee || 0;
    const enrollmentFee = classDetails.enrollmentFee || 0;
    const totalInvoiceAmount = classPrice + enrollmentFee;

    let invoiceCreated = false;
    let multiDogDiscountApplied = false;
    let householdRebalanceApplied = false;
    let updatedInvoiceNumber: string | undefined;
    
    if (totalInvoiceAmount > 0) {
      // Check if there's an existing invoice to add to (same handler OR household member)
      if (existingEnrollment.hasExistingEnrollment && 
          existingEnrollment.existingInvoiceId && 
          existingEnrollment.existingInvoiceStatus !== 'paid' &&
          existingEnrollment.existingInvoiceStatus !== 'cancelled') {
        
        const isHousehold = existingEnrollment.isHouseholdEnrollment;
        console.log(`${isHousehold ? 'HOUSEHOLD' : 'MULTI-DOG'}-DISCOUNT: Adding to existing invoice`, existingEnrollment);
        
        // Add to existing invoice with discount (same path for both household and same-handler)
        const updateResult = await addToExistingInvoice({
          existingInvoiceId: existingEnrollment.existingInvoiceId,
          handlerId,
          dogIds,
          dogNames,
          bookingIds,
          className: classDetails.name,
          classPrice,
          enrollmentFee,
          existingDogName: existingEnrollment.existingDogName,
          existingClassName: existingEnrollment.existingClassName,
          classIOInventoryCode: classDetails.ioInventoryCode,
        });
        
        if (updateResult.success) {
          invoiceCreated = true;
          multiDogDiscountApplied = true;
          householdRebalanceApplied = isHousehold;
          updatedInvoiceNumber = updateResult.invoiceNumber;
          
          // If household enrollment, link the second handler as additional recipient
          if (isHousehold) {
            const { error: recipientError } = await supabase
              .from('invoice_additional_recipients')
              .upsert({
                invoice_id: existingEnrollment.existingInvoiceId,
                client_id: handlerId,
              }, { onConflict: 'invoice_id,client_id' });
            
            if (recipientError) {
              console.warn("Failed to add household member as invoice recipient:", recipientError);
            } else {
              console.log("Added household member as additional invoice recipient");
            }
          }
          
          // Create admin notification tasks
          await createMultiDogDiscountTasks(
            handlerId,
            dogNames[0],
            classDetails.name,
            existingEnrollment.existingDogName || 'Another dog',
            existingEnrollment.existingClassName || 'another class',
            updateResult.invoiceNumber || 'unknown',
            updateResult.discountApplied || 0
          );
        } else {
          console.warn("Failed to update existing invoice, will create new one:", updateResult.error);
          // Fall through to create new invoice
        }
      }
      
      // If we didn't update an existing invoice, create a new one
      if (!invoiceCreated) {
        try {
          invoiceCreated = await createInvoiceForHandler({
            ...createInvoiceProps,
            dogIds,
            bookingIds,
            className: classDetails.name, 
            classPrice,
            enrollmentFee,
            dogNames,
            classDate,
            classBranchId: classDetails.branchId,
            classReportMonthOverride: classDetails.reportMonthOverride,
            classIOInventoryCode: classDetails.ioInventoryCode,
            classTermId: termId,
          });
          
          if (!invoiceCreated) {
            console.warn("Invoice creation failed for bookings", bookingIds);
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
      queryClient.invalidateQueries({ queryKey: ["my-invoices"] }),
      queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] }),
    ]);
    
    const dogCountText = dogIds.length > 1 ? `${dogIds.length} dogs` : "dog";
    
    // Build success message based on what happened
    let successMessage: string;
    if (householdRebalanceApplied) {
      successMessage = `${dogCountText} added to class. Household invoices rebalanced 50/50 with 25% discount. Admin task created for review.`;
    } else if (multiDogDiscountApplied) {
      successMessage = `${dogCountText} added to class. Multi-dog discount (25%) applied - invoice ${updatedInvoiceNumber} updated. Admin tasks created for review.`;
    } else if (dogIds.length === 2) {
      successMessage = `${dogCountText} added to class and invoice created (25% discount applied to 2nd dog).`;
    } else if (invoiceCreated && totalInvoiceAmount > 0) {
      successMessage = `${dogCountText} added to class and invoice created.`;
    } else if (totalInvoiceAmount > 0) {
      successMessage = `${dogCountText} added to class, but invoice creation failed. Please create it manually.`;
    } else {
      successMessage = `${dogCountText} added to class. No invoice needed (class has no fee).`;
    }
    
    toast({
      title: "Success",
      description: successMessage,
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
