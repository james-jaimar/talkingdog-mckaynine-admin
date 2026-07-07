import { useState } from "react";
import { HandlerCompactRow } from "./HandlerCompactRow";
import { TablePagination } from "@/components/ui/table-pagination";

interface HandlerCompactListProps {
  handlers: any[];
  searchQuery?: string;
  itemsPerPage?: number;
  loading?: boolean;
}

export function HandlerCompactList({
  handlers,
  searchQuery = "",
  itemsPerPage = 25,
  loading = false,
}: HandlerCompactListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(handlers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentHandlers = handlers.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading handlers...</div>;
  }

  if (currentHandlers.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {searchQuery ? `No handlers found matching "${searchQuery}"` : "No handlers found"}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="divide-y divide-gray-100">
        {currentHandlers.map((handler, index) => (
          <HandlerCompactRow
            key={handler.id}
            handler={handler}
            searchQuery={searchQuery}
            isEven={index % 2 === 0}
          />
        ))}
      </div>

      {handlers.length > itemsPerPage && (
        <div className="p-4">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
