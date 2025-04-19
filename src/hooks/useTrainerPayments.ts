
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "react-toastify";

export function useTrainerPayments(branchId: string | undefined) {
  return useQuery({
    queryKey: ['trainers', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      
      try {
        const { data, error } = await supabase
          .from('trainers')
          .select(`
            id,
            first_name,
            last_name,
            invoices:invoice_items(
              id,
              amount,
              invoice:invoices(status, payment_date)
            )
          `)
          .eq('branch_id', branchId);
        
        if (error) {
          console.error("Error fetching trainer data:", error);
          toast.error("Error loading trainer payment data");
          return [];
        }
        
        if (!data || !Array.isArray(data)) {
          console.error("No trainer data returned or invalid format");
          return [];
        }
        
        return data.map(trainer => {
          const invoiceItems = Array.isArray(trainer.invoices) ? trainer.invoices : [];
          const totalEarned = invoiceItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
          const paidInvoices = invoiceItems.filter((item: any) => item.invoice?.status === 'paid');
          const paidAmount = paidInvoices.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
          
          let lastPaymentDate = null;
          if (paidInvoices.length > 0) {
            const paymentDates = paidInvoices
              .map((item: any) => item.invoice?.payment_date ? new Date(item.invoice.payment_date).getTime() : 0)
              .filter((timestamp: number) => timestamp > 0);
              
            if (paymentDates.length > 0) {
              lastPaymentDate = new Date(Math.max(...paymentDates)).toISOString();
            }
          }

          return {
            id: trainer.id,
            trainerName: `${trainer.first_name} ${trainer.last_name}`,
            totalEarned,
            paid: paidAmount,
            pending: totalEarned - paidAmount,
            invoicesCount: invoiceItems.length,
            lastPaymentDate: lastPaymentDate || undefined
          };
        });
      } catch (err) {
        console.error("Failed to process trainer data:", err);
        toast.error("Error processing trainer payment data");
        return [];
      }
    },
    enabled: !!branchId
  });
}
