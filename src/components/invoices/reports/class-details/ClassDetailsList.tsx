
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { TrainerClassDetail } from "@/hooks/useTrainerPaymentData";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { Loader2 } from "lucide-react";

interface ClassDetailsListProps {
  classDetails: TrainerClassDetail[];
  trainerId: string;
  onMarkForPayment: (trainerId: string) => void;
  onMarkAsUnpaid?: (trainerId: string) => void;
  isProcessing?: boolean;
}

export function ClassDetailsList({ 
  classDetails, 
  trainerId, 
  onMarkForPayment,
  onMarkAsUnpaid,
  isProcessing = false
}: ClassDetailsListProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class Name</TableHead>
            <TableHead className="text-right">Date</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead className="text-center">Clients</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classDetails.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                No class details available
              </TableCell>
            </TableRow>
          ) : (
            classDetails.map((cls) => {
              const hasZeroCommission = cls.hasZeroCommission;
              
              return (
                <TableRow key={cls.scheduleId}>
                  <TableCell>
                    <span className="font-medium">{cls.className}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(cls.classDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasZeroCommission ? (
                      <span className="text-muted-foreground">N/A</span>
                    ) : (
                      formatCurrency(cls.potentialRevenue)
                    )}
                  </TableCell>
                  <TableCell className="text-center">{cls.bookings}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasZeroCommission ? (
                        <ExtendedBadge variant="blue">No Commission</ExtendedBadge>
                      ) : cls.isPaid ? (
                        <>
                          <ExtendedBadge variant="green">Paid</ExtendedBadge>
                          {!isProcessing && onMarkAsUnpaid && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsUnpaid(trainerId);
                              }}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Mark Unpaid'
                              )}
                            </Button>
                          )}
                        </>
                      ) : (
                        <ExtendedBadge variant="amber">Payment Due</ExtendedBadge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
