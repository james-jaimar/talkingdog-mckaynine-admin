
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
        is_enrolled: booking.is_enrolled,
        vaccination_verified: booking.vaccination_verified,
        proof_of_payment: booking.proof_of_payment || '',
        additional_notes: booking.additional_notes || '',
        info_eo: booking.info_eo || '',
        uses_whatsapp: booking.uses_whatsapp,
        social_media_consent: booking.social_media_consent,
        info_pg: booking.info_pg || ''
      }
    }));
  };

  const saveChanges = async (bookingId: string, classId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update(formData[bookingId])
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Handler information updated"
      });
      
      setEditingBookingId(null);
      queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update handler information",
        variant: "destructive"
      });
    }
  };

  return {
    editingBookingId,
    formData,
    handleInputChange,
    startEditing,
    saveChanges
  };
}
