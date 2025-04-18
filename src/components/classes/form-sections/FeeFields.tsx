
import { Control } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { FormTextField } from "@/components/handlers/form/FormTextField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassFormValues } from "../schemas/classFormSchema";

interface FeeFieldsProps {
  control: Control<ClassFormValues>;
}

export function FeeFields({ control }: FeeFieldsProps) {
  const feeTypes = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'amount', label: 'Fixed Amount' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormTextField
          control={control}
          name="course_fee"
          label="Course Fee (R)"
          type="number"
        />
        <FormTextField
          control={control}
          name="enrollment_fee"
          label="Enrollment Fee (R)"
          type="number"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <FormField
          control={control}
          name="mckaynine_commission_type"
          render={({ field }) => (
            <div className="space-y-2">
              <label className="text-sm font-medium">McKaynine Commission Type</label>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
        <FormTextField
          control={control}
          name="mckaynine_commission_value"
          label="Commission Value"
          type="number"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <FormField
          control={control}
          name="admin_fee_type"
          render={({ field }) => (
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Fee Type</label>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
        <FormTextField
          control={control}
          name="admin_fee_value"
          label="Admin Fee Value"
          type="number"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <FormField
          control={control}
          name="trainer_fee_type"
          render={({ field }) => (
            <div className="space-y-2">
              <label className="text-sm font-medium">Trainer Fee Type</label>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
        <FormTextField
          control={control}
          name="trainer_fee_value"
          label="Trainer Fee Value"
          type="number"
        />
      </div>
    </div>
  );
}
