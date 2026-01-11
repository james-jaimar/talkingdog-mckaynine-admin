
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "../types";
import { handleQueryError } from "./useQueryUtils";
import { useBranch } from "@/context/BranchContext";

/**
 * Hook to fetch all invoices with client information
 */
export function useInvoicesList() {
  // Access current branch for filtering
  const { currentBranch } = useBranch();
  const branchId = currentBranch?.id;
  
  return useQuery({
    queryKey: ['invoices', branchId], // Include branchId in the query key for proper cache invalidation
    queryFn: async () => {
      console.log("Fetching invoices filtered by branch:", currentBranch?.name);
      
      try {
        // First, fetch invoices with client data, filtered by branch
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            *,
            clients!inner (*, branch_id)
          `)
          .eq('clients.branch_id', branchId)
          .order('created_at', { ascending: false });

        if (invoicesError) {
          console.error("Error fetching invoices basic data:", invoicesError);
          return handleQueryError(invoicesError, "Error fetching invoices");
        }
        
        console.log(`Retrieved ${invoicesData?.length || 0} invoices for branch ${currentBranch?.name}`);
        
        if (!invoicesData || invoicesData.length === 0) {
          return [];
        }


        // Batch-fetch invoice items and booking details to avoid N+1 requests
        const invoiceIds = invoicesData.map((inv) => inv.id);

        const chunk = <T,>(arr: T[], size: number): T[][] => {
          const res: T[][] = [];
          for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
          return res;
        };

        // 1) Fetch all invoice items for all invoices
        const allInvoiceItems: any[] = [];
        for (const ids of chunk(invoiceIds, 200)) {
          const { data, error } = await supabase
            .from('invoice_items')
            .select('*')
            .in('invoice_id', ids);

          if (error) {
            console.error('Error fetching invoice items batch:', error);
            throw error;
          }

          allInvoiceItems.push(...(data || []));
        }

        // 2) Fetch all bookings needed by those items (single/few batched queries)
        const bookingIds = Array.from(
          new Set(allInvoiceItems.map((it) => it.booking_id).filter(Boolean))
        ) as string[];

        const bookingsById = new Map<string, any>();
        for (const ids of chunk(bookingIds, 200)) {
          const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select(`
              id,
              dog_id,
              dogs (id, name, breed),
              class_schedule_id,
              class_schedules (
                id,
                start_time,
                class_id,
                classes (id, name, description, course_fee)
              )
            `)
            .in('id', ids);

          if (bookingError) {
            console.warn('Issue fetching bookings batch:', bookingError);
            continue;
          }

          (bookings || []).forEach((b) => bookingsById.set(b.id, b));
        }

        // 3) Group items by invoice_id
        const itemsByInvoiceId = new Map<string, any[]>();
        allInvoiceItems.forEach((item) => {
          const existing = itemsByInvoiceId.get(item.invoice_id) || [];
          existing.push(item);
          itemsByInvoiceId.set(item.invoice_id, existing);
        });

        // 4) Build invoices with enhanced items
        const invoicesWithItems = invoicesData.map((invoice) => {
          const items = itemsByInvoiceId.get(invoice.id) || [];

          const enhancedItems = (items || []).map((item) => {
            const enhancedItem: Partial<InvoiceItem> = {
              id: item.id,
              invoice_id: item.invoice_id,
              description: item.description || "Training services",
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.amount,
              booking_id: item.booking_id,
              item_type: item.item_type,
            };

            if (!item.booking_id) {
              return enhancedItem as InvoiceItem;
            }

            const booking = bookingsById.get(item.booking_id);
            if (!booking) {
              return enhancedItem as InvoiceItem;
            }

            if (booking.dogs && booking.class_schedules?.classes) {
              const dogName = booking.dogs.name;
              const className = booking.class_schedules.classes.name;
              const classDescription = booking.class_schedules.classes.description;
              const classPrice = booking.class_schedules.classes.course_fee;

              enhancedItem.description = `${className} - ${dogName}`;

              if (!enhancedItem.unit_price || enhancedItem.unit_price === 0) {
                enhancedItem.unit_price = classPrice;
                enhancedItem.amount = classPrice * item.quantity;
              }

              enhancedItem.bookings = {
                id: booking.id,
                dogs: {
                  name: dogName,
                  breed: booking.dogs.breed || 'Unknown',
                },
                class_schedules: {
                  id: booking.class_schedules.id,
                  start_time: booking.class_schedules.start_time || new Date().toISOString(),
                  class_id: booking.class_schedules.class_id,
                  classes: {
                    id: booking.class_schedules.classes.id,
                    name: className,
                    price: classPrice || 0,
                    description: classDescription || '',
                  },
                },
              };
            }

            return enhancedItem as InvoiceItem;
          });

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
            client: invoice.clients || null,
            items: enhancedItems,
            classInfo,
            dogInfo,
          };
        });


        // Return as Invoice array with type assertion to satisfy TypeScript
        return invoicesWithItems as unknown as Invoice[];
        
      } catch (error) {
        console.error("Unexpected error in useInvoicesList:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!branchId, // Only run query when branch is selected
  });
}
