
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { Checkbox } from "@/components/ui/checkbox";

interface ClassDetail {
  scheduleId: string;
  className: string;
  classDate: string;
  bookings: number;
  revenue: number;
  potentialRevenue: number;
  isPaid: boolean;
  hasZeroAmountPayment?: boolean;
  hasZeroCommission?: boolean;
}

interface ClassDetailsListProps {
  classDetails: ClassDetail[];
  trainerId: string;
  onMarkForPayment: (trainerId: string, scheduleId?: string) => void;
  onMarkAsUnpaid?: (trainerId: string) => void;
  selectedScheduleIds?: string[];
  onSelectionChange?: (scheduleIds: string[]) => void;
}

export function ClassDetailsList({ 
  classDetails, 
  trainerId, 
  onMarkForPayment, 
  onMarkAsUnpaid,
  selectedScheduleIds,
  onSelectionChange
}: ClassDetailsListProps) {
  if (!classDetails || classDetails.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No class details available
      </div>
    );
  }
  
  // Sort by class date (oldest first)
  const sortedDetails = [...classDetails].sort((a, b) => 
    new Date(a.classDate).getTime() - new Date(b.classDate).getTime()
  );

  // Filter out zero commission classes for selection
  const selectableClasses = sortedDetails.filter(d => !d.hasZeroCommission);
  const hasSelectionMode = selectedScheduleIds !== undefined && onSelectionChange;
  
  // Calculate selected total
  const selectedTotal = hasSelectionMode
    ? selectableClasses
        .filter(d => selectedScheduleIds.includes(d.scheduleId))
        .reduce((sum, d) => sum + d.potentialRevenue, 0)
    : 0;
  
  const selectedCount = hasSelectionMode
    ? selectedScheduleIds.filter(id => selectableClasses.some(c => c.scheduleId === id)).length
    : 0;

  const allSelected = hasSelectionMode && selectedCount === selectableClasses.length;
  const noneSelected = hasSelectionMode && selectedCount === 0;

  const handleSelectAll = () => {
    if (onSelectionChange) {
      onSelectionChange(selectableClasses.map(c => c.scheduleId));
    }
  };

  const handleDeselectAll = () => {
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const handleToggle = (scheduleId: string, checked: boolean) => {
    if (onSelectionChange && selectedScheduleIds) {
      if (checked) {
        onSelectionChange([...selectedScheduleIds, scheduleId]);
      } else {
        onSelectionChange(selectedScheduleIds.filter(id => id !== scheduleId));
      }
    }
  };
  
  return (
    <div className="space-y-2">
      {/* Selection controls */}
      {hasSelectionMode && selectableClasses.length > 0 && (
        <div className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSelectAll}
              disabled={allSelected}
              className="h-7 text-xs"
            >
              Select All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDeselectAll}
              disabled={noneSelected}
              className="h-7 text-xs"
            >
              Deselect All
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedCount} of {selectableClasses.length} selected • {formatCurrency(selectedTotal)}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {hasSelectionMode && <TableHead className="w-10"></TableHead>}
              <TableHead>Class Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Bookings</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDetails.map((detail) => {
              const isSelected = hasSelectionMode && selectedScheduleIds?.includes(detail.scheduleId);
              const isSelectable = !detail.hasZeroCommission;
              
              return (
                <TableRow key={detail.scheduleId}>
                  {hasSelectionMode && (
                    <TableCell className="w-10">
                      {isSelectable && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggle(detail.scheduleId, !!checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </TableCell>
                  )}
                  <TableCell>{detail.className}</TableCell>
                  <TableCell>
                    {new Date(detail.classDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">{detail.bookings}</TableCell>
                  <TableCell className="text-right">
                    {detail.hasZeroCommission ? (
                      <span className="text-muted-foreground">N/A</span>
                    ) : (
                      formatCurrency(detail.isPaid ? detail.potentialRevenue : detail.potentialRevenue)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {detail.hasZeroCommission ? (
                      <ExtendedBadge variant="blue">No Commission</ExtendedBadge>
                    ) : detail.isPaid ? (
                      <ExtendedBadge variant="green">Paid</ExtendedBadge>
                    ) : detail.hasZeroAmountPayment ? (
                      <ExtendedBadge variant="amber">Zero Amount</ExtendedBadge>
                    ) : (
                      <ExtendedBadge variant="amber">Unpaid</ExtendedBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {detail.hasZeroCommission ? (
                      <span className="text-muted-foreground">N/A</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => onMarkForPayment(trainerId, detail.scheduleId)}
                          >
                            {detail.isPaid ? 'Update Payment' : 'Mark as Paid'}
                          </DropdownMenuItem>
                          {detail.isPaid && onMarkAsUnpaid && (
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => onMarkAsUnpaid(trainerId)}
                            >
                              Mark as Unpaid
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
