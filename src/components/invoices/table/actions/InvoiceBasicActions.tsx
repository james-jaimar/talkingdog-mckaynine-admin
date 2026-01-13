import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Eye, Edit, Send } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateClassConfirmationEmail } from "@/lib/email/generateClassConfirmation";
import { toast } from "sonner";

interface InvoiceBasicActionsProps {
  invoice: Invoice;
  isPending: boolean;
  onCloseDropdown: () => void;
}

export function InvoiceBasicActions({ invoice, isPending, onCloseDropdown }: InvoiceBasicActionsProps) {
  const navigate = useNavigate();
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleView = () => {
    onCloseDropdown();
    console.log("Viewing invoice with ID:", invoice.id);
    navigate(`/invoices/${invoice.id}`);
  };

  const handleEdit = () => {
    onCloseDropdown();
    // Using the same URL structure as the view action for consistency
    navigate(`/invoices/${invoice.id}/edit`);
  };

  const handleSendClassConfirmation = async () => {
    onCloseDropdown();
    setIsSendingEmail(true);
    
    try {
      toast.info("Generating class confirmation email...");
      
      const emailData = await generateClassConfirmationEmail(invoice.id);
      
      if (!emailData) {
        toast.warning("No class bookings found on this invoice to send confirmation for");
        return;
      }
      
      const { error: queueError } = await supabase
        .from("email_queue")
        .insert({
          branch_id: emailData.branch_id,
          to_email: emailData.to_email,
          subject: emailData.subject,
          html_content: emailData.html_content,
          handler_id: emailData.handler_id,
          status: "pending",
        });

      if (queueError) {
        console.error("Error queueing confirmation email:", queueError);
        toast.error("Failed to queue confirmation email");
      } else {
        console.log("Class confirmation email queued for:", emailData.to_email);
        toast.success(`Class confirmation email queued for ${emailData.to_email}`);
      }
    } catch (error) {
      console.error("Error sending class confirmation:", error);
      toast.error("Failed to send class confirmation email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
      <DropdownMenuItem onClick={handleView} disabled={isPending}>
        <Eye className="mr-2 h-4 w-4" /> View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleEdit} disabled={isPending || invoice.status === 'paid'}>
        <Edit className="mr-2 h-4 w-4" /> Edit
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={handleSendClassConfirmation} 
        disabled={isPending || isSendingEmail}
      >
        <Send className="mr-2 h-4 w-4 text-blue-600" /> Send Class Confirmation
      </DropdownMenuItem>
    </>
  );
}
