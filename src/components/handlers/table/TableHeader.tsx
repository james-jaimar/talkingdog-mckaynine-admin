
import { TableHead, TableRow } from "@/components/ui/table";
import { useClassTypes } from "@/hooks/useClassTypes";

export function HandlerTableHeader() {
  const { classTypeNames } = useClassTypes();
  
  return (
    <TableRow>
      <TableHead className="w-[180px]">Name</TableHead>
      <TableHead className="text-center w-[60px]">Dogs</TableHead>
      
      {/* Class Type Columns - Dynamic from DB */}
      {classTypeNames.map((classType) => (
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
