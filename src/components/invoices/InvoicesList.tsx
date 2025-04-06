import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Invoice } from "@/types/invoice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Search, MoreHorizontal, Eye, Edit, Trash, Mail, CheckCircle, BanIcon } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/formatters";

interface InvoicesListProps {
  invoices: Invoice[];
  isLoading: boolean;
}

export function InvoicesList({ invoices, isLoading }: InvoicesListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const { deleteInvoice, markAsPaid, markAsSent, cancelInvoice } = useInvoices();

  const filteredInvoices = invoices.filter(
    invoice => 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.client?.first_name && invoice.client.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.client?.last_name && invoice.client.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.client?.email && invoice.client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewInvoice = (id: string) => {
    navigate(`/invoices/${id}`);
  };

  const handleEditInvoice = (id: string) => {
    navigate(`/invoices/${id}/edit`);
  };

  const handleDeleteInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedInvoiceId) {
      // First close the dialog to prevent UI issues
      setDeleteDialogOpen(false);
      
      // Small delay before triggering the delete mutation
      setTimeout(() => {
        deleteInvoice.mutate(selectedInvoiceId);
      }, 100);
    }
  };

  const handleMarkAsPaid = (id: string) => {
    markAsPaid.mutate(id);
  };

  const handleMarkAsSent = (id: string) => {
    markAsSent.mutate(id);
  };

  const handleCancelInvoice = (id: string) => {
    cancelInvoice.mutate(id);
  };

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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              Manage client invoices and payments
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoices by number or client..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {searchTerm ? "No invoices match your search." : "No invoices found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            
                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleMarkAsSent(invoice.id)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            
                            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                              <DropdownMenuItem onClick={() => handleCancelInvoice(invoice.id)}>
                                <BanIcon className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                            
                            {invoice.status !== 'paid' && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
