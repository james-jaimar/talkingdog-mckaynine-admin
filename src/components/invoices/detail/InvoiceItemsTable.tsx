
import { 
  Table,
  TableBody
} from "@/components/ui/table";
import { InvoiceItem } from "@/hooks/invoices/types";
import { InvoiceItemEmptyState } from "./table/InvoiceItemEmptyState";
import { InvoiceItemRow } from "./table/InvoiceItemRow";
import { InvoiceTableHeader } from "./table/InvoiceTableHeader";

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  // Check if there are any items to display
  if (!items || items.length === 0) {
    return <InvoiceItemEmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <InvoiceTableHeader />
        <TableBody>
          {items.map((item, index) => (
            <InvoiceItemRow key={item.id || `item-${index}`} item={item} index={index} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
