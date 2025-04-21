
import { 
  Table,
  TableBody
} from "@/components/ui/table";
import { InvoiceItem } from "@/hooks/invoices/types";
import { InvoiceItemEmptyState } from "./table/InvoiceItemEmptyState";
import { InvoiceItemRow } from "./table/InvoiceItemRow";
import { InvoiceTableHeader } from "./table/InvoiceTableHeader";
import { useEffect } from "react";

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  // Enhanced logging to audit invoice items
  useEffect(() => {
    console.log("InvoiceItemsTable received items:", items);
    
    if (items && items.length > 0) {
      // Calculate expected subtotal for verification
      const calculatedSubtotal = items.reduce((sum, item) => 
        sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0
      );
      
      console.log(`Expected subtotal from ${items.length} items: ${calculatedSubtotal}`);
      
      // Log any items with potential issues
      const potentialIssues = items.filter(item => 
        !item.description || !item.quantity || !item.unit_price || 
        (item.amount && Math.abs(item.amount - (item.quantity * item.unit_price)) > 0.01)
      );
      
      if (potentialIssues.length > 0) {
        console.warn(`Found ${potentialIssues.length} items with potential issues:`, potentialIssues);
      }
    }
  }, [items]);

  // Check if there are any valid items to display with better validation
  const hasValidItems = items && items.length > 0 && items.some(item => 
    item.description || 
    (item.quantity && item.quantity > 0) || 
    (item.unit_price && item.unit_price > 0) || 
    item.bookings
  );

  if (!hasValidItems) {
    return <InvoiceItemEmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <InvoiceTableHeader />
        <TableBody>
          {items.map((item, index) => (
            <InvoiceItemRow 
              key={item.id || `item-${index}`} 
              item={item} 
              index={index} 
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
