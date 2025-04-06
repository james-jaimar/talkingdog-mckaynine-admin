
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "./types";
import { toast } from "sonner";

// Get all invoices with client information
export function useInvoicesList() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id (id, first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching invoices:", error);
        throw error;
      }
      
      return data as Invoice[];
    },
  });
}

// Get invoice by id with all details
export function useInvoiceDetails(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      try {
        if (!invoiceId) {
          throw new Error("Invoice ID is required");
        }

        console.log("Fetching invoice details for:", invoiceId);

        // First get the invoice data with client information
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            clients:client_id (id, first_name, last_name, email, phone, address, city, postal_code)
          `)
          .eq('id', invoiceId)
          .single();

        if (invoiceError) {
          console.error("Error fetching invoice:", invoiceError);
          toast.error("Could not retrieve invoice details");
          throw invoiceError;
        }

        if (!invoice) {
          toast.error("Invoice not found");
          throw new Error("Invoice not found");
        }

        console.log("Fetched invoice data:", invoice);
        
        // Then get the invoice items with booking details
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select(`
            *,
            bookings:booking_id (
              id, 
              class_schedule_id,
              dogs:dog_id (
                id, 
                name,
                breed
              ),
              class_schedules:class_schedule_id (
                id,
                start_time,
                classes:class_id (
                  id,
                  name,
                  description,
                  price
                )
              )
            )
          `)
          .eq('invoice_id', invoiceId)
          .order('created_at', { ascending: true });

        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
          // Continue with empty items rather than failing completely
          return {
            ...invoice,
            items: []
          } as Invoice;
        }

        console.log("Fetched invoice items:", itemsData);

        // Process the items to improve the description with class and dog details
        const processedItems = itemsData?.map(item => {
          let enhancedItem = { ...item };
          
          // If this item is linked to a booking with class details
          if (item.bookings?.class_schedules?.classes) {
            const classData = item.bookings.class_schedules.classes;
            const dogData = item.bookings.dogs;
            
            // If no description was provided, create one using the class data
            if (!item.description || item.description === 'Class booking') {
              enhancedItem.description = `${classData.name} - ${dogData?.name || 'Unknown dog'}`;
            }
            
            // If price wasn't set correctly, use the class price
            if (item.unit_price === 0 && classData.price) {
              enhancedItem.unit_price = classData.price;
              enhancedItem.amount = classData.price * item.quantity;
            }
          }
          
          return enhancedItem;
        }) || [];

        return {
          ...invoice,
          items: processedItems
        } as Invoice;
      } catch (error) {
        console.error("Error in useInvoiceDetails:", error);
        throw error;
      }
    },
    enabled: !!invoiceId,
    retry: 1, // Only retry once to prevent excessive errors
  });
}

// Get client invoices
export function useClientInvoices(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-invoices', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching client invoices:", error);
        throw error;
      }
      
      return data as Invoice[];
    },
    enabled: !!clientId,
  });
}

// Get invoices for current user (client)
export function useMyInvoices() {
  return useQuery({
    queryKey: ['my-invoices'],
    queryFn: async () => {
      try {
        // First get the current user's information
        const { data: authUser } = await supabase.auth.getUser();
        if (!authUser.user) throw new Error('Not authenticated');
        
        // Then find this user's client record by email
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', authUser.user.email)
          .maybeSingle(); // Use maybeSingle() to prevent errors if no result
        
        if (clientError) throw clientError;
        if (!clientData) throw new Error('No client record found for this user');
        
        // Then get the client's invoices
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            items:invoice_items(*)
          `)
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data as Invoice[];
      } catch (error) {
        console.error("Error fetching client invoices:", error);
        throw error;
      }
    },
  });
}
