
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Booking } from "../types/booking";

export function useHandlerForm() {
  const { toast } = useToast();
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);

  const handleInputChange = (bookingId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        [field]: value
      }
    }));
  };

  const startEditing = (booking: Booking) => {
    setEditingBookingId(booking.id);
    setFormData(prev => ({
      ...prev,
      [booking.id]: {
        // Client-level fields (stored separately)
        enrollment_verified: booking.clients?.enrollment_verified ?? false,
        vaccination_verified: booking.clients?.vaccination_verified ?? false,
        // Booking-level fields
        proof_of_payment: booking.proof_of_payment || '',
        additional_notes: booking.additional_notes || '',
        info_eo: booking.info_eo || false,
        info_pg: booking.info_pg || false
      }
    }));
  };

  // Store the class ID for use in save operations
  const initializeWithClassId = (classId: string) => {
    setCurrentClassId(classId);
  };

  const saveChanges = async (bookingId: string, clientId?: string) => {
    if (!currentClassId) {
      toast({
        title: "Error",
        description: "Class ID not found",
        variant: "destructive"
      });
      return Promise.reject(new Error("Class ID not found"));
    }
    
    try {
      const data = formData[bookingId];
      
      // Separate client-level fields from booking-level fields
      const { enrollment_verified, vaccination_verified, ...bookingFields } = data;
      
      // Update booking-level fields
      const { error: bookingError } = await supabase
        .from('bookings')
        .update(bookingFields)
        .eq('id', bookingId);
      
      if (bookingError) throw bookingError;
      
      // Update client-level verification fields if clientId is provided
      if (clientId) {
        const { error: clientError } = await supabase
          .from('clients')
          .update({ enrollment_verified, vaccination_verified })
          .eq('id', clientId);
        
        if (clientError) throw clientError;
      }
      
      toast({
        title: "Success",
        description: "Handler information updated"
      });
      
      setEditingBookingId(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['class-handlers', currentClassId] });
      queryClient.invalidateQueries({ queryKey: ['handler-detail', clientId] });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update handler information",
        variant: "destructive"
      });
      
      return Promise.reject(error);
    }
  };

  const removeHandler = async (bookingId: string) => {
    if (!currentClassId) {
      toast({
        title: "Error",
        description: "Class ID not found",
        variant: "destructive"
      });
      return Promise.reject(new Error("Class ID not found"));
    }
    
    try {
      console.log('Starting removal of handler with booking ID:', bookingId);
      
      // First, delete any attendance records that reference this booking
      // This resolves the foreign key constraint issue
      const { error: attendanceError } = await supabase
        .from('class_attendance')
        .delete()
        .eq('booking_id', bookingId);
      
      if (attendanceError) {
        console.error('Error deleting attendance records:', attendanceError);
        throw attendanceError;
      }
      
      // Check for invoice items that reference this booking and handle them
      const { data: invoiceItems, error: invoiceItemsError } = await supabase
        .from('invoice_items')
        .select('id, invoice_id')
        .eq('booking_id', bookingId);
      
      if (invoiceItemsError) {
        console.error('Error checking invoice items:', invoiceItemsError);
        throw invoiceItemsError;
      }
      
      // If invoice items exist, just nullify the booking_id reference instead of deleting them
      if (invoiceItems && invoiceItems.length > 0) {
        const { error: updateError } = await supabase
          .from('invoice_items')
          .update({ booking_id: null })
          .eq('booking_id', bookingId);
        
        if (updateError) {
          console.error('Error updating invoice items:', updateError);
          throw updateError;
        }
      }
      
      // Check for trainer payments referencing this booking
      const { error: trainerPaymentsError } = await supabase
        .from('trainer_payments')
        .update({ booking_id: null })
        .eq('booking_id', bookingId);
      
      if (trainerPaymentsError) {
        console.error('Error updating trainer payments:', trainerPaymentsError);
        // Non-critical, we can continue even if this fails
      }
      
      // Now finally delete the booking record
      const { error: bookingError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);
      
      if (bookingError) {
        console.error('Error deleting booking:', bookingError);
        throw bookingError;
      }
      
      console.log('Successfully removed handler with booking ID:', bookingId);
      
      toast({
        title: "Success",
        description: "Handler removed from class"
      });
      
      // Invalidate the query to refresh data
      queryClient.invalidateQueries({ queryKey: ['class-handlers', currentClassId] });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing handler:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? 
          `Failed to remove handler: ${error.message}` : 
          "Failed to remove handler from class",
        variant: "destructive"
      });
      
      return Promise.reject(error);
    }
  };

  return {
    editingBookingId,
    formData,
    handleInputChange,
    startEditing,
    saveChanges,
    removeHandler,
    initializeWithClassId
  };
}
