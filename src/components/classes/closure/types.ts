export interface HandlerCompletionData {
  booking_id: string;
  handler_id: string;
  handler_name: string;
  dog_name: string;
  pass_percentage: number | null;
  result_status: 'passed' | 'no_pass' | 'incomplete' | 'did_not_grade' | 'did_not_attend';
  result_notes: string;
  next_action: 'continuing' | 'wants_info' | 'stopping' | 'none';
}

export interface ClassClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  classType: string;
  onClassClosed: () => void;
}

export interface EnrolledHandler {
  booking_id: string;
  handler_id: string;
  handler_name: string;
  dog_name: string;
}
