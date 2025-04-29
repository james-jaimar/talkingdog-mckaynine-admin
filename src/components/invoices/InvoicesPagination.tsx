
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface InvoicesPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function InvoicesPagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false
}: InvoicesPaginationProps) {
  // Generate array of page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const displayedPages = 5; // Number of page buttons to display
    
    if (totalPages <= displayedPages) {
      // If total pages is less than or equal to displayedPages, show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);
      
      // Calculate middle pages
      let startPage = Math.max(1, currentPage - 1);
      let endPage = Math.min(totalPages - 2, currentPage + 1);
      
      // Adjust if we're near the beginning
      if (currentPage <= 1) {
        endPage = 3;
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }
      
      // Add ellipsis indicator if needed
      if (startPage > 1) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 2) {
        pages.push(-2); // -2 represents second ellipsis
      }
      
      // Always show last page
      pages.push(totalPages - 1);
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page
  }

  return (
    <div className="flex items-center justify-center mt-6 gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 0 || isLoading}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex items-center"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Previous</span>
      </Button>
      
      <div className="flex items-center gap-1 mx-2">
        {getPageNumbers().map((pageNum, index) => 
          pageNum < 0 ? (
            // Render ellipsis
            <span key={`ellipsis-${index}`} className="px-2">...</span>
          ) : (
            // Render page number button
            <Button
              key={`page-${pageNum}`}
              variant={pageNum === currentPage ? "default" : "outline"}
              size="sm"
              disabled={isLoading}
              onClick={() => onPageChange(pageNum)}
              className="w-8 h-8 p-0"
            >
              {pageNum + 1}
            </Button>
          )
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages - 1 || isLoading}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex items-center"
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
