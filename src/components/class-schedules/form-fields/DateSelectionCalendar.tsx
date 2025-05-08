
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
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { isBefore, isAfter, subMonths, addMonths, startOfDay, endOfDay } from "date-fns";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DateSelectionCalendarProps {
  control: Control<ClassScheduleFormValues>;
}

interface Term {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export function DateSelectionCalendar({ control }: DateSelectionCalendarProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  
  // Calculate min/max selectable dates
  const today = new Date();
  const minDate = startOfDay(subMonths(today, 2));
  const maxDate = endOfDay(addMonths(today, 6));

  // Fetch available terms for multiple term selection
  const { data: terms, isLoading: isLoadingTerms } = useQuery({
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

  return (
    <FormField
      control={control}
      name="selectedDates"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Select Class Days</FormLabel>
          <FormDescription>
            Click on days to select multiple dates for this class.
            <br />
            You may select dates up to 2 months in the past and up to 6 months into the future.
            {terms && terms.length > 0 && selectedDates.length > 0 && (
              <>
                <br />
                <span className="font-medium mt-2 block">
                  Selected dates span: {getSpannedTerms(selectedDates).map(term => (
                    <Badge key={term.id} variant="outline" className="mx-1">{term.label}</Badge>
                  ))}
                </span>
              </>
            )}
          </FormDescription>
          <FormControl>
            <Calendar
              mode="multiple"
              selected={field.value}
              onSelect={(dates) => {
                // Ensure we always have an array of dates
                const selectedDatesArray = dates || [];
                setSelectedDates(selectedDatesArray);
                field.onChange(selectedDatesArray);
                console.log("Selected dates in calendar:", selectedDatesArray);
              }}
              numberOfMonths={3}
              disabled={(date) => isBefore(date, minDate) || isAfter(date, maxDate)}
              className="rounded-md border"
            />
          </FormControl>
          <FormMessage />
          {selectedDates.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </FormItem>
      )}
    />
  );
}
