
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceStatus } from "@/types/invoice";

interface CreateCustomInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

// Form schema
const customInvoiceSchema = z.object({
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().int().positive("Quantity must be a positive number"),
    unit_price: z.number().positive("Price must be a positive number"),
  })).min(1, "At least one item is required"),
  tax_rate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%"),
});

type FormValues = z.infer<typeof customInvoiceSchema>;

export function CreateCustomInvoice({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSuccess
}: CreateCustomInvoiceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createInvoice, generateInvoiceNumber } = useInvoices();

  const form = useForm<FormValues>({
    resolver: zodResolver(customInvoiceSchema),
    defaultValues: {
      notes: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
      tax_rate: 15, // Default tax rate
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (isSubmitting || !clientId) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();
      
      // Prepare invoice data
      const invoiceData = {
        client_id: clientId,
        invoice_number: invoiceNumber,
        status: "draft" as InvoiceStatus,
        issued_date: new Date(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        notes: values.notes || `Custom invoice for ${clientName}`,
        tax_rate: values.tax_rate,
        items: values.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
      };
      
      // Create invoice
      await createInvoice.mutateAsync(invoiceData);
      
      // Close dialog and refresh data
      onOpenChange(false);
      form.reset({
        notes: "",
        items: [{ description: "", quantity: 1, unit_price: 0 }],
        tax_rate: 15,
      });
      onSuccess();
      
    } catch (error) {
      console.error("Error creating custom invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a new invoice item to the form
  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [...currentItems, { description: "", quantity: 1, unit_price: 0 }]);
  };

  // Remove an invoice item from the form
  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length === 1) return; // Don't remove the last item
    form.setValue("items", currentItems.filter((_, i) => i !== index));
  };

  // Calculate the total amount
  const calculateTotal = () => {
    const items = form.getValues("items");
    const subtotal = items.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
    const taxRate = form.getValues("tax_rate") || 0;
    const tax = subtotal * (taxRate / 100);
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2)
    };
  };

  const { fields: itemFields } = form.control._formValues.items || [];
  const totals = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Invoice</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Client: {clientName}</h3>
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Invoice Items</h3>
                <Button type="button" size="sm" onClick={addItem} variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              {form.getValues("items").map((_, index) => (
                <div key={index} className="grid grid-cols-[1fr,100px,100px,40px] gap-2 items-end">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={index !== 0 ? "sr-only" : undefined}>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Item description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={index !== 0 ? "sr-only" : undefined}>Qty</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            step={1} 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
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
                      <FormItem className="space-y-1">
                        <FormLabel className={index !== 0 ? "sr-only" : undefined}>Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            step={0.01} 
                            placeholder="0.00"
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={form.getValues("items").length === 1}
                    className="h-8 w-8 p-0 self-end"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

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
                      step={0.01} 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      className="max-w-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(parseFloat(totals.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({form.getValues("tax_rate")}%)</span>
                <span>{formatCurrency(parseFloat(totals.tax))}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(parseFloat(totals.total))}</span>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
