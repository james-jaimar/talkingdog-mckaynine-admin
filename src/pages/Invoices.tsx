
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoicesList } from "@/components/invoices/InvoicesList";
import { InvoiceCreateDialog } from "@/components/invoices/InvoiceCreateDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Filter } from "lucide-react";
import { InvoiceStatus } from "@/types/invoice";

export default function Invoices() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const { invoices, isLoading } = useInvoices();

  const filteredInvoices = invoices?.filter(invoice => 
    statusFilter === 'all' || invoice.status === statusFilter
  ) || [];

  return (
    <DashboardLayout>
      <Helmet>
        <title>Invoices - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Invoices</h1>
          
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setStatusFilter('all')}>
                All
              </TabsTrigger>
              <TabsTrigger value="draft" onClick={() => setStatusFilter('draft')}>
                Draft
              </TabsTrigger>
              <TabsTrigger value="sent" onClick={() => setStatusFilter('sent')}>
                Sent
              </TabsTrigger>
              <TabsTrigger value="paid" onClick={() => setStatusFilter('paid')}>
                Paid
              </TabsTrigger>
              <TabsTrigger value="overdue" onClick={() => setStatusFilter('overdue')}>
                Overdue
              </TabsTrigger>
              <TabsTrigger value="cancelled" onClick={() => setStatusFilter('cancelled')}>
                Cancelled
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
        
        <InvoicesList invoices={filteredInvoices} isLoading={isLoading} />
        
        <InvoiceCreateDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    </DashboardLayout>
  );
}
