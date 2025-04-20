
import { TableHead, TableHeader as UITableHeader, TableRow } from "@/components/ui/table";
import { CLASS_TYPES } from "@/components/classes/types/class-types";

export function HandlerTableHeader() {
  return (
    <UITableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Phone</TableHead>
        <TableHead className="text-center">Dogs</TableHead>
        <TableHead className="text-center">Invoices</TableHead>
        
        {/* Class Type Columns */}
        {CLASS_TYPES.map((classType) => (
          <TableHead key={classType} className="text-center w-24 px-1">
            {classType}
          </TableHead>
        ))}
        
        <TableHead className="text-center">WA</TableHead>
        <TableHead className="text-center">Social</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </UITableHeader>
  );
}
