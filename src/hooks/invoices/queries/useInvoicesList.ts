
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "../types";
import { useBranch } from "@/context/BranchContext";

/**
 * Hook to fetch all invoices with client and items using the server-side RPC
 */
export function useInvoicesList() {
  const { currentBranch } = useBranch();
  const branchId = currentBranch?.id;

  return useQuery({
    queryKey: ['invoices', branchId],
    queryFn: async () => {
      console.log("Fetching invoices via RPC for branch:", currentBranch?.name);

      if (!branchId) return [];

      try {
        // Use the server-side RPC that performs all joins in one query
        const { data, error } = await supabase.rpc('get_invoices_with_items', {
          p_branch_id: branchId
        });

        if (error) {
          console.error("Error calling get_invoices_with_items RPC:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.log("No invoices found for branch");
          return [];
        }

        console.log(`Retrieved ${data.length} invoices via RPC`);

        // Transform the RPC response into the Invoice format expected by the app
        const invoices: Invoice[] = data.map((row: any) => {
          const invoice = row.invoice as any;
          const client = row.client as any;
          const items = (row.items as any[]) || [];

          // Transform items to match InvoiceItem interface
          const enhancedItems: InvoiceItem[] = items.map((item: any) => ({
            id: item.id,
            invoice_id: item.invoice_id,
            booking_id: item.booking_id,
            description: item.description || "Training services",
            quantity: item.quantity || 1,
            unit_price: item.unit_price || item.amount || 0,
            amount: item.amount || 0,
            item_type: item.item_type,
            bookings: item.bookings ? {
              id: item.bookings.id,
              dogs: item.bookings.dogs ? {
                name: item.bookings.dogs.name,
                breed: item.bookings.dogs.breed || 'Unknown'
              } : undefined,
              class_schedules: item.bookings.class_schedules ? {
                id: item.bookings.class_schedules.id,
                start_time: item.bookings.class_schedules.start_time || new Date().toISOString(),
                class_id: item.bookings.class_schedules.class_id,
                classes: item.bookings.class_schedules.classes ? {
                  id: item.bookings.class_schedules.classes.id,
                  name: item.bookings.class_schedules.classes.name,
                  price: item.bookings.class_schedules.classes.price || 0,
                  description: item.bookings.class_schedules.classes.description || ''
                } : undefined
              } : undefined
            } : undefined
          }));

          // Extract class and dog info for summary
          let classInfo: string | null = null;
          let dogInfo: string | null = null;

          for (const item of enhancedItems) {
            if (item.bookings) {
              if (!dogInfo && item.bookings.dogs?.name) {
                dogInfo = item.bookings.dogs.name;
              }
              if (!classInfo && item.bookings.class_schedules?.classes?.name) {
                classInfo = item.bookings.class_schedules.classes.name;
              }
              if (dogInfo && classInfo) break;
            }
          }

          return {
            ...invoice,
            client: client || null,
            items: enhancedItems,
            classInfo,
            dogInfo
          } as Invoice;
        });

        return invoices;

      } catch (error) {
        console.error("Unexpected error in useInvoicesList:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!branchId,
  });
}
