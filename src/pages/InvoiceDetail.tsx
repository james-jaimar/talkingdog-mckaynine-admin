
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useInvoiceDetails } from "@/hooks/invoices/useInvoiceQueries";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/components/invoices/pdf/InvoicePDFGenerator";
import { fetchIOPDF, getIOOfflineModeFromDB } from "@/hooks/invoices/useIOSync";
import { InvoiceDetailHeader } from "@/components/invoices/detail/InvoiceDetailHeader";
import { InvoiceLoadingState } from "@/components/invoices/detail/InvoiceLoadingState";
import { InvoiceNotFound } from "@/components/invoices/detail/InvoiceNotFound";
import { InvoiceDetailsPanel } from "@/components/invoices/detail/InvoiceDetailsPanel";
import { ClientInfoCard } from "@/components/invoices/detail/ClientInfoCard";
import { InvoiceError } from "@/components/invoices/detail/InvoiceError";
import { InvoiceMissingIdError } from "@/components/invoices/detail/InvoiceMissingIdError";

export default function InvoiceDetail() {
  // Using id instead of invoiceId to match the parameter name in the route
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Updated to use id instead of invoiceId
  const { data: invoice, isLoading, error, isError } = useInvoiceDetails(id);

  useEffect(() => {
    if (!id) {
      navigate('/invoices');
    }
  }, [id, navigate]);

  const handleGeneratePDF = async () => {
    if (!invoice) return;
    
    try {
      // Check if invoice is synced to IO and offline mode is not enabled
      const isOfflineMode = await getIOOfflineModeFromDB();
      
      if (invoice.io_invoice_url && !isOfflineMode) {
        toast.info("Fetching invoice from InvoicesOnline...");
        const result = await fetchIOPDF(invoice.id);
        
        if (result.success && result.pdfBase64) {
          // Convert base64 to blob and trigger download
          const byteCharacters = atob(result.pdfBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `invoice-${invoice.invoice_number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          
          toast.success("Invoice PDF downloaded");
          return;
        } else {
          console.warn("IO PDF fetch failed, falling back to local:", result.error);
        }
      }
      
      // Fallback: Generate local PDF (for drafts or if IO fetch fails)
      await generateInvoicePDF(invoice);
      toast.success("Invoice PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  if (!id) {
    return (
      <DashboardLayout>
        <InvoiceMissingIdError />
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <InvoiceLoadingState />
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <InvoiceError error={error} />
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <InvoiceNotFound />
      </DashboardLayout>
    );
  }

  // Determine if the invoice can be edited based on its status
  const canEdit = invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue';

  return (
    <DashboardLayout>
      <Helmet>
        <title>{invoice.invoice_number} - McKaynine Training Centre</title>
      </Helmet>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <InvoiceDetailHeader 
            invoice={invoice} 
            onGeneratePDF={handleGeneratePDF} 
            backPath="/invoices" 
          />
          {canEdit && (
            <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Invoice
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <InvoiceDetailsPanel invoice={invoice} />
          </div>

          <div>
            <ClientInfoCard 
              invoice={invoice}
              onGeneratePDF={handleGeneratePDF}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
