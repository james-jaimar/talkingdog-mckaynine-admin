
import { useState, useEffect } from "react";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search, Eye, Loader2, Download } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useQueryClient } from "@tanstack/react-query";

export default function CustomerInvoices() {
  const navigate = useNavigate();
  const { useMyInvoices } = useInvoices();
  const { data: invoices, isLoading, refetch } = useMyInvoices();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  
  // Auto-refresh data when component mounts or when navigating to this page
  useEffect(() => {
    console.log("CustomerInvoices: Refreshing invoice data");
    queryClient.invalidateQueries({ queryKey: ['my-invoices'], refetchType: 'all' });
    refetch();
  }, [queryClient, refetch]);
  
  const filteredInvoices = invoices?.filter(invoice => 
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Calculate statistics
  const totalOutstanding = invoices?.reduce(
    (sum, invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled' ? sum + invoice.total : sum,
    0
  ) || 0;
  
  const totalPaid = invoices?.reduce(
    (sum, invoice) => invoice.status === 'paid' ? sum + invoice.total : sum,
    0
  ) || 0;
  
  // Status badge helper
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
    <CustomerDashboardLayout>
      <Helmet>
        <title>My Invoices - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-6">My Invoices</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Outstanding Amount</CardTitle>
              <CardDescription>Total unpaid invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Paid Amount</CardTitle>
              <CardDescription>Total paid invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>View your invoices and payment history</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by invoice number..."
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
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                          <span>Loading invoices...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        {searchTerm ? "No invoices match your search." : "No invoices found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{format(new Date(invoice.issued_date), "PP")}</TableCell>
                        <TableCell>{format(new Date(invoice.due_date), "PP")}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{formatCurrency(invoice.total)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/customer/invoices/${invoice.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerDashboardLayout>
  );
}
