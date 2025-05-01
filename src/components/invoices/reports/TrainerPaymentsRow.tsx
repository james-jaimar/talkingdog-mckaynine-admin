import { useState } from "react";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { formatCurrency } from "@/lib/formatters";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TrainerClassDetail } from "@/hooks/useTrainerPaymentData";
import { format } from "date-fns";

// Handler commission data extraction per class
function getHandlerCommissionsForClass(classDetail: TrainerClassDetail) {
  // If we have bookingsDetails with handler information
  if ((classDetail as any).bookingsDetails) {
    return (classDetail as any).bookingsDetails.map((b: any) => ({
      handler: b.clientName || b.handlerName || "Unnamed Client",
      commission: b.commissionAmount || 0
    }));
  }
  
  // Fallback: simulate with count of bookings
  const result = [];
  for (let i = 1; i <= classDetail.bookings; i++) {
    result.push({
      handler: `Client ${i}`,
      commission: Math.round((classDetail.potentialRevenue || 0) / classDetail.bookings)
    });
  }
  return result;
}

interface TrainerPaymentsRowProps {
  trainer: {
    id: string;
    trainerName: string;
    totalEarned: number;
    paid: number;
    pending: number;
    potentialEarnings?: number;
    classesCount: number;
    clients: number;
    lastPaymentDate?: string;
    classDetails?: TrainerClassDetail[];
  };
  onMarkForPayment: (trainerId: string) => void;
  index: number;
}

export function TrainerPaymentsRow({ trainer, onMarkForPayment, index }: TrainerPaymentsRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const toggleExpand = () => setExpanded((prev) => !prev);

  const hasClassDetails = trainer.classDetails && trainer.classDetails.length > 0;
  const classesCount = trainer.classesCount || 0;
  const classDetailsShown = trainer.classDetails?.length || 0;
  
  const hasActualPayments = trainer.paid > 0;
  const showPotentialAmounts = !hasActualPayments;
  const earnings = showPotentialAmounts 
    ? (trainer.potentialEarnings || 0)
    : trainer.totalEarned;
  const pendingAmount = showPotentialAmounts 
    ? (trainer.potentialEarnings || 0) 
    : trainer.pending;

  return (
    <>
      <TableRow 
        className={hasClassDetails ? "cursor-pointer hover:bg-muted/60" : ""}
        isEven={index % 2 === 0}
        onClick={hasClassDetails ? toggleExpand : undefined}
      >
        <TableCell className="flex items-center gap-2">
          {hasClassDetails && (
            <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          <span className="font-medium">{trainer.trainerName}</span>
        </TableCell>
        <TableCell className="text-right">
          {formatCurrency(earnings)}
          {showPotentialAmounts && (
            <span className="text-xs text-muted-foreground ml-1">(Potential)</span>
          )}
        </TableCell>
        <TableCell className="text-right">{formatCurrency(trainer.paid)}</TableCell>
        <TableCell className="text-right">
          {formatCurrency(pendingAmount)}
          {showPotentialAmounts && (
            <span className="text-xs text-muted-foreground ml-1">(Potential)</span>
          )}
        </TableCell>
        <TableCell className="text-center">{classesCount}</TableCell>
        <TableCell className="text-center">{trainer.clients}</TableCell>
        <TableCell className="text-right">
          {trainer.lastPaymentDate 
            ? new Date(trainer.lastPaymentDate).toLocaleDateString()
            : 'Never'}
        </TableCell>
        <TableCell className="text-right">
          {showPotentialAmounts ? (
            <ExtendedBadge variant="blue">Potential</ExtendedBadge>
          ) : trainer.pending > 0 ? (
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
          >
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
                      className="grid grid-cols-7 gap-2 p-2 bg-background rounded-md border text-sm"
                    >
                      <div className="flex items-center gap-1 col-span-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedClass(
                              expandedClass === classDetail.scheduleId ? null : classDetail.scheduleId
                            );
                          }}
                        >
                          {expandedClass === classDetail.scheduleId ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <p className="font-medium">{classDetail.className}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(classDetail.classDate), 'PPP p')}
                          </p>
                        </div>
                      </div>
                      <div className="text-center self-center">
                        <p>{classDetail.bookings} bookings</p>
                      </div>
                      <div className="text-center self-center">
                        <p className="font-semibold">{formatCurrency(classDetail.potentialRevenue)}</p>
                        <p className="text-xs text-muted-foreground">Potential</p>
                      </div>
                      <div className="text-center self-center">
                        <p>{formatCurrency(classDetail.revenue)}</p>
                        <p className="text-xs text-muted-foreground">Actual</p>
                      </div>
                      <div className="text-center self-center">
                        <ExtendedBadge variant={classDetail.isPaid ? "green" : "amber"}>
                          {classDetail.isPaid ? "Paid" : "Unpaid"}
                        </ExtendedBadge>
                      </div>
                      <div className="text-right self-center col-span-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={classDetail.isPaid || classDetail.bookings === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkForPayment(trainer.id);
                          }}
                        >
                          Mark Paid
                        </Button>
                      </div>

                      {/* Handler breakdown expansion - Updated to show one handler per row with actual client names */}
                      {expandedClass === classDetail.scheduleId && (
                        <div className="col-span-7 mt-2 mb-2 border-t pt-2">
                          <span className="font-medium mb-1 block">Handlers in this class</span>
                          <div className="space-y-2">
                            {getHandlerCommissionsForClass(classDetail).map((handlerData, i) => (
                              <div key={i} className="flex justify-between rounded bg-muted px-3 py-2">
                                <span className="font-medium">{handlerData.handler}</span>
                                <span className="text-right">{formatCurrency(handlerData.commission)}</span>
                              </div>
                            ))}
                            {getHandlerCommissionsForClass(classDetail).length === 0 && (
                              <div className="text-muted-foreground italic col-span-2">No handler commission data available</div>
                            )}
                          </div>
                        </div>
                      )}
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
