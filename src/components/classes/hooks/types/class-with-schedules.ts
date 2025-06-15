import { Class } from "../../types/class";
import { ClassType } from "../../types/class-types";
import { ClassScheduleBasic } from "../../types/class-schedule";

export interface ClassWithSchedules {
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
  class_schedules?: ClassScheduleBasic[];
  
  // Visual indicator for UI - will be set by components as needed
  isMoving?: boolean;
  
  // Other fields from Class that might be needed
  created_at?: string;
  updated_at?: string;
  status: string;
}
