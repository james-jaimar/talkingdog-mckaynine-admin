
import { Table, TableBody, TableHead, TableHeader } from "@/components/ui/table";
import { HandlerTableRow } from "./table/HandlerTableRow";
import { HandlerTableHeader } from "./table/TableHeader";
import { useState } from "react";
import { TablePagination } from "@/components/ui/table-pagination";

interface HandlerTableProps {
  handlers: any[];
  searchQuery?: string;
  itemsPerPage?: number;
  loading?: boolean;
}

export function HandlerTable({ 
  handlers, 
  searchQuery = "", 
  itemsPerPage = 10,
  loading = false 
}: HandlerTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(handlers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHandlers = handlers.slice(startIndex, endIndex);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <HandlerTableHeader />
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <td colSpan={10} className="p-4 text-center">Loading handlers...</td>
            </TableRow>
          ) : currentHandlers.length === 0 ? (
            <TableRow>
              <td colSpan={10} className="p-4 text-center">
                {searchQuery ? `No handlers found matching "${searchQuery}"` : "No handlers found"}
              </td>
            </TableRow>
          ) : (
            currentHandlers.map((handler, index) => (
              <HandlerTableRow 
                key={handler.id} 
                handler={handler} 
                index={index + startIndex} // Pass the actual index in the full list for correct alternating colors
              />
            ))
          )}
        </TableBody>
      </Table>
      
      {handlers.length > itemsPerPage && (
        <TablePagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
