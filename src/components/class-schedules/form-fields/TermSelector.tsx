
import { Control, useWatch } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

interface TermSelectorProps {
  control: Control<ClassScheduleFormValues>;
}

interface TermOption {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export function TermSelector({ control }: TermSelectorProps) {
  const selectedDates = useWatch({ control, name: "selectedDates" }) || [];

  const { data: terms, isLoading } = useQuery({
    queryKey: ["terms-for-schedule-selector"],
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

      return data.map((term): TermOption => ({
        id: term.id,
        label: `Term ${term.term_number} ${term.academic_years?.year || ""}`,
        startDate: new Date(term.start_date),
        endDate: new Date(term.end_date),
      }));
    },
  });

  // Determine if selected dates span multiple terms
  const getSpannedTerms = (): TermOption[] => {
    if (!terms || !selectedDates.length) return [];
    const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return terms.filter(
      (t) => first <= t.endDate && last >= t.startDate
    );
  };

  const spannedTerms = getSpannedTerms();
  const spansMultiple = spannedTerms.length > 1;

  if (isLoading || !terms) {
    return (
      <FormItem>
        <FormLabel>Term</FormLabel>
        <FormDescription>Loading terms…</FormDescription>
      </FormItem>
    );
  }

  return (
    <FormField
      control={control}
      name="termId"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel className="text-base">Term *</FormLabel>
          {spansMultiple && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Your selected dates span multiple terms — please select which
                term this schedule belongs to.
              </span>
            </div>
          )}
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-2 gap-2"
            >
              {terms.map((term) => (
                <div
                  key={term.id}
                  className="flex items-center space-x-2 rounded-md border p-3"
                >
                  <RadioGroupItem value={term.id} id={`term-${term.id}`} />
                  <Label htmlFor={`term-${term.id}`} className="cursor-pointer font-normal">
                    {term.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
