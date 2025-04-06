
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useInvoices } from "@/hooks/useInvoices";

interface UseAddHandlerModalProps {
  classId: string;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useAddHandlerModal({ 
  classId, 
  onSuccess, 
  onOpenChange 
}: UseAddHandlerModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { createInvoice, generateInvoiceNumber } = useInvoices();

  // Get actual schedule IDs for this class to ensure we're using the correct one
  const fetchScheduleId = async (): Promise<string | null> => {
    try {
      const { data: scheduleIds, error } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('class_id', classId)
        .order('start_time', { ascending: true })
        .limit(1);
      
      if (error) throw error;
      
      return scheduleIds && scheduleIds.length > 0 ? scheduleIds[0].id : null;
    } catch (err) {
      console.error("Error fetching schedule ID:", err);
      return null;
    }
  };

  // Fetch class details including price and name
  const fetchClassDetails = async (): Promise<{ name: string; price: number } | null> => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('name, price')
        .eq('id', classId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error fetching class details:", err);
      return null;
    }
  };

  // Create an invoice for the handler based on the class details
  const createInvoiceForHandler = async (
    handlerId: string,
    dogId: string,
    bookingId: string,
    className: string,
    classPrice: number,
    dogName: string
  ) => {
    try {
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();
      
      // Prepare invoice data
      const invoiceData = {
        client_id: handlerId,
        invoice_number: invoiceNumber,
        status: "draft",
        issued_date: new Date(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        notes: `Invoice for ${className} training class for ${dogName}.`,
        tax_rate: 15, // Default tax rate
        items: [{
          description: `${className} training class for ${dogName}`,
          quantity: 1,
          unit_price: classPrice,
          booking_id: bookingId,
        }],
      };
      
      // Create the invoice
      await createInvoice.mutateAsync(invoiceData);
      
      console.log("Invoice created successfully for handler:", handlerId);
      return true;
    } catch (error) {
      console.error("Error creating invoice:", error);
      return false;
    }
  };

  // Get dog name for the invoice
  const fetchDogName = async (dogId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('name')
        .eq('id', dogId)
        .single();
      
      if (error) throw error;
      return data.name;
    } catch (err) {
      console.error("Error fetching dog name:", err);
      return "your dog";
    }
  };

  const addHandlerToClass = async (handlerId: string, dogId: string) => {
    if (isProcessing) return; // Prevent multiple submissions
    
    setIsProcessing(true);
    
    try {
      // First, find the correct schedule ID for this class
      const scheduleId = await fetchScheduleId();
      
      if (!scheduleId) {
        throw new Error("Could not find a schedule for this class");
      }
      
      // Get class details for the invoice
      const classDetails = await fetchClassDetails();
      if (!classDetails) {
        throw new Error("Could not fetch class details");
      }
      
      console.log("Adding handler to class schedule:", { 
        handlerId, 
        dogId, 
        scheduleId
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
        console.error("Error details:", error);
        throw error;
      }

      // Get dog name for the invoice
      const dogName = await fetchDogName(dogId);
      
      // Create an invoice for this booking
      await createInvoiceForHandler(
        handlerId, 
        dogId, 
        booking.id, 
        classDetails.name, 
        classDetails.price,
        dogName
      );
      
      // Invalidate both handlers data and class-handlers data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["handlers"] }),
        queryClient.invalidateQueries({ queryKey: ["class-handlers", classId] }),
        queryClient.invalidateQueries({ queryKey: ["available-handlers", classId] }),
        queryClient.invalidateQueries({ queryKey: ["client-invoices", handlerId] }),
        queryClient.invalidateQueries({ queryKey: ["my-invoices"] })
      ]);
      
      toast({
        title: "Success",
        description: "Handler added to class and invoice created.",
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

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing while processing
    if (isProcessing && newOpen === false) return;
    
    // Clear search when opening/closing
    if (!newOpen) {
      setSearchQuery("");
    }
    
    onOpenChange(newOpen);
  };

  return {
    isProcessing,
    searchQuery,
    setSearchQuery,
    addHandlerToClass,
    handleOpenChange
  };
}
