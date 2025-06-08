
import { ClassFormValues, CLASS_TYPES } from "../../schemas/classFormSchema";
import { Class } from "../../types/class";
import { ClassWithSchedules } from "../types/class-with-schedules";

type ClassData = Class | ClassWithSchedules;

export function createDefaultFormValues(classData: ClassData | null): ClassFormValues {
  if (!classData) {
    return {
      name: "",
      description: "",
      class_type: "Puppy",
      course_fee: 0,
      enrollment_fee: 0,
      mckaynine_commission_type: "percentage",
      mckaynine_commission_value: 0,
      admin_fee_type: "percentage",
      admin_fee_value: 0,
      trainer_fee_type: "percentage",
      trainer_fee_value: 0,
      duration: 60,
      capacity: 8,
      branchId: "",
    };
  }

  return {
    name: classData.name || "",
    description: classData.description || "",
    class_type: (classData.class_type && CLASS_TYPES.includes(classData.class_type as any)) 
      ? classData.class_type as typeof CLASS_TYPES[number]
      : "Puppy",
    course_fee: Number(classData.course_fee) || 0,
    enrollment_fee: Number(classData.enrollment_fee) || 0,
    mckaynine_commission_type: classData.mckaynine_commission_type || "percentage",
    mckaynine_commission_value: Number(classData.mckaynine_commission_value) || 0,
    admin_fee_type: classData.admin_fee_type || "percentage",
    admin_fee_value: Number(classData.admin_fee_value) || 0,
    trainer_fee_type: classData.trainer_fee_type || "percentage",
    trainer_fee_value: Number(classData.trainer_fee_value) || 0,
    duration: Number(classData.duration) || 60,
    capacity: Number(classData.capacity) || 8,
    branchId: classData.branch_id || "",
  };
}
