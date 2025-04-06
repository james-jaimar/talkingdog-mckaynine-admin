
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InvoiceStatus } from "@/types/invoice";

export default function CustomerInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      // First get the invoice data
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      // Get client information
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, first_name, last_name, email, phone, address, city, postal_code")
        .eq("id", invoiceData.client_id)
        .single();

      if (clientError) {
        throw clientError;
      }

      // Get invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceData.id);

      if (itemsError) {
        throw itemsError;
      }

      // Combine all data
      return {
        ...invoiceData,
        client: clientData,
        items: itemsData || []
      };
    },
    enabled: !!id,
  });

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

  const canEdit = invoice?.status === 'draft' || invoice?.status === 'sent' || invoice?.status === 'overdue';

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
                  {invoice.items?.map((item) => (
                    <tr key={item.id} className="border-t border-gray-200">
                      <td className="py-4">{item.description}</td>
                      <td className="py-4">{item.quantity}</td>
                      <td className="py-4">{formatCurrency(item.unit_price)}</td>
                      <td className="py-4 text-right">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
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
              <p className="text-gray-700">
                {invoice.client?.first_name} {invoice.client?.last_name}
              </p>
              <p className="text-gray-500">{invoice.client?.email}</p>
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
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
