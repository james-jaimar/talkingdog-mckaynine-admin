
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";
import { formatDate } from "date-fns";
import { EmailInvoicePreviewDialog } from "@/components/invoices/dialogs/EmailInvoicePreviewDialog";
import { EmailInvoiceProgressDialog } from "@/components/invoices/dialogs/EmailInvoiceProgressDialog";
import { toast } from "sonner";

interface ClientInfoCardProps {
  invoice: Invoice;
  onGeneratePDF: () => void;
}

export function ClientInfoCard({ invoice, onGeneratePDF }: ClientInfoCardProps) {
  const [emailProgressOpen, setEmailProgressOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [preparedPdfBase64, setPreparedPdfBase64] = useState<string | null>(null);

  const handleEmailInvoice = () => {
    setPreparedPdfBase64(null);
    setEmailProgressOpen(true);
  };

  const handlePdfReady = (pdfBase64: string) => {
    setPreparedPdfBase64(pdfBase64);
    setEmailProgressOpen(false);
    setEmailDialogOpen(true);
  };

  const handlePdfError = (error: string) => {
    setEmailProgressOpen(false);
    toast.error("Failed to prepare invoice PDF: " + error);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Invoice recipient details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.client ? (
            <>
              <div>
                <p className="font-medium text-base">
                  {invoice.client.first_name} {invoice.client.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
                {invoice.client.phone && (
                  <p className="text-sm text-muted-foreground">{invoice.client.phone}</p>
                )}
              </div>

              {(invoice.client.address || invoice.client.city || invoice.client.postal_code) && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium">Address</p>
                  {invoice.client.address && <p className="text-sm">{invoice.client.address}</p>}
                  {(invoice.client.city || invoice.client.postal_code) && (
                    <p className="text-sm">
                      {invoice.client.city}
                      {invoice.client.city && invoice.client.postal_code ? ", " : ""}
                      {invoice.client.postal_code}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No client information available</p>
          )}

          <div className="border-t pt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Status</span>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Issue Date</span>
              <span className="text-sm">{getFormattedDate(invoice.issued_date)}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Due Date</span>
              <span className="text-sm">{getFormattedDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t mt-2">
              <span className="text-sm font-medium">Total Due</span>
              <span className="text-sm font-bold">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 pt-0">
          <Button onClick={onGeneratePDF} className="w-full" variant="default">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={handleEmailInvoice} className="w-full" variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Send by Email
          </Button>
        </CardFooter>
      </Card>

      <EmailInvoiceProgressDialog
        open={emailProgressOpen}
        onOpenChange={setEmailProgressOpen}
        invoice={invoice}
        onReady={handlePdfReady}
        onError={handlePdfError}
      />

      <EmailInvoicePreviewDialog 
        open={emailDialogOpen} 
        onOpenChange={setEmailDialogOpen}
        selectedInvoice={invoice}
        preparedPdfBase64={preparedPdfBase64 || undefined}
      />
    </>
  );
}

function getFormattedDate(dateString: string) {
  try {
    return formatDate(new Date(dateString), "PPP");
  } catch (e) {
    return dateString;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-gray-400 text-gray-900",
  };

  return <Badge className={styles[status] || ""}>{status}</Badge>;
}
