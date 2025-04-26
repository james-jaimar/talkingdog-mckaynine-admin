
import { Control, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { FormTextField } from "@/components/handlers/form/FormTextField";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassFormValues } from "../schemas/classFormSchema";
import { useEffect } from "react";

interface FeeFieldsProps {
  control: Control<ClassFormValues>;
}

export function FeeFields({ control }: FeeFieldsProps) {
  const feeTypes = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'amount', label: 'Fixed Amount' },
  ];
  
  // Use useWatch to log the form values instead of subscribing to the internal subject
  const formValues = useWatch({ control });
  
  // Log the form values for debugging
  useEffect(() => {
    console.log("FeeFields - Current fee values:", {
      course_fee: formValues.course_fee,
      enrollment_fee: formValues.enrollment_fee,
      mckaynine_commission_type: formValues.mckaynine_commission_type,
      mckaynine_commission_value: formValues.mckaynine_commission_value,
      admin_fee_type: formValues.admin_fee_type,
      admin_fee_value: formValues.admin_fee_value,
      trainer_fee_type: formValues.trainer_fee_type,
      trainer_fee_value: formValues.trainer_fee_value,
    });
  }, [formValues]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="course_fee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Fee (R)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="enrollment_fee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enrollment Fee (R)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <FormField
          control={control}
          name="mckaynine_commission_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>McKaynine Commission Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {feeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="mckaynine_commission_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commission Value</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <FormField
          control={control}
          name="admin_fee_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Fee Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {feeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="admin_fee_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Fee Value</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <FormField
          control={control}
          name="trainer_fee_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trainer Fee Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {feeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="trainer_fee_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trainer Fee Value</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
