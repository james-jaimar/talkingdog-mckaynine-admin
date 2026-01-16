import { Check, X, AlertTriangle, HelpCircle } from "lucide-react";
import { Booking } from "../types/booking";

interface MobileAttendanceStatsProps {
  bookings: Booking[];
  selectedDate: string | null;
}

export function MobileAttendanceStats({ bookings, selectedDate }: MobileAttendanceStatsProps) {
  if (!selectedDate) return null;

  // Calculate attendance stats for the selected date
  const stats = bookings.reduce(
    (acc, booking) => {
      if (!booking.attendances) {
        acc.unmarked++;
        return acc;
      }

      const dateToCheck = new Date(selectedDate).toDateString();
      const attendance = booking.attendances.find(
        (a: any) => new Date(a.class_date).toDateString() === dateToCheck
      );

      if (!attendance || attendance.attendance_status === 'not_marked') {
        acc.unmarked++;
      } else if (attendance.attendance_status === 'present') {
        acc.present++;
      } else if (attendance.attendance_status === 'absent') {
        acc.absent++;
      } else if (attendance.attendance_status === 'excused') {
        acc.excused++;
      }

      return acc;
    },
    { present: 0, absent: 0, excused: 0, unmarked: 0 }
  );

  const total = bookings.length;

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {/* Present */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
        <div className="flex justify-center mb-1">
          <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="text-xl font-bold text-green-700">{stats.present}</div>
        <div className="text-xs text-green-600">Present</div>
      </div>

      {/* Absent */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
        <div className="flex justify-center mb-1">
          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
            <X className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="text-xl font-bold text-red-700">{stats.absent}</div>
        <div className="text-xs text-red-600">Absent</div>
      </div>

      {/* Excused */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
        <div className="flex justify-center mb-1">
          <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="text-xl font-bold text-amber-700">{stats.excused}</div>
        <div className="text-xs text-amber-600">Excused</div>
      </div>

      {/* Unmarked */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
        <div className="flex justify-center mb-1">
          <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="text-xl font-bold text-gray-700">{stats.unmarked}</div>
        <div className="text-xs text-gray-600">Unmarked</div>
      </div>
    </div>
  );
}
