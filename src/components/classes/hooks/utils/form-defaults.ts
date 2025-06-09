
import { ClassFormValues, CLASS_TYPES } from "../../schemas/classFormSchema";
import { Class } from "../../types/class";
import { ClassWithSchedules } from "../types/class-with-schedules";

type ClassData = Class | ClassWithSchedules;

export function createDefaultFormValues(classData: ClassData | null): ClassFormValues {
  if (!classData) {
    const defaultValues = {
      name: "",
      description: "", // Always empty string, never undefined
      class_type: "Puppy" as const,
      course_fee: 0,
      enrollment_fee: 0,
      mckaynine_commission_type: "percentage" as const,
      mckaynine_commission_value: 0,
      admin_fee_type: "percentage" as const,
      admin_fee_value: 0,
      trainer_fee_type: "percentage" as const,
      trainer_fee_value: 0,
      duration: 60,
      capacity: 8,
      branchId: "",
    };
    console.log("DEBUG: Default form values created:", defaultValues);
    return defaultValues;
  }

  const formValues = {
    name: classData.name || "",
    description: classData.description || "", // Always empty string, never null/undefined
    class_type: (classData.class_type && CLASS_TYPES.includes(classData.class_type as any)) 
      ? classData.class_type as typeof CLASS_TYPES[number]
      : "Puppy" as const,
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
  
  console.log("DEBUG: Form values created from existing class data:", formValues);
  console.log("DEBUG: Original class data description:", classData.description);
  return formValues;
}
