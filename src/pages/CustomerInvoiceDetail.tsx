
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useInvoiceDetails } from "@/hooks/invoices/useInvoiceQueries";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/components/invoices/pdf";
import { InvoiceDetailHeader } from "@/components/invoices/detail/InvoiceDetailHeader";
import { InvoiceLoadingState } from "@/components/invoices/detail/InvoiceLoadingState";
import { InvoiceNotFound } from "@/components/invoices/detail/InvoiceNotFound";
import { InvoiceDetailsPanel } from "@/components/invoices/detail/InvoiceDetailsPanel";
import { ClientInfoCard } from "@/components/invoices/detail/ClientInfoCard";

export default function CustomerInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: invoice, isLoading, error } = useInvoiceDetails(id);

  useEffect(() => {
    if (!id) {
      navigate('/customer/invoices');
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <InvoiceLoadingState />
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

  return (
    <DashboardLayout>
      <Helmet>
        <title>{invoice.invoice_number} - McKaynine Training Centre</title>
      </Helmet>
      <div className="container mx-auto py-6">
        <InvoiceDetailHeader 
          invoice={invoice}
          onGeneratePDF={handleGeneratePDF}
          backPath="/customer/invoices"
        />

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
