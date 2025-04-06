
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { BookingWithClass } from "./useBookings";

interface EnrolledClassesSummaryProps {
  enrolledBookings: BookingWithClass[];
}

export function EnrolledClassesSummary({ enrolledBookings }: EnrolledClassesSummaryProps) {
  if (!enrolledBookings.length) {
    return null;
  }

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Current Class Enrollments</AlertTitle>
      <AlertDescription>
        This handler is currently enrolled in the following classes:
        <ul className="mt-2 list-disc pl-5">
          {enrolledBookings.map((booking) => (
            <li key={booking.id}>
              {booking.dogs?.name}: {booking.class_schedules?.classes?.name} - 
              {booking.class_schedules?.classes?.price 
                ? formatCurrency(booking.class_schedules.classes.price) 
                : 'Price not available'} 
              {booking.proof_of_payment ? " (Paid)" : " (Unpaid)"}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
