
import { useState, useEffect } from "react";
import { Control } from "react-hook-form";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MultiTermOptionsProps {
  control: Control<ClassScheduleFormValues>;
  selectedDates: Date[];
}

interface Term {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export function MultiTermOptions({ control, selectedDates }: MultiTermOptionsProps) {
  // Fetch available terms for multiple term selection
  const { data: terms } = useQuery({
    queryKey: ["terms-for-schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terms")
        .select(`
          id, 
          term_number,
          start_date,
          end_date,
          academic_years:academic_year_id(year)
        `)
        .order("start_date");
      
      if (error) throw error;
      
      return data.map(term => ({
        id: term.id,
        label: `Term ${term.term_number} ${term.academic_years?.year || ""}`,
        startDate: new Date(term.start_date),
        endDate: new Date(term.end_date)
      }));
    },
    enabled: true,
  });

  // Helper function to determine which terms the selected dates span
  const getSpannedTerms = (dates: Date[]): Term[] => {
    if (!terms || !dates.length) return [];
    
    // Sort the dates
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];
    
    // Find which terms these dates span
    return terms.filter(term => {
      // Check if any part of the date range overlaps with this term
      return (
        (firstDate <= term.endDate && lastDate >= term.startDate) ||
        (firstDate >= term.startDate && firstDate <= term.endDate) ||
        (lastDate >= term.startDate && lastDate <= term.endDate)
      );
    });
  };

  const spannedTerms = getSpannedTerms(selectedDates);

  return (
    <>
      {/* Multi-Term Support */}
      {terms && spannedTerms.length > 1 && (
        <FormField
          control={control}
          name="spansMultipleTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-50">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Multiple Terms Detected</FormLabel>
                <FormDescription>
                  Your selected dates span multiple terms. Would you like to create separate schedules for each term?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {/* Multi-Term Term Selection (only show if spanning multiple terms and opted in) */}
      <FormField
        control={control}
        name="relatedTermIds"
        render={({ field }) => {
          const showField = spannedTerms.length > 1 && control._formValues.spansMultipleTerms;
          
          if (!showField) return null;
          
          return (
            <FormItem>
              <FormLabel>Terms for this class schedule</FormLabel>
              <FormDescription>
                Select which terms should include this schedule
              </FormDescription>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {spannedTerms.map((term) => (
                  <FormItem
                    key={term.id}
                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(term.id)}
                        onCheckedChange={(checked) => {
                          const updatedTerms = checked
                            ? [...(field.value || []), term.id]
                            : (field.value || []).filter((id) => id !== term.id);
                          field.onChange(updatedTerms);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      {term.label}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </>
  );
}
