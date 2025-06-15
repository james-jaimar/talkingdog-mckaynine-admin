import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ClassesTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[50px]">Order</TableHead>
        <TableHead>Class Name</TableHead>
        <TableHead className="text-center">Type</TableHead>
        <TableHead className="text-center">Duration</TableHead>
        <TableHead className="text-center">Fee</TableHead>
        <TableHead className="text-center">Capacity</TableHead>
        <TableHead className="text-center">Branch</TableHead>
        <TableHead className="text-center">Availability</TableHead>
        <TableHead className="text-center">Status</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
