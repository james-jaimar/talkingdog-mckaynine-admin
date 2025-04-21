
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInvoice } from "@/lib/invoices/createInvoiceUtils";

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['client-invoices'] });
    },
  });
}
