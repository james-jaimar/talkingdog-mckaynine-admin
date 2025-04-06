import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Edit, ArrowLeft, Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from "@/types/invoice";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:client_id (id, first_name, last_name, email, phone, address, city, postal_code),
          items(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) {
      navigate('/invoices');
    }
  }, [id, navigate]);

  if (!id) {
    return <div>Error: Invoice ID is required.</div>;
  }

  const canEdit = invoice?.status === 'draft' || invoice?.status === 'sent' || invoice?.status === 'overdue';

  return (
    <DashboardLayout>
      <Helmet>
        <title>{invoice?.invoice_number} - McKaynine Training Centre</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Button variant="ghost" onClick={() => navigate('/invoices')} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            <h1 className="text-2xl font-bold">{invoice?.invoice_number}</h1>
          </div>
          <div>
            {canEdit && (
              <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading invoice details...</span>
          </div>
        ) : invoice ? (
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
                      <p>{invoice.client?.first_name} {invoice.client?.last_name}</p>
                      <p>{invoice.client?.email}</p>
                      {invoice.client?.phone && <p>{invoice.client.phone}</p>}
                      {invoice.client?.address && <p>{invoice.client.address}</p>}
                      {invoice.client?.city && invoice.client?.postal_code && (
                        <p>{invoice.client.city}, {invoice.client.postal_code}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Invoice Number:</p>
                      <p>{invoice.invoice_number}</p>
                      <p className="text-sm font-medium">Status:</p>
                      <Badge variant="secondary">{invoice.status}</Badge>
                      <p className="text-sm font-medium">Issued Date:</p>
                      <p>{formatDate(invoice.issued_date)}</p>
                      <p className="text-sm font-medium">Due Date:</p>
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
                        {invoice.items?.map(item => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                            <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                            <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.unit_price)}</td>
                            <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
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
                    <p>{formatCurrency(invoice.total)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invoice
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div>Invoice not found.</div>
        )}
      </div>
    </DashboardLayout>
  );
}
