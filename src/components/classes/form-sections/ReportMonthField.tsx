import { useState } from "react";
import { Control } from "react-hook-form";
import { addMonths, format } from "date-fns";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClassFormValues } from "../schemas/classFormSchema";

export function ReportMonthField({ control }: { control: Control<ClassFormValues> }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const now = new Date();
  const months = Array.from({ length: 18 }, (_, i) => format(addMonths(now, i), "yyyy-MM"));

  return (
    <div ref={setContainer}>
      <FormField control={control} name="report_month_override" render={({ field }) => {
        const options = field.value && !months.includes(field.value)
          ? [field.value, ...months].sort()
          : months;
        return (
          <FormItem>
            <FormLabel>Report Month Override</FormLabel>
            <Select value={field.value || "auto"} onValueChange={(value) => field.onChange(value === "auto" ? null : value)}>
              <FormControl><SelectTrigger><SelectValue placeholder="Auto (use schedule date)" /></SelectTrigger></FormControl>
              <SelectContent portalContainer={container}>
                <SelectItem value="auto">Auto (use schedule date)</SelectItem>
                {options.map((month) => <SelectItem key={month} value={month}>{format(new Date(`${month}-01T00:00:00`), "MMMM yyyy")}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormDescription>Reporting month for this class; leave on Auto to use the schedule date.</FormDescription>
            <FormMessage />
          </FormItem>
        );
      }} />
    </div>
  );
}