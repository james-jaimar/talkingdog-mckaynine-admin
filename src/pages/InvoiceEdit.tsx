import { useState, useEffect } from "react";
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
  const [isLoaded, setIsLoaded] = useState(false);
  const { useInvoiceDetails, updateInvoice } = useInvoices();
  const { clients, isLoading: clientsLoading } = useClientsData();
  const { data: invoice, isLoading, isError } = useInvoiceDetails(id);
  
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
    if (invoice && !isLoaded) {
      console.log("Initializing form with invoice data:", invoice);
      
      // Handle percentage discount correctly
      const discountAmount = 
        invoice.discount_type === 'percentage' && invoice.original_discount_percentage !== null
          ? invoice.original_discount_percentage 
          : invoice.discount_amount || 0;
      
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
        })) : [{ description: "", quantity: 1, unit_price: 0 }],
        discount_type: invoice.discount_type || 'fixed',
        discount_amount: discountAmount,
        discount_reason: invoice.discount_reason || ''
      });
      setIsLoaded(true);
    }
  }, [invoice, form, isLoaded]);
  
  // Calculate total with discount
  const calculateSubtotal = () => {
    const items = form.getValues("items");
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };
  
  const calculateDiscount = () => {
    const discountType = form.getValues("discount_type");
    const discountAmount = form.getValues("discount_amount");
    const subtotal = calculateSubtotal();

    if (discountType === "percentage") {
      return (subtotal * discountAmount) / 100;
    } else {
      return discountAmount;
    }
  };
  
  const calculateTax = () => {
    const taxRate = form.getValues("tax_rate");
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return (subtotal - discount) * (taxRate / 100);
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };
  
  const onSubmit = async (values: InvoiceFormValues) => {
    if (!id) {
      toast.error("Missing invoice ID");
      return;
    }
    
    console.log("Submitting form with values:", values);
    
    try {
      const result = await updateInvoice.mutateAsync({ 
        invoiceId: id, 
        values 
      });
      
      console.log("Update result:", result);
      
      if (result && result.success) {
        toast.success("Invoice updated successfully");
        navigate(`/invoices/${id}`);
      } else {
        toast.error("Failed to update invoice - please try again");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to update invoice due to an error");
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
                              clients?.map((client) => (
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
                                    <Input {...field} />
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
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                
                {/* Updated totals calculation with discount */}
                <div className="ml-auto space-y-2 text-right">
                  <div className="flex justify-end space-x-4">
                    <span className="text-sm">Subtotal:</span>
                    <span className="text-sm font-medium">ZAR {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  {form.watch("discount_amount") > 0 && (
                    <div className="flex justify-end space-x-4 text-red-600">
                      <span className="text-sm">
                        Discount {form.watch("discount_type") === "percentage" ? 
                          `(${form.watch("discount_amount")}%)` : 
                          "(ZAR)"}:
                      </span>
                      <span className="text-sm font-medium">
                        -ZAR {calculateDiscount().toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-end space-x-4">
                    <span className="text-sm">Tax ({form.watch("tax_rate")}%):</span>
                    <span className="text-sm font-medium">ZAR {calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <span className="text-base font-bold">Total:</span>
                    <span className="text-base font-bold">ZAR {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/invoices/${id}`)}
                    disabled={updateInvoice.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateInvoice.isPending}
                  >
                    {updateInvoice.isPending ? (
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
