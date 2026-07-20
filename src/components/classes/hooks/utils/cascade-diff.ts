import { ClassFormValues } from "../../schemas/classFormSchema";
import { Class } from "../../types/class";
import { ClassWithSchedules } from "../types/class-with-schedules";

type ClassData = Class | ClassWithSchedules;

export interface CascadeDiff {
  nameChanged: boolean;
  oldName?: string;
  newName?: string;
  feesChanged: boolean;
  changedFeeFields: string[];
  hasAny: boolean;
}

/**
 * Compare the submitted form values against the loaded class record and
 * return which cascade-relevant fields moved.
 */
export function computeCascadeDiff(
  original: ClassData | null,
  values: ClassFormValues,
): CascadeDiff {
  if (!original) {
    return {
      nameChanged: false,
      feesChanged: false,
      changedFeeFields: [],
      hasAny: false,
    };
  }

  const oldName = (original.name ?? "").trim();
  const newName = values.name.trim();
  const nameChanged = oldName !== newName;

  const feeChecks: Array<{ field: string; oldVal: unknown; newVal: unknown }> = [
    { field: "course_fee", oldVal: Number(original.course_fee ?? 0), newVal: Number(values.course_fee ?? 0) },
    { field: "enrollment_fee", oldVal: Number(original.enrollment_fee ?? 0), newVal: Number(values.enrollment_fee ?? 0) },
    { field: "trainer_fee_type", oldVal: original.trainer_fee_type ?? "percentage", newVal: values.trainer_fee_type },
    { field: "trainer_fee_value", oldVal: Number(original.trainer_fee_value ?? 0), newVal: Number(values.trainer_fee_value ?? 0) },
    { field: "mckaynine_commission_type", oldVal: original.mckaynine_commission_type ?? "percentage", newVal: values.mckaynine_commission_type },
    { field: "mckaynine_commission_value", oldVal: Number(original.mckaynine_commission_value ?? 0), newVal: Number(values.mckaynine_commission_value ?? 0) },
    { field: "admin_fee_type", oldVal: original.admin_fee_type ?? "percentage", newVal: values.admin_fee_type },
    { field: "admin_fee_value", oldVal: Number(original.admin_fee_value ?? 0), newVal: Number(values.admin_fee_value ?? 0) },
  ];

  const changedFeeFields = feeChecks
    .filter((c) => c.oldVal !== c.newVal)
    .map((c) => c.field);

  const feesChanged = changedFeeFields.length > 0;

  return {
    nameChanged,
    oldName: nameChanged ? oldName : undefined,
    newName: nameChanged ? newName : undefined,
    feesChanged,
    changedFeeFields,
    hasAny: nameChanged || feesChanged,
  };
}
