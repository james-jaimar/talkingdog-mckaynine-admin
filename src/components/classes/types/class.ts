
// Import ClassSchedule type for proper typing
import { ClassSchedule, ClassScheduleBasic } from './class-schedule';
import { ClassType } from './class-types';

export interface Class {
  id: string;
  name: string;
  description?: string; 
  class_type: ClassType;
  course_fee: number;
  enrollment_fee: number;
  mckaynine_commission_type: 'percentage' | 'amount';
  mckaynine_commission_value: number;
  admin_fee_type: 'percentage' | 'amount';
  admin_fee_value: number;
  trainer_fee_type: 'percentage' | 'amount';
  trainer_fee_value: number;
  duration: number;
  capacity: number;
  branch_id: string;
  branches?: {
    name: string;
  };
  class_schedules?: ClassSchedule[] | ClassScheduleBasic[];
  created_at: string;
  updated_at: string;
}

// Define an interface for the data we get from the database query
// which might have string types for enum fields
export interface ClassFromDB {
  id: string;
  name: string;
  description: string;
  class_type: string;
  course_fee: number;
  enrollment_fee: number;
  mckaynine_commission_type: string;
  mckaynine_commission_value: number;
  admin_fee_type: string;
  admin_fee_value: number;
  trainer_fee_type: string;
  trainer_fee_value: number;
  duration: number;
  capacity: number;
  branch_id: string;
  branches?: {
    name: string;
  };
  class_schedules?: {
    id: string;
    bookings?: { 
      id: string;
      client_id?: string;
      dog_id?: string;
    }[];
    // Add other fields that might be fetched but aren't used directly
    class_id?: string;
    start_time?: string;
    end_time?: string;
    recurring?: boolean;
  }[];
  created_at: string;
  updated_at: string;
}
