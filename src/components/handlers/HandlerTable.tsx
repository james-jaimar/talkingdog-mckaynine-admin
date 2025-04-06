
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Eye, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { TablePagination } from "@/components/ui/table-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExtendedBadge } from "@/components/ui/badge-variants";

export function HandlerTable({ 
  handlers, 
  searchQuery,
  itemsPerPage = 15,
  loading = false
}) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  // Calculate number of pages
  const totalPages = Math.ceil(handlers.length / itemsPerPage);
  
  // Get current page's data
  const currentHandlers = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return handlers.slice(start, end);
  }, [handlers, page, itemsPerPage]);

  // Function to check if a handler has unpaid invoices
  const useHandlerInvoiceStatus = (clientId) => {
    return useQuery({
      queryKey: ['handler-invoice-status', clientId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('invoices')
          .select('id, status, payment_received')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        if (!data || data.length === 0) return { hasInvoices: false };
        
        const unpaidInvoices = data.filter(inv => 
          !inv.payment_received && inv.status !== 'cancelled'
        );
        
        return { 
          hasInvoices: true,
          hasUnpaidInvoices: unpaidInvoices.length > 0,
          invoiceCount: data.length,
          unpaidCount: unpaidInvoices.length
        };
      },
      enabled: !!clientId,
    });
  };

  // Return loading state if data is loading
  if (loading) {
    return (
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Dogs</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Dogs</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {handlers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchQuery 
                    ? `No handlers found matching "${searchQuery}"`
                    : "No handlers found"
                  }
                </TableCell>
              </TableRow>
            ) : (
              currentHandlers.map((handler) => {
                const { data: invoiceStatus, isLoading: isLoadingInvoices } = useHandlerInvoiceStatus(handler.id);
                
                return (
                  <TableRow key={handler.id}>
                    <TableCell className="font-medium">
                      {handler.first_name} {handler.last_name}
                    </TableCell>
                    <TableCell>{handler.email}</TableCell>
                    <TableCell>{handler.phone || "—"}</TableCell>
                    <TableCell>
                      {handler.dogs?.length > 0 ? (
                        <span className="text-sm bg-gray-100 py-0.5 px-2 rounded-full">
                          {handler.dogs.length}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {isLoadingInvoices ? (
                        <Skeleton className="h-5 w-12" />
                      ) : invoiceStatus?.hasInvoices ? (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-sm">{invoiceStatus.invoiceCount}</span>
                          {invoiceStatus.hasUnpaidInvoices && (
                            <ExtendedBadge variant="warning" className="text-xs ml-1 px-1.5">
                              {invoiceStatus.unpaidCount} unpaid
                            </ExtendedBadge>
                          )}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/handlers/${handler.id}`)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/handlers/${handler.id}`)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="mt-4">
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
}
