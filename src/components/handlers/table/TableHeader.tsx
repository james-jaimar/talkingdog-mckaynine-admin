
import { TableHead, TableHeader as UITableHeader, TableRow } from "@/components/ui/table";

export function HandlerTableHeader() {
  return (
    <UITableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Phone</TableHead>
        <TableHead className="text-center">Dogs</TableHead>
        <TableHead className="text-center">Invoices</TableHead>
        <TableHead className="text-center">WA</TableHead>
        <TableHead className="text-center">Social</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </UITableHeader>
  );
}
