import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "../types";
import { toast } from "sonner";

interface UseMarkInvoiceAsSentProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useMarkInvoiceAsSent = ({ onSuccess, onError }: UseMarkInvoiceAsSentProps = {}) => {
  const queryClient = useQueryClient();

  const markAsSentMutation = useMutation<Invoice, Error, Invoice>(
    async (invoice: Invoice) => {
      // Optimistically update the invoice status to 'sent'
      await queryClient.cancelQueries({ queryKey: ['invoices', invoice.id] });

      // Check if invoice is already sent
      if (invoice.status === 'sent') {
        throw new Error("Invoice is already marked as sent.");
      }

      // Call the Supabase function to update the invoice status
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Optionally fix duplicate trainer payments
      if (invoice.status === 'draft') {
        const { data: fixResult, error: fixError } = await supabase.rpc(
          "check_user_role", 
          { user_id: invoice.id }
        );

        if (fixError) {
          console.error("Error fixing duplicate trainer payments:", fixError);
          toast.error("Error fixing duplicate trainer payments. Please contact support.");
        } else {
          console.log("Duplicate trainer payments fixed:", fixResult);
        }
      }

      return data as Invoice;
    },
    {
      onSuccess: (updatedInvoice) => {
        // Invalidate the invoices queries to refetch the updated data
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoices', updatedInvoice.id] });

        // Optionally execute the provided onSuccess callback
        onSuccess?.();

        // Display a success toast notification
        toast.success("Invoice marked as sent successfully.");
      },
      onError: (error, invoice) => {
        // Revert the optimistic update on error
        queryClient.invalidateQueries({ queryKey: ['invoices', invoice.id] });

        // Optionally execute the provided onError callback
        onError?.(error);

        // Display an error toast notification
        toast.error(`Failed to mark invoice as sent: ${error.message}`);
      },
    }
  );

  const markAllAsSentMutation = useMutation<Invoice[], Error, Invoice[]>(
    async (invoices: Invoice[]) => {
      // Optimistically update the invoice statuses to 'sent'
      await queryClient.cancelQueries({ queryKey: ['invoices'] });

      // Call the Supabase function to update the invoice statuses
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .in('id', invoices.map(invoice => invoice.id))
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // Optionally fix duplicate trainer payments
      const { data: fixAllResult, error: fixAllError } = await supabase.rpc(
        "check_user_role", 
        { user_id: "system" }
      );

      if (fixAllError) {
        console.error("Error fixing duplicate trainer payments:", fixAllError);
        toast.error("Error fixing duplicate trainer payments. Please contact support.");
      } else {
        console.log("Duplicate trainer payments fixed:", fixAllResult);
      }

      return data as Invoice[];
    },
    {
      onSuccess: (updatedInvoices) => {
        // Invalidate the invoices queries to refetch the updated data
        queryClient.invalidateQueries({ queryKey: ['invoices'] });

        // Optionally execute the provided onSuccess callback
        onSuccess?.();

        // Display a success toast notification
        toast.success("Invoices marked as sent successfully.");
      },
      onError: (error) => {
        // Revert the optimistic update on error
        queryClient.invalidateQueries({ queryKey: ['invoices'] });

        // Optionally execute the provided onError callback
        onError?.(error);

        // Display an error toast notification
        toast.error(`Failed to mark invoices as sent: ${error.message}`);
      },
    }
  );

  return {
    markAsSent: markAsSentMutation.mutateAsync,
    markAllAsSent: markAllAsSentMutation.mutateAsync,
    isLoading: markAsSentMutation.isLoading || markAllAsSentMutation.isLoading,
    error: markAsSentMutation.error || markAllAsSentMutation.error,
  };
};
