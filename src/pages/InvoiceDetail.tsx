
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Edit } from "lucide-react";
import { useInvoiceDetails } from "@/hooks/invoices/useInvoiceQueries";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/components/invoices/pdf/InvoicePDFGenerator";
import { InvoiceDetailHeader } from "@/components/invoices/detail/InvoiceDetailHeader";
import { InvoiceLoadingState } from "@/components/invoices/detail/InvoiceLoadingState";
import { InvoiceNotFound } from "@/components/invoices/detail/InvoiceNotFound";
import { InvoiceDetailsPanel } from "@/components/invoices/detail/InvoiceDetailsPanel";
import { ClientInfoCard } from "@/components/invoices/detail/ClientInfoCard";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: invoice, isLoading, error, isError } = useInvoiceDetails(id);

  useEffect(() => {
    if (!id) {
      navigate('/invoices');
    }
  }, [id, navigate]);

  const handleGeneratePDF = async () => {
    if (!invoice) return;
    
    try {
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
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Invoice ID is required.</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={() => navigate('/invoices')} 
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
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
        <div className="container mx-auto py-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load invoice details. Please try again later."}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={() => navigate('/invoices')} 
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
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
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/invoices')} className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Button>
            )}
            <Button variant="outline" onClick={handleGeneratePDF}>
              <ArrowLeft className="mr-2 h-4 w-4 rotate-180" />
              Download PDF
            </Button>
          </div>
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
