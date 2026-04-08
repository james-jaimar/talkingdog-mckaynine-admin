import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useInvoices } from "@/hooks/useInvoices";
import { useClientsData } from "@/hooks/useClientsData";
import { InvoiceFormValues } from "@/types/invoice";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2, CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DiscountFields } from "@/components/invoices/discount/DiscountFields";
import { calculateInvoiceTotals } from "@/lib/invoiceMath";

// Validation schema updated to include discount fields
const invoiceSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  issued_date: z.date(),
  due_date: z.date(),
  notes: z.string().optional(),
  tax_rate: z.number().min(0).max(100),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit_price: z.number().min(0, "Unit price can't be negative"),
    booking_id: z.string().optional().nullable(),
  })).min(1, "At least one item is required"),
  discount_type: z.enum(['fixed', 'percentage']),
  discount_amount: z.number().min(0),
  discount_reason: z.string().optional(),
});

export default function InvoiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { useInvoiceDetails, updateInvoice } = useInvoices();
  const { clients, isLoading: clientsLoading } = useClientsData();
  const { data: invoice, isLoading, isError, error } = useInvoiceDetails(id);

  // Build the linked client from the invoice's joined data (primary source)
  const linkedClient = useMemo(() => {
    const c = (invoice as any)?.client || (invoice as any)?.clients;
    if (c?.id) return c;
    return null;
  }, [invoice]);

  // Fallback: direct fetch if joined client data is missing
  const { data: fetchedClient } = useQuery({
    queryKey: ['client', invoice?.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, address, city, postal_code, branch_id, notes, created_at, updated_at')
        .eq('id', invoice!.client_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!invoice?.client_id && !linkedClient,
  });

  const invoiceClient = linkedClient || fetchedClient;

  // Merge and dedupe: invoice client + bulk list
  const allClients = useMemo(() => {
    const list = clients || [];
    if (invoiceClient && !list.find((c: any) => c.id === invoiceClient.id)) {
      return [invoiceClient, ...list];
    }
    return list;
  }, [clients, invoiceClient]);

  // Helper to format client name safely
  const formatClientName = (c: any) => [c?.first_name, c?.last_name].filter(Boolean).join(" ").trim() || "Unknown";
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: "",
      invoice_number: "",
      status: "draft",
      issued_date: new Date(),
      due_date: new Date(),
      notes: "",
      tax_rate: 0,
      items: [{ description: "", quantity: 1, unit_price: 0 }],
      discount_type: 'fixed',
      discount_amount: 0,
      discount_reason: ''
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });
  
  // Initialize form with invoice data
  useEffect(() => {
    if (invoice) {
      console.log("Initializing form with invoice data:", invoice);
      
      let discountAmount = Number(invoice.discount_amount || 0);
      if (invoice.discount_type === 'percentage') {
        const original = invoice.original_discount_amount;
        if (original !== null && original !== undefined) {
          discountAmount = Number(original || 0);
        } else {
          if (discountAmount > 100 && invoice.subtotal > 0) {
            discountAmount = (discountAmount / invoice.subtotal) * 100;
          }
          discountAmount = Math.min(Math.max(discountAmount, 0), 100);
        }
      }
      form.reset({
        client_id: invoice.client_id,
        invoice_number: invoice.invoice_number,
        status: invoice.status as any,
        issued_date: new Date(invoice.issued_date),
        due_date: new Date(invoice.due_date),
        notes: invoice.notes || "",
        tax_rate: invoice.tax_rate,
        items: invoice.items?.length ? invoice.items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          booking_id: item.booking_id
        })) : [{ description: "Invoice item", quantity: 1, unit_price: 0 }],
        discount_type: invoice.discount_type || 'fixed',
        discount_amount: discountAmount,
        discount_reason: invoice.discount_reason || ''
      });
    }
  }, [invoice?.id]);
  
  // Use central invoice summary function
  const getSummary = () => {
    const values = form.getValues();
    return calculateInvoiceTotals({
      items: values.items,
      discountType: values.discount_type,
      discountAmount: values.discount_amount,
      taxRate: values.tax_rate,
    });
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    if (!id) {
      toast.error("Missing invoice ID");
      return;
    }
    
    console.log("Submitting form with values:", values);
    setIsSubmitting(true);
    
    try {
      // Ensure all items have valid values
      const validItems = values.items.map(item => ({
        ...item,
        description: item.description || "Invoice item",
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0
      }));
      
      const result = await updateInvoice.mutateAsync({ 
        invoiceId: id, 
        values: {
          ...values,
          items: validItems
        } 
      });
      
      console.log("Update result:", result);
      
      if (result && result.success) {
        toast.success("Invoice updated successfully");
        navigate(`/invoices/${id}`);
      } else {
        toast.error("Failed to update invoice - please try again");
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to update invoice due to an error");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading invoice...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (isError || !invoice) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Error Loading Invoice</h1>
            <p className="mt-2">The requested invoice could not be found or you don't have permission to view it.</p>
            {error && (
              <p className="text-sm text-red-500 mt-2">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
            )}
            <Button 
              onClick={() => navigate('/invoices')} 
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <Helmet>
        <title>{`Edit Invoice ${invoice?.invoice_number || ''} - McKaynine Training Centre`}</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/invoices/${id}`)} 
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Edit Invoice {invoice?.invoice_number}</h1>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Edit Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client Selection */}
                  <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientsLoading ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading clients...</span>
                              </div>
                            ) : (
                              allClients?.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.first_name} {client.last_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Invoice Number */}
                  <FormField
                    control={form.control}
                    name="invoice_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Issue Date */}
                  <FormField
                    control={form.control}
                    name="issued_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Issue Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Due Date */}
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Items</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex flex-col space-y-3 p-4 border rounded-md bg-gray-50">
                        <div className="flex justify-between">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          {fields.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => remove(index)}
                              className="h-8 w-8 p-0 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-6">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      step={1}
                                      {...field}
                                      value={field.value || 1}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="md:col-span-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unit_price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit Price (ZAR)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      {...field}
                                      value={field.value || 0}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                  </div>
                </div>
                
                {/* Add Discount section before totals */}
                <div className="mt-6 mb-4">
                  <h3 className="text-lg font-medium mb-4">Discount</h3>
                  <DiscountFields form={form} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Tax Rate */}
                  <FormField
                    control={form.control}
                    name="tax_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="ml-auto space-y-2 text-right">
                  <div className="flex justify-end space-x-4">
                    <span className="text-sm">Subtotal:</span>
                    <span className="text-sm font-medium">
                      ZAR {getSummary().subtotal.toFixed(2)}
                    </span>
                  </div>
                  {getSummary().monetaryDiscount > 0 && (
                    <div className="flex justify-end space-x-4 text-red-600">
                      <span className="text-sm">
                        Discount {getSummary().discountType === "percentage"
                          ? `(${getSummary().discountAmount}%)`
                          : "(ZAR)"}:
                      </span>
                      <span className="text-sm font-medium">
                        -ZAR {getSummary().monetaryDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-end space-x-4">
                    <span className="text-sm">Tax ({getSummary().taxRate}%):</span>
                    <span className="text-sm font-medium">
                      ZAR {getSummary().tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <span className="text-base font-bold">Total:</span>
                    <span className="text-base font-bold">
                      ZAR {getSummary().total.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/invoices/${id}`)}
                    disabled={isSubmitting || updateInvoice.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || updateInvoice.isPending}
                  >
                    {isSubmitting || updateInvoice.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
