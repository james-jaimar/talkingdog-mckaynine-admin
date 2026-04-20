
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInvoices } from "@/hooks/useInvoices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { useBranch } from "@/context/BranchContext";
import { useTerm } from "@/context/TermContext";
import { format } from "date-fns";

interface CreateCustomInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

const invoiceFormSchema = z.object({
  notes: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unit_price: z.number().min(0.01, "Price must be greater than 0"),
      io_inventory_code: z.string().optional(),
      booking_id: z.string().optional(),
    })
  ).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export function CreateCustomInvoice({ 
  open, 
  onOpenChange, 
  clientId,
  clientName,
  onSuccess 
}: CreateCustomInvoiceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { generateInvoiceNumber, createInvoice } = useInvoices();
  const { currentBranch } = useBranch();
  const { termData } = useTerm();

  // Fetch client's active bookings with class details
  const { data: clientBookings } = useQuery({
    queryKey: ['client-bookings-for-invoice', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          dog_id,
          class_schedule_id,
          dogs:dog_id (id, name),
          class_schedules:class_schedule_id (
            id,
            start_time,
            class_id,
            classes:class_id (
              id, name, class_type, io_inventory_code
            )
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'confirmed');

      if (error) throw error;
      return data;
    },
    enabled: open && !!clientId,
  });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    mode: "onChange",
    defaultValues: {
      notes: "",
      items: [
        { description: "", quantity: 1, unit_price: 0, io_inventory_code: "", booking_id: "" }
      ]
    }
  });

  const addItem = () => {
    const items = form.getValues("items") || [];
    form.setValue("items", [...items, { description: "", quantity: 1, unit_price: 0, io_inventory_code: "", booking_id: "" }]);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items") || [];
    if (items.length > 1) {
      form.setValue("items", items.filter((_, i) => i !== index));
    }
  };

  // Auto-link to the only active booking (if exactly one) when the dialog opens.
  // Top-up invoices on enrolled handlers were getting saved unlinked, landing as
  // "Unallocated" in the franchise report — pre-selecting makes the right path the default.
  useEffect(() => {
    if (!open || !clientBookings || clientBookings.length !== 1) return;
    const items = form.getValues("items") || [];
    if (items.length !== 1 || items[0].booking_id) return;
    handleBookingSelect(clientBookings[0].id, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientBookings]);

  const handleBookingSelect = (bookingId: string, index: number) => {
    if (bookingId === "none") {
      form.setValue(`items.${index}.booking_id`, "");
      return;
    }
    
    form.setValue(`items.${index}.booking_id`, bookingId);
    
    // Auto-fill IO inventory code from the class
    const booking = clientBookings?.find(b => b.id === bookingId);
    if (booking) {
      const schedule = booking.class_schedules as any;
      const cls = schedule?.classes;
      if (cls?.io_inventory_code) {
        form.setValue(`items.${index}.io_inventory_code`, cls.io_inventory_code);
      }
    }
  };

  const getBookingLabel = (booking: any): string => {
    const schedule = booking.class_schedules as any;
    const cls = schedule?.classes;
    const dog = booking.dogs as any;
    const time = schedule?.start_time ? format(new Date(schedule.start_time), "HH:mm") : "";
    const className = cls?.name || cls?.class_type || "Unknown class";
    const dogName = dog?.name || "";
    return `${time} ${className}${dogName ? ` - ${dogName}` : ""}`;
  };

  const handleCreateInvoice = async (values: InvoiceFormValues) => {
    try {
      setIsSubmitting(true);
      
      const invoiceNumber = await generateInvoiceNumber();
      
      const subtotal = values.items.reduce(
        (sum, item) => sum + (item.quantity * item.unit_price),
        0
      );

      const invoiceData = {
        client_id: clientId,
        invoice_number: invoiceNumber,
        status: "draft",
        issued_date: new Date(),
        due_date: new Date(),
        notes: values.notes || `Custom invoice for ${clientName}`,
        tax_rate: 0,
        discount_type: "fixed" as const,
        discount_amount: 0,
        discount_reason: "",
        subtotal,
        total: subtotal,
        items: values.items.map(item => ({
          ...item,
          booking_id: item.booking_id || undefined,
        })),
        branch_id: currentBranch?.id || null,
        term_id: termData?.id || null,
      };
      
      console.log("Creating custom invoice with data:", invoiceData);
      
      await createInvoice.mutateAsync(invoiceData);
      
      toast.success("Custom invoice created successfully");
      form.reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error creating custom invoice:", error);
      
      if (error instanceof Error) {
        toast.error(`Failed to create invoice: ${error.message}`);
      } else {
        toast.error("Failed to create invoice");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Custom Invoice for {clientName}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateInvoice)} className="space-y-6">
            {/* Invoice Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Invoice Items</h3>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={addItem}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              {form.watch("items")?.map((_, index) => (
                <div key={index} className="space-y-3 p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {form.watch("items")?.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  {/* Link to Class booking */}
                  {clientBookings && clientBookings.length > 0 && (
                    <FormField
                      control={form.control}
                      name={`items.${index}.booking_id`}
                      render={({ field }) => {
                        const isUnlinked = !field.value;
                        return (
                          <FormItem>
                            <FormLabel>
                              Link to Class booking{" "}
                              <span className="text-muted-foreground font-normal">
                                — recommended for top-ups so revenue attributes correctly
                              </span>
                            </FormLabel>
                            <Select
                              value={field.value || "none"}
                              onValueChange={(val) => handleBookingSelect(val, index)}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={
                                    isUnlinked
                                      ? "border-destructive/50 bg-destructive/5"
                                      : ""
                                  }
                                >
                                  <SelectValue placeholder="Select a class booking" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No link (general billing)</SelectItem>
                                {clientBookings.map((booking) => (
                                  <SelectItem key={booking.id} value={booking.id}>
                                    {getBookingLabel(booking)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isUnlinked && (
                              <p className="text-xs text-destructive">
                                This invoice will appear as "Unallocated" in the franchise
                                report and earn 0% trainer commission. Pick a booking unless
                                this is genuinely non-class billing (merch, fees, etc.).
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}
                  
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
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field}
                             onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price (ZAR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name={`items.${index}.io_inventory_code`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IO Inventory Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. PUP, BN, EN" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Invoice Summary */}
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">
                Subtotal: ZAR {form.watch("items")?.reduce(
                  (sum, item) => sum + (item.quantity * item.unit_price), 0
                ).toFixed(2)}
              </div>
              <div className="font-bold">
                Total: ZAR {form.watch("items")?.reduce(
                  (sum, item) => sum + (item.quantity * item.unit_price), 0
                ).toFixed(2)}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
