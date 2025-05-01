
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/formatters";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";

interface ClassTableProps {
  classDetails: TrainerClassDetail[];
  selectedClasses: string[];
  toggleClass: (classId: string, checked: boolean) => void;
}

export function ClassTable({ classDetails, selectedClasses, toggleClass }: ClassTableProps) {
  if (classDetails.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No classes found for this trainer</p>
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Bookings</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classDetails.map(classData => (
            <TableRow key={classData.scheduleId}>
              <TableCell className="px-4 py-2">
                <Checkbox 
                  checked={selectedClasses.includes(classData.scheduleId)}
                  onCheckedChange={(checked) => toggleClass(classData.scheduleId, !!checked)}
                  disabled={classData.isPaid}
                />
              </TableCell>
              <TableCell className="font-medium">{classData.className}</TableCell>
              <TableCell>{format(new Date(classData.classDate), 'MMM d, yyyy')}</TableCell>
              <TableCell className="text-right">{classData.bookings}</TableCell>
              <TableCell className="text-right">{formatCurrency(classData.potentialRevenue)}</TableCell>
              <TableCell className="text-right">
                <ExtendedBadge variant={classData.isPaid ? "green" : "amber"}>
                  {classData.isPaid ? "Paid" : "Unpaid"}
                </ExtendedBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
