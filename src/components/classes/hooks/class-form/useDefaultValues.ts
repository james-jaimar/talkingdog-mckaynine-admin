
import { ClassFormValues } from "../../schemas/classFormSchema";
import { ClassData } from "./types";

export function getDefaultValues(classData: ClassData | null): ClassFormValues {
  if (classData) {
    return {
      name: classData.name || "",
      description: classData.description || "",
      class_type: classData.class_type || "Puppy",
      course_fee: typeof classData.course_fee === 'number' ? classData.course_fee : 
                parseFloat(String(classData.course_fee)) || 0,
      enrollment_fee: typeof classData.enrollment_fee === 'number' ? classData.enrollment_fee : 
                    parseFloat(String(classData.enrollment_fee)) || 0,
      mckaynine_commission_type: classData.mckaynine_commission_type || "percentage",
      mckaynine_commission_value: typeof classData.mckaynine_commission_value === 'number' ? classData.mckaynine_commission_value :
                              parseFloat(String(classData.mckaynine_commission_value)) || 0,
      admin_fee_type: classData.admin_fee_type || "percentage",
      admin_fee_value: typeof classData.admin_fee_value === 'number' ? classData.admin_fee_value :
                    parseFloat(String(classData.admin_fee_value)) || 0,
      trainer_fee_type: classData.trainer_fee_type || "percentage",
      trainer_fee_value: typeof classData.trainer_fee_value === 'number' ? classData.trainer_fee_value :
                      parseFloat(String(classData.trainer_fee_value)) || 0,
      duration: typeof classData.duration === 'number' ? classData.duration :
              parseInt(String(classData.duration)) || 60,
      capacity: typeof classData.capacity === 'number' ? classData.capacity :
              parseInt(String(classData.capacity)) || 8,
      branchId: classData.branch_id || "",
    };
  } else {
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
}
