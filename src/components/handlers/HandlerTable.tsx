
import { Table, TableBody } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HandlerTableHeader } from "./table/TableHeader";
import { HandlerTableRow } from "./table/HandlerTableRow";

interface ClientData {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  branch_id?: string;
  dogs?: any[];
  uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
  social_media_consent_status: 'yes' | 'no' | 'not_marked';
}

interface HandlerTableProps {
  handlers: ClientData[];
  searchQuery: string;
  itemsPerPage: number;
  loading: boolean;
}

export function HandlerTable({ 
  handlers, 
  searchQuery, 
  itemsPerPage, 
  loading 
}: HandlerTableProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: itemsPerPage,
  });

  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [handlers, searchQuery]);

  // Filter handlers based on search query
  const filteredHandlers = handlers.filter((handler) => {
    const fullName = `${handler.first_name} ${handler.last_name || ""}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           (handler.email && handler.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
           (handler.phone && handler.phone.includes(searchQuery));
  });

  const totalPages = Math.ceil(filteredHandlers.length / pagination.pageSize);
  const startItem = pagination.pageIndex * pagination.pageSize + 1;
  const endItem = Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredHandlers.length);

  return (
    <div className="rounded-md border">
      <div className="relative overflow-x-auto">
        <Table>
          <HandlerTableHeader /> 
          <TableBody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Loading handlers...
                </td>
              </tr>
            ) : filteredHandlers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No handlers found.
                </td>
              </tr>
            ) : (
              filteredHandlers
                .slice(
                  pagination.pageIndex * pagination.pageSize,
                  (pagination.pageIndex + 1) * pagination.pageSize
                )
                .map((handler) => (
                  <HandlerTableRow key={handler.id} handler={handler} />
                ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-sm text-gray-500">
          {filteredHandlers.length > 0 ? 
            `${startItem} - ${endItem} of ${filteredHandlers.length}` : 
            'No results'}
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
            disabled={pagination.pageIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
            disabled={pagination.pageIndex >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
