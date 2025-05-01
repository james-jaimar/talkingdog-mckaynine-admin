
import { formatCurrency } from "@/lib/formatters";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

interface PaymentDetailsPanelProps {
  classDetails: TrainerClassDetail[];
}

export function PaymentDetailsPanel({ classDetails }: PaymentDetailsPanelProps) {
  const totalClasses = classDetails.length;
  const totalBookings = classDetails.reduce((acc, detail) => acc + detail.bookings, 0);
  const totalAmount = classDetails.reduce((acc, detail) => acc + detail.potentialRevenue, 0);
  
  return (
    <div className="border rounded-md p-4 bg-muted/30 space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="font-medium">Total Classes:</div>
        <div>{totalClasses}</div>
        
        <div className="font-medium">Total Bookings:</div>
        <div>{totalBookings}</div>
        
        <div className="font-medium">Total Amount:</div>
        <div className="font-semibold">{formatCurrency(totalAmount)}</div>
      </div>
      
      <div className="pt-2 border-t">
        <h4 className="font-medium mb-2 text-sm">Classes included:</h4>
        <ul className="text-sm space-y-1 max-h-24 overflow-y-auto">
          {classDetails.map(cls => (
            <li key={cls.scheduleId} className="flex justify-between">
              <span>{cls.className} ({new Date(cls.classDate).toLocaleDateString()})</span>
              <span>{formatCurrency(cls.potentialRevenue)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
