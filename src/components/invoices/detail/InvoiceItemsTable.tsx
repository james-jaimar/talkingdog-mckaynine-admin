
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
  // Log whenever items change
  useEffect(() => {
    console.log("InvoiceItemsTable received items:", items);
  }, [items]);

  // Check if there are any valid items to display
  const hasValidItems = items && items.length > 0 && items.some(item => 
    item.description || item.unit_price || item.quantity || item.bookings
  );

  if (!hasValidItems) {
    console.log("No valid items to display, showing empty state");
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
