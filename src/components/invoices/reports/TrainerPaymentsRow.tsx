
import { useState } from "react";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { formatCurrency } from "@/lib/formatters";
import { ChevronDown, ChevronUp, Wrench, Loader2 } from "lucide-react";
import { TrainerClassDetail } from "@/hooks/useTrainerPaymentData";
import { ClassDetailsList } from "./class-details/ClassDetailsList";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

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
    hasZeroAmountPayments?: boolean;
    hasZeroCommissionClasses?: boolean;
    hasUnpaidCommission?: boolean;
  };
  onMarkForPayment: (trainerId: string) => void;
  onMarkAsUnpaid?: (trainerId: string) => void;
  onFixZeroAmounts?: (trainerId: string) => void;
  isProcessing?: boolean;
  index: number;
}

export function TrainerPaymentsRow({ 
  trainer, 
  onMarkForPayment, 
  onMarkAsUnpaid, 
  onFixZeroAmounts,
  isProcessing = false,
  index 
}: TrainerPaymentsRowProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    if (!isProcessing) {
      setExpanded((prev) => !prev);
    }
  };

  const hasClassDetails = trainer.classDetails && trainer.classDetails.length > 0;
  const classesCount = trainer.classesCount || 0;
  const classDetailsShown = trainer.classDetails?.length || 0;
  
  // Handle trainers with zero commission classes
  const isZeroCommissionTrainer = trainer.hasZeroCommissionClasses && 
                                 (trainer.pending === 0 && trainer.paid === 0 && trainer.potentialEarnings === 0);
  
  // Determine status based on payment amounts
  const hasActualPayments = trainer.paid > 0;
  const hasPendingAmount = trainer.pending > 0;

  return (
    <>
      <TableRow 
        className={hasClassDetails && !isProcessing ? "cursor-pointer hover:bg-muted/60" : 
                 isProcessing ? "opacity-70" : ""}
        isEven={index % 2 === 0}
        onClick={hasClassDetails && !isProcessing ? toggleExpand : undefined}
      >
        <TableCell className="flex items-center gap-2">
          {hasClassDetails && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-6 w-6"
              disabled={isProcessing}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          <span className="font-medium">{trainer.trainerName}</span>
          
          {trainer.hasZeroAmountPayments && !isZeroCommissionTrainer && (
            <ExtendedBadge variant="amber" className="ml-1">
              <Wrench className="h-3 w-3 mr-1" />
              Fix Needed
            </ExtendedBadge>
          )}
          
          {isZeroCommissionTrainer && (
            <ExtendedBadge variant="blue" className="ml-1">
              0% Commission
            </ExtendedBadge>
          )}
        </TableCell>
        <TableCell className="text-right">
          {isZeroCommissionTrainer ? (
            <span className="text-muted-foreground">N/A</span>
          ) : (
            formatCurrency(trainer.totalEarned || 0)
          )}
        </TableCell>
        <TableCell className="text-right">
          {isZeroCommissionTrainer ? (
            <span className="text-muted-foreground">N/A</span>
          ) : (
            formatCurrency(trainer.paid)
          )}
        </TableCell>
        <TableCell className="text-right">
          {isZeroCommissionTrainer ? (
            <span className="text-muted-foreground">N/A</span>
          ) : (
            formatCurrency(trainer.pending)
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
          {isZeroCommissionTrainer ? (
            <ExtendedBadge variant="blue">No Commission</ExtendedBadge>
          ) : hasPendingAmount ? (
            <ExtendedBadge variant="amber">Payment Due</ExtendedBadge>
          ) : hasActualPayments ? (
            <ExtendedBadge variant="green">Paid</ExtendedBadge>
          ) : (
            <ExtendedBadge variant="amber">Payment Due</ExtendedBadge>
          )}
        </TableCell>
        <TableCell className="text-right">
          {isZeroCommissionTrainer ? (
            <Button variant="outline" size="sm" disabled>N/A</Button>
          ) : isProcessing ? (
            <Button variant="outline" size="sm" disabled>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Processing...
            </Button>
          ) : hasActualPayments && !hasPendingAmount ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isProcessing}>
                  Actions <MoreHorizontal className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onMarkForPayment(trainer.id);
                }}>
                  Mark for Payment
                </DropdownMenuItem>
                {onMarkAsUnpaid && (
                  <DropdownMenuItem 
                    className="text-red-600" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsUnpaid(trainer.id);
                    }}
                  >
                    Mark as Unpaid
                  </DropdownMenuItem>
                )}
                {onFixZeroAmounts && trainer.hasZeroAmountPayments && !isZeroCommissionTrainer && (
                  <DropdownMenuItem 
                    className="text-amber-600" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onFixZeroAmounts(trainer.id);
                    }}
                  >
                    <Wrench className="h-4 w-4 mr-1" />
                    Fix Zero Amounts
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMarkForPayment(trainer.id);
              }}
              disabled={isProcessing}
            >
              Mark for Payment
            </Button>
          )}
        </TableCell>
      </TableRow>

      {expanded && trainer.classDetails && (
        <TableRow className="bg-muted/20 border-t-0">
          <TableCell colSpan={9} className="py-0">
            <div className="py-2">
              <p className="font-medium mb-2">Classes ({classDetailsShown})</p>
              <ClassDetailsList 
                classDetails={trainer.classDetails}
                onMarkForPayment={onMarkForPayment}
                trainerId={trainer.id}
                onMarkAsUnpaid={onMarkAsUnpaid}
                isProcessing={isProcessing}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
