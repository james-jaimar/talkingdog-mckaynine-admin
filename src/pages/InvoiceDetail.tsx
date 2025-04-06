
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Edit, ArrowLeft, Loader2, Mail, AlertCircle, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useInvoiceDetails } from "@/hooks/invoices/useInvoiceQueries";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/components/invoices/pdf/InvoicePDFGenerator";

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

  const canEdit = invoice?.status === 'draft' || invoice?.status === 'sent' || invoice?.status === 'overdue';

  return (
    <DashboardLayout>
      <Helmet>
        <title>{invoice?.invoice_number || 'Invoice Detail'} - McKaynine Training Centre</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Button variant="ghost" onClick={() => navigate('/invoices')} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            <h1 className="text-2xl font-bold">{invoice?.invoice_number || 'Invoice Detail'}</h1>
          </div>
          <div className="flex gap-2">
            {canEdit && invoice && (
              <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Button>
            )}
            <Button variant="outline" onClick={handleGeneratePDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading invoice details...</span>
          </div>
        ) : isError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load invoice details. Please try again later."}
            </AlertDescription>
          </Alert>
        ) : !invoice ? (
          <div className="flex flex-col items-center justify-center h-48">
            <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
            <h2 className="text-xl font-semibold mb-2">Invoice not found</h2>
            <p className="text-gray-600">The invoice you're looking for might have been deleted or doesn't exist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Client:</p>
                      {invoice.client ? (
                        <>
                          <p className="text-base font-medium">{invoice.client.first_name} {invoice.client.last_name}</p>
                          <p>{invoice.client.email}</p>
                          {invoice.client.phone && <p>{invoice.client.phone}</p>}
                          {invoice.client.address && <p>{invoice.client.address}</p>}
                          {invoice.client.city && invoice.client.postal_code && (
                            <p>{invoice.client.city}, {invoice.client.postal_code}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-500">Client information unavailable</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Invoice Number:</p>
                      <p>{invoice.invoice_number}</p>
                      <p className="text-sm font-medium mt-2">Status:</p>
                      <Badge variant="secondary" className="capitalize">{invoice.status}</Badge>
                      <p className="text-sm font-medium mt-2">Issued Date:</p>
                      <p>{formatDate(invoice.issued_date)}</p>
                      <p className="text-sm font-medium mt-2">Due Date:</p>
                      <p>{formatDate(invoice.due_date)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Notes:</p>
                    <p>{invoice.notes || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoice.items?.length > 0 ? invoice.items.map(item => {
                          const booking = item.bookings;
                          const classData = booking?.class_schedules?.classes;
                          const dogName = booking?.dogs?.name;
                          
                          return (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                              <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.unit_price)}</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.amount)}</td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                              No items found for this invoice.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Subtotal:</p>
                    <p>{formatCurrency(invoice.subtotal)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Tax ({invoice.tax_rate}%):</p>
                    <p>{formatCurrency(invoice.tax_amount)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm font-bold">Total:</p>
                    <p className="font-bold">{formatCurrency(invoice.total)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invoice
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleGeneratePDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
