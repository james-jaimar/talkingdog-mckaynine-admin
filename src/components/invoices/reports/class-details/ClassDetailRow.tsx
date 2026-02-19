
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";
import { format } from "date-fns";
import { HandlersBreakdown } from "../handlers/HandlersBreakdown";

interface ClassDetailRowProps {
  classDetail: TrainerClassDetail;
  expandedClass: string | null;
  setExpandedClass: (id: string | null) => void;
  onMarkForPayment: () => void;
}

export function ClassDetailRow({
  classDetail,
  expandedClass,
  setExpandedClass,
  onMarkForPayment
}: ClassDetailRowProps) {
  const isExpanded = expandedClass === classDetail.scheduleId;

  return (
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
            setExpandedClass(isExpanded ? null : classDetail.scheduleId);
          }}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <div>
          <p className="font-medium">{classDetail.className}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(classDetail.classDate), 'PPP p')}
          </p>
          {/* Substitution info */}
          {classDetail.isSubstitute && (
            <p className="text-xs text-primary font-medium">
              Sub for {classDetail.originalTrainerName}
              {classDetail.substituteDates && classDetail.totalDates && (
                <span className="text-muted-foreground"> ({classDetail.substituteDates} of {classDetail.totalDates} dates)</span>
              )}
            </p>
          )}
          {!classDetail.isSubstitute && classDetail.substituteTrainerName && (
            <p className="text-xs text-muted-foreground">
              Subbed by {classDetail.substituteTrainerName}
              {classDetail.substituteDates && classDetail.totalDates && (
                <span> ({classDetail.substituteDates} of {classDetail.totalDates} dates)</span>
              )}
            </p>
          )}
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
            onMarkForPayment();
          }}
        >
          Mark Paid
        </Button>
      </div>

      {/* Handler breakdown expansion */}
      {isExpanded && <HandlersBreakdown classDetail={classDetail} />}
    </div>
  );
}