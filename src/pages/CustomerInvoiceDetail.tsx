
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InvoiceStatus } from "@/types/invoice";
import { useInvoiceDetails } from "@/hooks/invoices/useInvoiceQueries";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/components/invoices/pdf/InvoicePDFGenerator";

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

  const statusColors: { [key in InvoiceStatus]: string } = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-gray-400 text-gray-900",
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="w-full py-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading invoice...
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="w-full py-6 flex justify-center">Invoice not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>{invoice.invoice_number} - McKaynine Training Centre</title>
      </Helmet>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button variant="ghost" onClick={() => navigate("/customer/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
          </div>
          <div>
            <Button variant="outline" onClick={handleGeneratePDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-md shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Invoice Details</h2>
                  <p className="text-gray-500">
                    Issued on {formatDate(invoice.issued_date)}
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-sm font-medium ${
                    statusColors[invoice.status]
                  }`}
                >
                  {invoice.status}
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Quantity</th>
                    <th className="pb-2">Unit Price</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item) => {
                    const booking = item.bookings;
                    const classData = booking?.class_schedules?.classes;
                    const dogName = booking?.dogs?.name;
                    
                    return (
                      <tr key={item.id} className="border-t border-gray-200">
                        <td className="py-4">
                          <div>
                            <p className="font-medium">{item.description}</p>
                            {booking && (
                              <p className="text-xs text-gray-500">
                                {dogName && <span>Dog: {dogName} | </span>}
                                {classData && <span>Class: {classData.name}</span>}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4">{item.quantity}</td>
                        <td className="py-4">{formatCurrency(item.unit_price)}</td>
                        <td className="py-4 text-right">{formatCurrency(item.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end mt-4">
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({invoice.tax_rate}%):</span>
                    <span>{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-2">Notes:</h3>
                  <p className="text-gray-700">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white p-6 rounded-md shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Client Information</h2>
              {invoice.client ? (
                <>
                  <p className="font-medium">{invoice.client.first_name} {invoice.client.last_name}</p>
                  <p className="text-gray-500">{invoice.client.email}</p>
                  {invoice.client?.phone && (
                    <p className="text-gray-500">{invoice.client.phone}</p>
                  )}
                  {invoice.client?.address && (
                    <p className="text-gray-500">{invoice.client.address}</p>
                  )}
                  {invoice.client?.city && invoice.client?.postal_code && (
                    <p className="text-gray-500">
                      {invoice.client.city}, {invoice.client.postal_code}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Client information unavailable</p>
              )}
              
              <div className="mt-6">
                <Button variant="outline" className="w-full" onClick={handleGeneratePDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
