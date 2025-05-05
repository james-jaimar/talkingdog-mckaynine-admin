
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ExtendedBadge } from "@/components/ui/badge-variants";

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
}

export function ClassDetailsList({ classDetails, trainerId, onMarkForPayment, onMarkAsUnpaid }: ClassDetailsListProps) {
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
  
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Bookings</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDetails.map((detail) => (
            <TableRow key={detail.scheduleId}>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
