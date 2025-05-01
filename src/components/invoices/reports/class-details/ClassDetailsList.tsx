
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { CheckCircle, AlertCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ClassDetailsListProps {
  classDetails: TrainerClassDetail[];
  trainerId: string;
  onMarkForPayment: (trainerId: string) => void;
  onMarkAsUnpaid?: (trainerId: string) => void;
}

export function ClassDetailsList({ 
  classDetails, 
  trainerId, 
  onMarkForPayment,
  onMarkAsUnpaid
}: ClassDetailsListProps) {
  const sortedClasses = [...classDetails].sort((a, b) => {
    // Sort by date (most recent first)
    return new Date(b.classDate).getTime() - new Date(a.classDate).getTime();
  });

  return (
    <div className="overflow-auto max-h-[300px] border rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-2">Status</th>
            <th className="text-left px-4 py-2">Class</th>
            <th className="text-center px-4 py-2">Date</th>
            <th className="text-center px-4 py-2">Bookings</th>
            <th className="text-right px-4 py-2">Revenue</th>
            <th className="text-right px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sortedClasses.map((cls) => (
            <tr key={cls.scheduleId} className="hover:bg-muted/40">
              <td className="px-4 py-2">
                {cls.isPaid ? (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <ExtendedBadge variant="green">Paid</ExtendedBadge>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                    <ExtendedBadge variant="amber">Pending</ExtendedBadge>
                  </div>
                )}
              </td>
              <td className="px-4 py-2">{cls.className}</td>
              <td className="text-center px-4 py-2">
                {new Date(cls.classDate).toLocaleDateString()}
              </td>
              <td className="text-center px-4 py-2">{cls.bookings}</td>
              <td className="text-right px-4 py-2">
                {formatCurrency(cls.potentialRevenue)}
              </td>
              <td className="text-right px-4 py-2">
                {cls.isPaid && onMarkAsUnpaid ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => onMarkAsUnpaid(trainerId)}
                      >
                        Mark as Unpaid
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    disabled={cls.isPaid}
                    onClick={() => onMarkForPayment(trainerId)}
                  >
                    Mark Paid
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
