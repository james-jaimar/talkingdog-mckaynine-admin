
import { TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";

interface ClassMetadataCellProps {
  duration: number;
  courseFee: number;
  capacity: number;
}

export function ClassMetadataCell({
  duration,
  courseFee,
  capacity
}: ClassMetadataCellProps) {
  return (
    <>
      {/* Duration cell */}
      <TableCell>{duration} min</TableCell>
      
      {/* Price cell */}
      <TableCell>{formatCurrency(courseFee)}</TableCell>
      
      {/* Capacity cell */}
      <TableCell>{capacity}</TableCell>
    </>
  );
}
