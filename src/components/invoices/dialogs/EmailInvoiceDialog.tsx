
import { useState, useEffect } from "react";
import { Invoice } from "@/types/invoice";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useInvoices } from "@/hooks/useInvoices";

interface EmailInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvoice: Invoice | null;
}

export function EmailInvoiceDialog({
  open,
  onOpenChange,
  selectedInvoice
}: EmailInvoiceDialogProps) {
  const [emailRecipient, setEmailRecipient] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { emailInvoice, useMarkInvoiceAsSent } = useInvoices();
  const markAsSent = useMarkInvoiceAsSent();
  
  // Update email recipient when selected invoice changes
  useEffect(() => {
    if (selectedInvoice?.client?.email) {
      setEmailRecipient(selectedInvoice.client.email);
    } else {
      setEmailRecipient("");
    }
  }, [selectedInvoice]);

  const confirmSendEmail = async () => {
    if (!selectedInvoice || !emailRecipient.trim()) {
      toast.error("Email address is required");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log(`Sending invoice ${selectedInvoice.invoice_number} to ${emailRecipient}`);
      
      await emailInvoice.mutateAsync({
        invoice: selectedInvoice,
        email: emailRecipient
      });
      
      // Mark the invoice as sent after successful email
      if (selectedInvoice.status === 'draft') {
        try {
          await markAsSent.mutateAsync(selectedInvoice.id);
          console.log(`Invoice ${selectedInvoice.invoice_number} marked as sent`);
        } catch (error) {
          console.error("Error marking invoice as sent:", error);
          // Don't show an error as the email was successfully sent
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Email sending failed:", error);
      // Error is already handled in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isSubmitting && onOpenChange(open)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Invoice by Email</DialogTitle>
          <DialogDescription>
            Send invoice #{selectedInvoice?.invoice_number} to the recipient's email address.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-right">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              placeholder="recipient@example.com"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" onClick={confirmSendEmail} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
