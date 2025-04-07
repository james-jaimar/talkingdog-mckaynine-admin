
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function InvoiceTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Description</TableHead>
        <TableHead className="text-center">Quantity</TableHead>
        <TableHead className="text-right">Unit Price</TableHead>
        <TableHead className="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
  );
}
