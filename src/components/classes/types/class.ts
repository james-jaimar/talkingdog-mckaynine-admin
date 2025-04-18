
export interface Class {
  id: string;
  name: string;
  description: string;
  level: string;
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
  class_schedules?: ClassSchedule[];
  created_at: string;
  updated_at: string;
}

// Define an interface for the data we get from the database query
// which might have string types for enum fields
export interface ClassFromDB {
  id: string;
  name: string;
  description: string;
  level: string;
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
  class_schedules?: ClassSchedule[];
  created_at: string;
  updated_at: string;
}

// Import ClassSchedule type for proper typing
import { ClassSchedule } from './class-schedule';
