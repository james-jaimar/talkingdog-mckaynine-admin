
import { TableHead, TableHeader as UITableHeader, TableRow } from "@/components/ui/table";

export function HandlerTableHeader() {
  return (
    <UITableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Phone</TableHead>
        <TableHead>Dogs</TableHead>
        <TableHead>Invoices</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </UITableHeader>
  );
}
