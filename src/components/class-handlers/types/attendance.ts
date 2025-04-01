
export interface ScheduleDate {
  id: string;
  date: string;
}

export interface AttendanceRecord {
  id: string;
  booking_id: string;
  class_date: string;
  attendance_status: 'present' | 'absent' | 'excused' | 'not_marked';
}
