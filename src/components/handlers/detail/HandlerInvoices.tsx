
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { BookingToInvoice } from "@/components/invoices/BookingToInvoice";
import { useInvoices } from "@/hooks/useInvoices";
import { Client } from "@/hooks/useClientsData";
import { format } from "date-fns";
import { FilePlus, Loader2, Eye, PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { CreateCustomInvoice } from "./CreateCustomInvoice";

interface HandlerInvoicesProps {
  clientData: Client;
}

export function HandlerInvoices({ clientData }: HandlerInvoicesProps) {
  const navigate = useNavigate();
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [createCustomInvoiceOpen, setCreateCustomInvoiceOpen] = useState(false);
  const { useClientInvoices } = useInvoices();
  const { data: invoices, isLoading, refetch } = useClientInvoices(clientData?.id);

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

  const handleViewInvoice = (invoiceId: string) => {
    console.log("Viewing invoice from handler page:", invoiceId);
    // Fix: Navigate directly to the specific invoice detail page
    navigate(`/invoices/${invoiceId}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>View and manage client invoices</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            onClick={() => setCreateInvoiceOpen(true)}
            className="flex items-center"
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Class Invoice
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => setCreateCustomInvoiceOpen(true)}
            className="flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Custom Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                      <span>Loading invoices...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !invoices || invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No invoices found for this client.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{format(new Date(invoice.issued_date), "PP")}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), "PP")}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewInvoice(invoice.id)}
                        aria-label={`View invoice ${invoice.invoice_number}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <BookingToInvoice 
        open={createInvoiceOpen} 
        onOpenChange={setCreateInvoiceOpen} 
        clientId={clientData?.id} 
        onSuccess={refetch}
      />

      <CreateCustomInvoice
        open={createCustomInvoiceOpen}
        onOpenChange={setCreateCustomInvoiceOpen}
        clientId={clientData?.id}
        clientName={`${clientData?.first_name} ${clientData?.last_name}`}
        onSuccess={refetch}
      />
    </Card>
  );
}
