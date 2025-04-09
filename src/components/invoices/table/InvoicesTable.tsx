
import { useState } from "react";
import { Invoice } from "@/types/invoice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceTableActions } from "./InvoiceTableActions";

interface InvoicesTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  searchTerm: string;
  currentMonthLabel?: string;
}

export function InvoicesTable({ 
  invoices, 
  isLoading, 
  searchTerm, 
  currentMonthLabel = "All Invoices" 
}: InvoicesTableProps) {
  
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
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Client</TableHead>
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
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                  <span>Loading invoices...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                {searchTerm ? "No invoices match your search." : `No invoices found for ${currentMonthLabel}.`}
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>
                  {invoice.client ? (
                    <div>
                      <div>{invoice.client.first_name} {invoice.client.last_name}</div>
                      <div className="text-sm text-muted-foreground">{invoice.client.email}</div>
                    </div>
                  ) : (
                    "Unknown Client"
                  )}
                </TableCell>
                <TableCell>{format(new Date(invoice.issued_date), "PP")}</TableCell>
                <TableCell>{format(new Date(invoice.due_date), "PP")}</TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell>{formatCurrency(invoice.total)}</TableCell>
                <TableCell className="text-right">
                  <InvoiceTableActions invoice={invoice} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
