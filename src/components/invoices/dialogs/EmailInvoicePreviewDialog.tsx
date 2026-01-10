import { useState, useEffect, useMemo } from "react";
import { Invoice } from "@/types/invoice";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useInvoices } from "@/hooks/useInvoices";
import { useMarkInvoiceAsSent } from "@/hooks/invoices/status";
import { useBranch } from "@/context/BranchContext";
import { 
  generateInvoiceEmailContent, 
  generatePreviewHtml,
  buildInvoiceEmailHtml
} from "@/lib/invoice-email-generator";
import { Mail, Eye, Edit, Send, Loader2 } from "lucide-react";
import { getBranchLogo } from "@/lib/branchLogo";

interface EmailInvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvoice: Invoice | null;
}

export function EmailInvoicePreviewDialog({
  open,
  onOpenChange,
  selectedInvoice
}: EmailInvoicePreviewDialogProps) {
  const { currentBranch } = useBranch();
  const { emailInvoice } = useInvoices();
  const markAsSent = useMarkInvoiceAsSent();
  
  const [emailRecipient, setEmailRecipient] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("edit");
  
  // Editable email content
  const [subject, setSubject] = useState("");
  const [greeting, setGreeting] = useState("");
  const [mainMessage, setMainMessage] = useState("");
  const [signOff, setSignOff] = useState("");
  const [showBankingDetails, setShowBankingDetails] = useState(true);
  
  // Derive client and branch info
  const clientName = selectedInvoice?.client 
    ? `${selectedInvoice.client.first_name} ${selectedInvoice.client.last_name}`
    : "Valued Customer";
  const branchName = currentBranch?.name || "McKaynine";
  const logoUrl = `https://mckaynine.talkingdog.co.za${getBranchLogo(branchName, 'jpg')}`;
  
  // Initialize form when invoice changes
  useEffect(() => {
    if (selectedInvoice && open) {
      const defaultContent = generateInvoiceEmailContent(
        selectedInvoice,
        clientName,
        branchName
      );
      
      setSubject(defaultContent.subject);
      setGreeting(defaultContent.greeting);
      setMainMessage(defaultContent.mainMessage);
      setSignOff(defaultContent.signOff);
      setShowBankingDetails(defaultContent.showBankingDetails);
      setEmailRecipient(selectedInvoice.client?.email || "");
      setActiveTab("edit");
    }
  }, [selectedInvoice, open, clientName, branchName]);
  
  // Generate preview HTML
  const previewHtml = useMemo(() => {
    if (!selectedInvoice) return "";
    
    const content = {
      subject,
      greeting,
      mainMessage,
      signOff,
      signature: branchName?.toLowerCase().includes("randburg") 
        ? { name: "Ady Hawkins", title: "McKaynine - Randburg", phone: "083 400 2987", company: "", email: "randburg@mckaynine.co.za", website: "www.mckaynine.co.za" }
        : { name: "Ady Hawkins", title: "McKaynine - Delta", phone: "083 400 2987", company: "", email: "delta@mckaynine.co.za", website: "www.mckaynine.co.za" },
      isPaid: selectedInvoice.status === 'paid',
      showBankingDetails,
    };
    
    return generatePreviewHtml(content, selectedInvoice, branchName, logoUrl);
  }, [selectedInvoice, subject, greeting, mainMessage, signOff, showBankingDetails, branchName, logoUrl]);
  
  const handleSendEmail = async () => {
    if (!selectedInvoice || !emailRecipient.trim()) {
      toast.error("Email address is required");
      return;
    }
    
    if (!emailRecipient.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Build the custom email HTML
      const content = {
        subject,
        greeting,
        mainMessage,
        signOff,
        signature: branchName?.toLowerCase().includes("randburg") 
          ? { name: "Ady Hawkins", title: "McKaynine - Randburg", phone: "083 400 2987", company: "", email: "randburg@mckaynine.co.za", website: "www.mckaynine.co.za" }
          : { name: "Ady Hawkins", title: "McKaynine - Delta", phone: "083 400 2987", company: "", email: "delta@mckaynine.co.za", website: "www.mckaynine.co.za" },
        isPaid: selectedInvoice.status === 'paid',
        showBankingDetails,
      };
      
      const customEmailHtml = buildInvoiceEmailHtml(content, selectedInvoice, branchName, logoUrl);
      
      console.log(`Sending invoice ${selectedInvoice.invoice_number} to ${emailRecipient}`);
      
      // Pass custom email content to the mutation
      await emailInvoice.mutateAsync({
        invoice: selectedInvoice,
        email: emailRecipient,
        customSubject: subject,
        customEmailHtml,
      });
      
      // Mark the invoice as sent after successful email
      if (selectedInvoice.status === 'draft') {
        try {
          await markAsSent.markAsSent(selectedInvoice);
          console.log(`Invoice ${selectedInvoice.invoice_number} marked as sent`);
        } catch (error) {
          console.error("Error marking invoice as sent:", error);
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Email sending failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isSubmitting && onOpenChange(open)}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice by Email
          </DialogTitle>
          <DialogDescription>
            Preview and customize the email before sending invoice #{selectedInvoice?.invoice_number}
          </DialogDescription>
        </DialogHeader>
        
        {/* Email recipient */}
        <div className="space-y-2 border-b pb-4">
          <div className="grid grid-cols-[100px_1fr] items-center gap-2">
            <Label htmlFor="email-to" className="text-right text-sm text-muted-foreground">
              To:
            </Label>
            <Input
              id="email-to"
              type="email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              placeholder="recipient@example.com"
              disabled={isSubmitting}
              className="h-9"
            />
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center gap-2">
            <Label htmlFor="email-subject" className="text-right text-sm text-muted-foreground">
              Subject:
            </Label>
            <Input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
              className="h-9"
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Message
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="greeting">Greeting</Label>
              <Input
                id="greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="main-message">Main Message</Label>
              <Textarea
                id="main-message"
                value={mainMessage}
                onChange={(e) => setMainMessage(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sign-off">Sign Off</Label>
              <Textarea
                id="sign-off"
                value={signOff}
                onChange={(e) => setSignOff(e.target.value)}
                disabled={isSubmitting}
                rows={2}
              />
            </div>
            
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="banking-toggle">Include Banking Details</Label>
                <p className="text-xs text-muted-foreground">
                  Show payment information for unpaid invoices
                </p>
              </div>
              <Switch
                id="banking-toggle"
                checked={showBankingDetails}
                onCheckedChange={setShowBankingDetails}
                disabled={isSubmitting}
              />
            </div>
            
            <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Note:</strong> The invoice PDF will be attached automatically. 
              The payment status message and signature are generated based on invoice status and branch.
            </p>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 min-h-0 mt-4">
            <div className="border rounded-lg h-full min-h-[400px] overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[400px] bg-white"
                title="Email Preview"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={isSubmitting || !emailRecipient.trim()}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Invoice
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
