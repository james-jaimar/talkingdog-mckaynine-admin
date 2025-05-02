
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";

interface TrainerClassSelectorProps {
  classes: TrainerClassDetail[];
  selectedIds: string[];
  onToggleClass: (scheduleId: string) => void;
  onToggleAll: () => void;
  isDisabled?: boolean;
}

export function TrainerClassSelector({
  classes,
  selectedIds,
  onToggleClass,
  onToggleAll,
  isDisabled = false
}: TrainerClassSelectorProps) {
  // Filter out already paid classes for display
  const unpaidClasses = classes.filter(cls => !cls.isPaid);
  const allUnpaidSelected = unpaidClasses.length > 0 && 
    unpaidClasses.every(c => selectedIds.includes(c.scheduleId));
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Select Classes to Pay</h3>
        {unpaidClasses.length > 0 && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="select-all"
              checked={allUnpaidSelected}
              onCheckedChange={onToggleAll}
              disabled={isDisabled}
            />
            <label htmlFor="select-all" className="text-sm text-muted-foreground">
              {allUnpaidSelected ? "Deselect All" : "Select All Unpaid"}
            </label>
          </div>
        )}
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Class Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No classes found for this trainer
                </TableCell>
              </TableRow>
            ) : (
              classes.map((cls) => (
                <TableRow key={cls.scheduleId} className={cls.isPaid ? "bg-muted/30" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(cls.scheduleId)}
                      onCheckedChange={() => onToggleClass(cls.scheduleId)}
                      disabled={cls.isPaid || isDisabled}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{cls.className}</TableCell>
                  <TableCell>{format(new Date(cls.classDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>{cls.bookings}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cls.potentialRevenue)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      cls.isPaid 
                        ? "bg-green-100 text-green-700" 
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {cls.isPaid ? "Paid" : "Pending"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
