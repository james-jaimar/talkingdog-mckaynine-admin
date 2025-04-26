
import { Class } from "../../types/class";
import { ClassSchedule } from "../../types/class-schedule";

export interface ClassWithSchedules extends Class {
  // Using the actual ClassSchedule type but making it compatible with what we need
  class_schedules?: Partial<ClassSchedule>[];
}
