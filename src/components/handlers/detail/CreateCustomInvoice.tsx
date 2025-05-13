import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceFormValues } from "@/types/invoice";
import { useInvoices } from "@/hooks/useInvoices";
import { useBookingsData } from "@/hooks/useBookingsData";
import { CalendarIcon, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CreateCustomInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

// Create zod schema for invoice validation
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

export function CreateCustomInvoice({ 
  open, 
  onOpenChange, 
  clientId, 
  clientName, 
  onSuccess 
}: CreateCustomInvoiceProps) {
  const { generateInvoiceNumber, createInvoice } = useInvoices();
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const { bookings, isLoading: isLoadingBookings } = useBookingsData(clientId);
  const [hasUnlinkedItems, setHasUnlinkedItems] = useState(false);
  
  // Create form with validation
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: clientId,
      invoice_number: "",
      status: "draft",
      issued_date: new Date(),
      due_date: addDays(new Date(), 30),
      notes: "",
      tax_rate: 0,
      items: [
        { description: "", quantity: 1, unit_price: 0, booking_id: null }
      ],
      discount_type: 'fixed',
      discount_amount: 0,
      discount_reason: '',
    }
  });
  
  // Field array for invoice items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });
  
  // Generate invoice number
  useEffect(() => {
    if (open) {
      const fetchInvoiceNumber = async () => {
        setIsGeneratingNumber(true);
        try {
          const number = await generateInvoiceNumber();
          form.setValue("invoice_number", number);
        } catch (error) {
          console.error("Error generating invoice number:", error);
        } finally {
          setIsGeneratingNumber(false);
        }
      };
      
      fetchInvoiceNumber();
    }
  }, [open, form, generateInvoiceNumber]);
  
  // Watch for unlinked items
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.items) {
        const unlinkedItems = value.items.some(item => !item.booking_id);
        setHasUnlinkedItems(unlinkedItems);
      }
    });
    
    // Return the unsubscribe function correctly
    return () => subscription.unsubscribe?.();
  }, [form.watch]);
  
  // Calculate total
  const getTotal = () => {
    const items = form.getValues("items");
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
    
    let discount = 0;
    const discountType = form.getValues("discount_type");
    const discountAmount = form.getValues("discount_amount");
    
    if (discountType === "percentage") {
      discount = subtotal * (discountAmount / 100);
    } else {
      discount = discountAmount;
    }
    
    const tax = (subtotal - discount) * (form.getValues("tax_rate") / 100);
    return (subtotal - discount + tax).toFixed(2);
  };
  
  // Handle form submission
  const onSubmit = async (values: InvoiceFormValues) => {
    createInvoice.mutate(values, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
        if (onSuccess) onSuccess();
      }
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Custom Invoice for {clientName}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Invoice Number */}
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} />
                        {isGeneratingNumber && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Unlinked items warning */}
            {hasUnlinkedItems && (
              <Alert variant="warning" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Unlinked Invoice Items</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Some invoice items don't have associated bookings. These will appear as "General Training Services" in financial reports.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Invoice Items */}
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
                      <div className="md:col-span-5">
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
                      
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price</FormLabel>
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
                      
                      {/* Add booking association field */}
                      <div className="md:col-span-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.booking_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Associated Booking</FormLabel>
                              <Select
                                value={field.value || ""}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select booking" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">No booking (not recommended)</SelectItem>
                                  {isLoadingBookings ? (
                                    <SelectItem value="" disabled>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Loading bookings...
                                    </SelectItem>
                                  ) : !bookings || bookings.length === 0 ? (
                                    <SelectItem value="" disabled>
                                      No bookings found
                                    </SelectItem>
                                  ) : (
                                    bookings.map((booking) => (
                                      <SelectItem key={booking.id} value={booking.id}>
                                        {booking.dogs?.name} - {booking.class_schedules?.classes?.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
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
                  onClick={() => append({ description: "", quantity: 1, unit_price: 0, booking_id: null })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Textarea rows={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Discount Type */}
              <FormField
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select discount type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Discount Amount */}
              <FormField
                control={form.control}
                name="discount_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.getValues("discount_type") === "percentage" ? "Discount (%)" : "Discount Amount"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={form.getValues("discount_type") === "percentage" ? 1 : 0.01}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Total */}
            <div className="ml-auto space-y-2 text-right">
              <div className="flex justify-end space-x-4">
                <span className="text-base font-bold">Total:</span>
                <span className="text-base font-bold">
                  ZAR {getTotal()}
                </span>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createInvoice.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createInvoice.isPending}>
                {createInvoice.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
