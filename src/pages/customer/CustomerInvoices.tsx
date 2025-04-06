
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInvoices } from "@/hooks/useInvoices";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/formatters";
import { FileText, Download, Eye } from "lucide-react";
import { Helmet } from "react-helmet";
import { useState } from "react";

export default function CustomerInvoices() {
  const { useMyInvoices } = useInvoices();
  const { data: invoices, isLoading } = useMyInvoices();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-200 text-gray-700">Cancelled</Badge>;
      default:
        return null;
    }
  };

  // Filter invoices based on status filter
  const filteredInvoices = invoices?.filter(invoice => 
    filterStatus === "all" || invoice.status === filterStatus
  );

  return (
    <CustomerDashboardLayout>
      <Helmet>
        <title>My Invoices - McKaynine Training Centre</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">My Invoices</h1>
          <p className="text-muted-foreground">View and manage your invoices</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Your billing history</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "sent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("sent")}
                >
                  Pending
                </Button>
                <Button
                  variant={filterStatus === "paid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("paid")}
                >
                  Paid
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mckaynine-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading your invoices...</p>
              </div>
            ) : !filteredInvoices || filteredInvoices.length === 0 ? (
              <div className="py-12 text-center border rounded-lg">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium">No invoices found</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {filterStatus !== "all" 
                    ? `You don't have any ${filterStatus} invoices` 
                    : "You don't have any invoices yet"}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{format(new Date(invoice.issued_date), "dd MMM yyyy")}</TableCell>
                        <TableCell>{formatCurrency(invoice.total)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {format(new Date(invoice.due_date), "dd MMM yyyy")}
                          {invoice.status !== "paid" && 
                           invoice.status !== "cancelled" &&
                           new Date(invoice.due_date) < new Date() && (
                            <Badge variant="destructive" className="ml-2">Overdue</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CustomerDashboardLayout>
  );
}
