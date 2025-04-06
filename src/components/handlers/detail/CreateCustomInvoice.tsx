
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceStatus } from "@/types/invoice";
import { InvoiceFormProvider, FormValues } from "@/components/invoices/custom-invoice/InvoiceFormProvider";
import { InvoiceNotes } from "@/components/invoices/custom-invoice/InvoiceNotes";
import { InvoiceItemList } from "@/components/invoices/custom-invoice/InvoiceItemList";
import { InvoiceTaxRate } from "@/components/invoices/custom-invoice/InvoiceTaxRate";
import { InvoiceTotalSummary } from "@/components/invoices/custom-invoice/InvoiceTotalSummary";
import { toast } from "sonner";

interface CreateCustomInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

export function CreateCustomInvoice({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSuccess
}: CreateCustomInvoiceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createInvoice, generateInvoiceNumber } = useInvoices();

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
      
      toast.success("Custom invoice created successfully");
      
      // Close dialog and refresh data
      onOpenChange(false);
      onSuccess();
      
    } catch (error) {
      console.error("Error creating custom invoice:", error);
      toast.error("Failed to create custom invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Invoice</DialogTitle>
        </DialogHeader>

        <InvoiceFormProvider onSubmit={onSubmit} defaultTaxRate={0}>
          <div>
            <h3 className="font-medium mb-2">Client: {clientName}</h3>
          </div>
          
          <InvoiceNotes />
          <InvoiceItemList />
          <InvoiceTaxRate />
          <InvoiceTotalSummary />

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
        </InvoiceFormProvider>
      </DialogContent>
    </Dialog>
  );
}
