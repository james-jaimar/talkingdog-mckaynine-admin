
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
import { ClassDetailsList } from "./class-details/ClassDetailsList";

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
              <ClassDetailsList 
                classDetails={trainer.classDetails}
                onMarkForPayment={onMarkForPayment}
                trainerId={trainer.id}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
