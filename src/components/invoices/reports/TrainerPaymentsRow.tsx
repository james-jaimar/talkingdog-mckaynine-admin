
import { useState } from "react";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { TrainerClassDetail } from "@/hooks/useTrainerPaymentData";
import { format } from "date-fns";

interface TrainerPaymentsRowProps {
  trainer: {
    id: string;
    trainerName: string;
    totalEarned: number;
    paid: number;
    pending: number;
    classesCount: number;
    clients: number;
    lastPaymentDate?: string;
    classDetails?: TrainerClassDetail[];
  };
  onMarkForPayment: (trainerId: string) => void;
}

export function TrainerPaymentsRow({ trainer, onMarkForPayment }: TrainerPaymentsRowProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const hasClassDetails = trainer.classDetails && trainer.classDetails.length > 0;
  const classesCount = trainer.classesCount || 0;
  const classDetailsShown = trainer.classDetails?.length || 0;

  return (
    <>
      <TableRow 
        className={hasClassDetails ? "cursor-pointer hover:bg-muted/60" : ""} 
        onClick={hasClassDetails ? toggleExpand : undefined}
      >
        <TableCell className="flex items-center gap-2">
          {hasClassDetails && (
            <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
          <span className="font-medium">{trainer.trainerName}</span>
        </TableCell>
        <TableCell className="text-right">{formatCurrency(trainer.totalEarned)}</TableCell>
        <TableCell className="text-right">{formatCurrency(trainer.paid)}</TableCell>
        <TableCell className="text-right">{formatCurrency(trainer.pending)}</TableCell>
        <TableCell className="text-center">{classesCount}</TableCell>
        <TableCell className="text-center">{trainer.clients}</TableCell>
        <TableCell className="text-right">
          {trainer.lastPaymentDate 
            ? new Date(trainer.lastPaymentDate).toLocaleDateString()
            : 'Never'}
        </TableCell>
        <TableCell className="text-right">
          {trainer.pending > 0 ? (
            <ExtendedBadge variant="amber">Payment Due</ExtendedBadge>
          ) : (
            <ExtendedBadge variant="green">Paid</ExtendedBadge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMarkForPayment(trainer.id);
            }}
            disabled={trainer.pending <= 0}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Mark for Payment
          </Button>
        </TableCell>
      </TableRow>

      {expanded && trainer.classDetails && (
        <TableRow className="bg-muted/20 border-t-0">
          <TableCell colSpan={9} className="py-0">
            <div className="py-2">
              <p className="font-medium mb-2">Classes ({classDetailsShown})</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {trainer.classDetails.length > 0 ? (
                  trainer.classDetails.map((classDetail) => (
                    <div 
                      key={classDetail.scheduleId}
                      className="grid grid-cols-5 gap-2 p-2 bg-background rounded-md border text-sm"
                    >
                      <div>
                        <p className="font-medium">{classDetail.className}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(classDetail.classDate), 'PPP p')}
                        </p>
                      </div>
                      <div className="text-center self-center">
                        <p>{classDetail.bookings} bookings</p>
                      </div>
                      <div className="text-center self-center">
                        <p>{formatCurrency(classDetail.revenue)}</p>
                      </div>
                      <div className="text-center self-center">
                        <ExtendedBadge variant={classDetail.isPaid ? "green" : "amber"}>
                          {classDetail.isPaid ? "Paid" : "Unpaid"}
                        </ExtendedBadge>
                      </div>
                      <div className="text-right self-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={classDetail.isPaid}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkForPayment(trainer.id);
                          }}
                        >
                          Mark Paid
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No class details available
                  </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
