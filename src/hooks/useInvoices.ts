
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem, InvoiceFormValues } from "@/types/invoice";
import { toast } from "sonner";

export function useInvoices() {
  const queryClient = useQueryClient();

  // Get all invoices with client information
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id (id, first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as Invoice[];
    },
  });

  // Get single invoice with all details
  const fetchInvoiceDetails = async (invoiceId: string): Promise<Invoice> => {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients:client_id (id, first_name, last_name, email, phone)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select(`
        *,
        bookings:booking_id (
          id, 
          class_schedule_id,
          dogs:dog_id (
            id, 
            name
          )
        )
      `)
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (itemsError) throw itemsError;

    return {
      ...invoice,
      items: items as InvoiceItem[]
    } as Invoice;
  };
  
  // Get invoice by id
  const useInvoiceDetails = (invoiceId: string | undefined) => {
    return useQuery({
      queryKey: ['invoice', invoiceId],
      queryFn: () => fetchInvoiceDetails(invoiceId as string),
      enabled: !!invoiceId,
    });
  };

  // Create new invoice
  const createInvoice = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      try {
        // Calculate totals
        const subtotal = values.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const tax_amount = subtotal * (values.tax_rate / 100);
        const total = subtotal + tax_amount;

        // Insert invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            client_id: values.client_id,
            invoice_number: values.invoice_number,
            status: values.status,
            issued_date: values.issued_date.toISOString(),
            due_date: values.due_date.toISOString(),
            notes: values.notes || null,
            subtotal,
            tax_rate: values.tax_rate,
            tax_amount,
            total
          })
          .select('*')
          .single();

        if (invoiceError) {
          console.error("Error creating invoice:", invoiceError);
          throw invoiceError;
        }

        // Insert invoice items
        const itemsToInsert = values.items.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.quantity * item.unit_price,
          booking_id: item.booking_id || null
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Error creating invoice items:", itemsError);
          throw itemsError;
        }

        return invoice;
      } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success("Invoice created successfully");
    },
    onError: (error: any) => {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    },
  });

  // Update invoice
  const updateInvoice = useMutation({
    mutationFn: async ({ invoiceId, values }: { invoiceId: string, values: InvoiceFormValues }) => {
      // Calculate totals
      const subtotal = values.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const tax_amount = subtotal * (values.tax_rate / 100);
      const total = subtotal + tax_amount;

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          client_id: values.client_id,
          invoice_number: values.invoice_number,
          status: values.status,
          issued_date: values.issued_date.toISOString(),
          due_date: values.due_date.toISOString(),
          notes: values.notes || null,
          subtotal,
          tax_rate: values.tax_rate,
          tax_amount,
          total
        })
        .eq('id', invoiceId);

      if (invoiceError) throw invoiceError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (deleteError) throw deleteError;

      // Insert new items
      const itemsToInsert = values.items.map(item => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
        booking_id: item.booking_id || null
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      return { id: invoiceId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      toast.success("Invoice updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    },
  });

  // Delete invoice
  const deleteInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      return { id: invoiceId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    },
  });

  // Mark invoice as paid
  const markAsPaid = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_received: true,
          payment_date: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      return { id: invoiceId };
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      toast.success("Invoice marked as paid");
    },
    onError: (error: Error) => {
      console.error("Error marking invoice as paid:", error);
      toast.error("Failed to update invoice status");
    },
  });

  // Mark invoice as sent
  const markAsSent = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
          email_sent: true
        })
        .eq('id', invoiceId);

      if (error) throw error;

      return { id: invoiceId };
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      toast.success("Invoice marked as sent");
    },
    onError: (error: Error) => {
      console.error("Error marking invoice as sent:", error);
      toast.error("Failed to update invoice status");
    },
  });

  // Cancel invoice
  const cancelInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', invoiceId);

      if (error) throw error;

      return { id: invoiceId };
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      toast.success("Invoice cancelled");
    },
    onError: (error: Error) => {
      console.error("Error cancelling invoice:", error);
      toast.error("Failed to cancel invoice");
    },
  });

  // Get client invoices
  const useClientInvoices = (clientId: string | undefined) => {
    return useQuery({
      queryKey: ['client-invoices', clientId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data as Invoice[];
      },
      enabled: !!clientId,
    });
  };

  // Get invoices for current user (client)
  const useMyInvoices = () => {
    return useQuery({
      queryKey: ['my-invoices'],
      queryFn: async () => {
        // First get the current user's information
        const { data: authUser } = await supabase.auth.getUser();
        if (!authUser.user) throw new Error('Not authenticated');
        
        // Then find this user's client record by email
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', authUser.user.email)
          .maybeSingle(); // Changed from .single() to .maybeSingle() to handle the case when no client is found
        
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
      },
    });
  };

  // Generate invoice number
  const generateInvoiceNumber = async (): Promise<string> => {
    try {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error("Error generating invoice number:", error);
        return `INV-${new Date().getFullYear()}-0001`;
      }
      
      const nextNumber = (count || 0) + 1;
      const year = new Date().getFullYear();
      return `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      return `INV-${new Date().getFullYear()}-0001`;
    }
  };

  return {
    invoices,
    isLoading,
    useInvoiceDetails,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    markAsSent,
    cancelInvoice,
    useClientInvoices,
    useMyInvoices,
    generateInvoiceNumber
  };
}
