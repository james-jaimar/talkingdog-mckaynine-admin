
import { useState, useEffect, useMemo } from "react";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { formatCurrency } from "@/lib/formatters";
import { ChevronDown, ChevronUp, Wrench, FileText } from "lucide-react";
import { TrainerClassDetail } from "@/hooks/useTrainerPaymentData";
import { ClassDetailsList } from "./class-details/ClassDetailsList";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface TrainerPaymentsRowProps {
  trainer: {
    id: string;
    trainerName: string;
    trainerEmail?: string;
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
  onGenerateStatement?: (trainerId: string, selectedScheduleIds?: string[]) => void;
  index: number;
}

export function TrainerPaymentsRow({ 
  trainer, 
  onMarkForPayment, 
  onMarkAsUnpaid, 
  onFixZeroAmounts,
  onGenerateStatement,
  index 
}: TrainerPaymentsRowProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Get selectable classes (exclude zero commission)
  const selectableClasses = useMemo(() => {
    return (trainer.classDetails || []).filter(c => !c.hasZeroCommission);
  }, [trainer.classDetails]);
  
  // Initialize with all selectable classes selected
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>(() => 
    selectableClasses.map(c => c.scheduleId)
  );

  // Update selection when class details change
  useEffect(() => {
    setSelectedScheduleIds(selectableClasses.map(c => c.scheduleId));
  }, [selectableClasses]);

  const toggleExpand = () => setExpanded((prev) => !prev);

  const hasClassDetails = trainer.classDetails && trainer.classDetails.length > 0;
  const classesCount = trainer.classesCount || 0;
  const classDetailsShown = trainer.classDetails?.length || 0;
  
  // Handle trainers with zero commission classes
  const isZeroCommissionTrainer = trainer.hasZeroCommissionClasses && 
                                 (trainer.pending === 0 && trainer.paid === 0 && trainer.potentialEarnings === 0);
  
  // Determine status based on payment amounts
  const hasActualPayments = trainer.paid > 0;
  const hasPendingAmount = trainer.pending > 0;

  // Check if any classes are selected for statement
  const hasSelectedClasses = selectedScheduleIds.length > 0;

  const handleGenerateStatement = () => {
    if (onGenerateStatement) {
      onGenerateStatement(trainer.id, selectedScheduleIds);
    }
  };

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
          
          {trainer.hasZeroAmountPayments && (
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                Actions <MoreHorizontal className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Statement Actions - always available for trainers with classes */}
              {onGenerateStatement && classesCount > 0 && (
                <>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateStatement();
                    }}
                    disabled={!hasSelectedClasses}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Statement
                    {!hasSelectedClasses && <span className="ml-1 text-xs">(select classes)</span>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Payment Actions */}
              {!isZeroCommissionTrainer && (
                <>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onMarkForPayment(trainer.id);
                  }}>
                    Mark for Payment
                  </DropdownMenuItem>
                  {onMarkAsUnpaid && hasActualPayments && (
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
                  {onFixZeroAmounts && trainer.hasZeroAmountPayments && (
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
                </>
              )}
              
              {isZeroCommissionTrainer && !onGenerateStatement && (
                <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
                selectedScheduleIds={selectedScheduleIds}
                onSelectionChange={setSelectedScheduleIds}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
