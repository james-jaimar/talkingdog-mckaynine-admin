
import { useState } from "react";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";
import { ClassDetailRow } from "./ClassDetailRow";

interface ClassDetailsListProps {
  classDetails: TrainerClassDetail[];
  onMarkForPayment: (trainerId: string) => void;
  trainerId: string;
}

export function ClassDetailsList({ classDetails, onMarkForPayment, trainerId }: ClassDetailsListProps) {
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  if (classDetails.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No class details available
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
      {classDetails.map((classDetail) => (
        <ClassDetailRow
          key={classDetail.scheduleId}
          classDetail={classDetail}
          expandedClass={expandedClass}
          setExpandedClass={setExpandedClass}
          onMarkForPayment={() => onMarkForPayment(trainerId)}
        />
      ))}
    </div>
  );
}
