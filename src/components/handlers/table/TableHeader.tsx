
import { TableHead, TableRow } from "@/components/ui/table";
import { CLASS_TYPES } from "@/components/classes/types/class-types";

export function HandlerTableHeader() {
  return (
    <TableRow>
      <TableHead className="w-[180px]">Name</TableHead>
      <TableHead className="text-center w-[60px]">Dogs</TableHead>
      
      {/* Class Type Columns - Fixed widths */}
      {CLASS_TYPES.map((classType) => (
        <TableHead key={classType} className="text-center w-[90px] px-1">
          {classType}
        </TableHead>
      ))}
      
      <TableHead className="text-center w-[60px]">WA</TableHead>
      <TableHead className="text-center w-[60px]">Social</TableHead>
      <TableHead className="text-center w-[70px]">Tasks</TableHead>
      <TableHead className="text-right w-[80px]">Actions</TableHead>
    </TableRow>
  );
}
