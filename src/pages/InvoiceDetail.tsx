
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2, ArrowLeft, Printer, Download, Mail, Edit, CheckCircle, BanIcon } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useInvoiceDetails, markAsPaid, markAsSent, cancelInvoice } = useInvoices();
  const { data: invoice, isLoading, isError } = useInvoiceDetails(id);

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsPaid = () => {
    if (id) {
      markAsPaid.mutate(id);
    }
  };

  const handleMarkAsSent = () => {
    if (id) {
      markAsSent.mutate(id);
    }
  };

  const handleCancel = () => {
    if (id) {
      cancelInvoice.mutate(id);
    }
  };

  const handleEdit = () => {
    navigate(`/invoices/${id}/edit`);
  };

  const getStatusClassName = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status) {
      case 'draft': return "bg-gray-100 text-gray-800";
      case 'sent': return "bg-blue-100 text-blue-800";
      case 'paid': return "bg-green-100 text-green-800";
      case 'overdue': return "bg-red-100 text-red-800";
      case 'cancelled': return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading invoice...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !invoice) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Error Loading Invoice</h1>
            <p className="mt-2">The requested invoice could not be found or you don't have permission to view it.</p>
            <Button 
              onClick={() => navigate('/invoices')} 
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>{`Invoice ${invoice.invoice_number} - McKaynine Training Centre`}</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/invoices')} 
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Invoice {invoice.invoice_number}</h1>
            <span className={`ml-4 px-2 py-1 text-xs font-medium rounded ${getStatusClassName(invoice.status)}`}>
              {invoice.status?.toUpperCase()}
            </span>
          </div>

          <div className="flex space-x-2">
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <>
                <Button variant="ghost" onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                
                {invoice.status === 'draft' && (
                  <Button variant="secondary" onClick={handleMarkAsSent}>
                    <Mail className="mr-2 h-4 w-4" />
                    Mark as Sent
                  </Button>
                )}
                
                {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                  <Button variant="secondary" onClick={handleMarkAsPaid}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
                
                {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                  <Button variant="outline" onClick={handleCancel}>
                    <BanIcon className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </>
            )}
            
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Invoice Details */}
        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-mckaynine-600">McKaynine Training Centre</h2>
                <p className="text-gray-500">123 Training Rd, Johannesburg</p>
                <p className="text-gray-500">South Africa, 2000</p>
                <p className="text-gray-500">info@mckaynine.com</p>
                <p className="text-gray-500">+27 123 456 7890</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold mb-2">Invoice #{invoice.invoice_number}</h3>
                <p className="text-gray-500">
                  <span className="font-semibold">Date:</span> {format(new Date(invoice.issued_date), "PP")}
                </p>
                <p className="text-gray-500">
                  <span className="font-semibold">Due Date:</span> {format(new Date(invoice.due_date), "PP")}
                </p>
                <p className={`mt-2 px-3 py-1 rounded text-xs font-medium inline-block ${getStatusClassName(invoice.status)}`}>
                  {invoice.status?.toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-2">Bill To:</h3>
              {invoice.client ? (
                <>
                  <p className="font-medium">{invoice.client.first_name} {invoice.client.last_name}</p>
                  <p className="text-gray-500">{invoice.client.email}</p>
                  {invoice.client.phone && <p className="text-gray-500">{invoice.client.phone}</p>}
                  {invoice.client.address && (
                    <>
                      <p className="text-gray-500">{invoice.client.address}</p>
                      <p className="text-gray-500">
                        {invoice.client.city}{invoice.client.city && invoice.client.postal_code ? ', ' : ''}{invoice.client.postal_code}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Client information not available</p>
              )}
            </div>
            
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Description</th>
                    <th className="text-right pb-2">Qty</th>
                    <th className="text-right pb-2">Unit Price</th>
                    <th className="text-right pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">
                          <div className="font-medium">{item.description}</div>
                          {item.booking?.dog_name && (
                            <div className="text-sm text-gray-500">Dog: {item.booking.dog_name}</div>
                          )}
                        </td>
                        <td className="py-3 text-right">{item.quantity}</td>
                        <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="py-3 text-right">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">No items available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Tax ({invoice.tax_rate}%):</span>
                  <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-b">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">{formatCurrency(invoice.total)}</span>
                </div>
                
                {invoice.payment_received && invoice.payment_date && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-green-800 text-sm font-medium">
                      Payment received on {format(new Date(invoice.payment_date), "PP")}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {invoice.notes && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <div className="p-4 bg-gray-50 rounded-md text-gray-700">
                  {invoice.notes}
                </div>
              </div>
            )}
            
            <div className="mt-8 border-t pt-6">
              <p className="text-center text-gray-500">
                Thank you for your business! Payment is due by {format(new Date(invoice.due_date), "PP")}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
