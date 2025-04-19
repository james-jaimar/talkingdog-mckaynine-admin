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
import { useClientsData } from "@/hooks/useClientsData";
import { CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useBranch } from "@/context/BranchContext";
import { DiscountFields } from "./discount/DiscountFields";

interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Update validation schema to include discount fields
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

export function InvoiceCreateDialog({ open, onOpenChange }: InvoiceCreateDialogProps) {
  const { generateInvoiceNumber, createInvoice } = useInvoices();
  const { clients, isLoading: clientsLoading } = useClientsData();
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const { currentBranch } = useBranch();
  
  // For debugging
  useEffect(() => {
    if (open && currentBranch) {
      console.log("InvoiceCreateDialog opened with branch:", currentBranch.name);
    }
  }, [open, currentBranch]);
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: "",
      invoice_number: "",
      status: "draft",
      issued_date: new Date(),
      due_date: addDays(new Date(), 30),
      notes: "",
      tax_rate: 0, // Default is set to 0%
      items: [
        { description: "", quantity: 1, unit_price: 0 }
      ],
      discount_type: 'fixed',
      discount_amount: 0,
      discount_reason: '',
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });
  
  // Generate invoice number on open
  useEffect(() => {
    if (open) {
      const fetchInvoiceNumber = async () => {
        setIsGeneratingNumber(true);
        try {
          console.log("Requesting invoice number generation with branch:", currentBranch?.name);
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
  }, [open, form, generateInvoiceNumber, currentBranch]);
  
  // Calculate total
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
    return calculateSubtotal() * (taxRate / 100);
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscount();
  };
  
  const onSubmit = (values: InvoiceFormValues) => {
    // Log the invoice creation request to help with debugging
    console.log("Creating invoice with these values:", values);
    
    // Check if any invoice items don't have booking associations
    const hasUnassociatedItems = values.items.some(item => !item.booking_id);
    if (hasUnassociatedItems) {
      console.log("Warning: Creating invoice with items that don't have booking associations");
    }
    
    createInvoice.mutate(values, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      }
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Update totals calculation */}
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
