
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Download, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface PaymentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    trainer_name: string;
    payment_date: string;
    amount: number;
    payment_method: string;
    transaction_id?: string;
    document_url?: string;
    document_name?: string;
    notes?: string;
  } | null;
}

export function PaymentDetailsDialog({ open, onOpenChange, payment }: PaymentDetailsDialogProps) {
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  
  // Reset loading state when the dialog opens or payment changes
  useEffect(() => {
    if (open && payment?.document_url) {
      setIsLoadingPdf(true);
    } else {
      setIsLoadingPdf(false);
    }
  }, [open, payment]);
  
  const formatPaymentMethod = (method?: string) => {
    if (!method) return 'Unknown';
    
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'cash': return 'Cash';
      case 'check': return 'Check';
      default: return method;
    }
  };
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };
  
  const handleDownloadPdf = () => {
    if (payment?.document_url) {
      const link = document.createElement('a');
      link.href = payment.document_url;
      link.download = payment.document_name || 'trainer-payment.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Trainer</h3>
              <p className="font-medium">{payment.trainer_name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
              <p>{formatDate(payment.payment_date)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
              <p className="font-medium">{formatCurrency(payment.amount)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
              <p>{formatPaymentMethod(payment.payment_method)}</p>
            </div>
            
            {payment.transaction_id && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Transaction ID</h3>
                <p className="font-mono text-sm">{payment.transaction_id}</p>
              </div>
            )}
          </div>
          
          {payment.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{payment.notes}</p>
            </div>
          )}
          
          {payment.document_url && (
            <div className="pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Payment Document</h3>
              
              <div className="flex flex-col space-y-3 items-center">
                <div className="border rounded-lg overflow-hidden w-full aspect-[1/1.4] bg-muted/30 relative">
                  {isLoadingPdf && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  
                  <iframe 
                    src={payment.document_url} 
                    className="w-full h-full" 
                    title="Payment Document"
                    onLoad={() => setIsLoadingPdf(false)}
                    onError={() => setIsLoadingPdf(false)}
                  />
                </div>
                
                <div className="flex space-x-2 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => window.open(payment.document_url, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="gap-2"
                    onClick={handleDownloadPdf}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
