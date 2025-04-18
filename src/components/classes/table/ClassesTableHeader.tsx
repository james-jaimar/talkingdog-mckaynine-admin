
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ClassesTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">Order</TableHead>
        <TableHead>Class Name</TableHead>
        <TableHead>Level</TableHead>
        <TableHead>Duration</TableHead>
        <TableHead>Price</TableHead>
        <TableHead>Capacity</TableHead>
        <TableHead>Availability</TableHead>
        <TableHead>Location</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
