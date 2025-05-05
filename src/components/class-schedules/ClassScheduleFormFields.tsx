
import { Control } from "react-hook-form";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { ClassScheduleFormValues } from "./schemas/classScheduleFormSchema";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { subMonths, addMonths, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { useTerm } from "@/context/TermContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface ClassScheduleFormFieldsProps {
  control: Control<ClassScheduleFormValues>;
  trainers: { value: string; label: string; }[];
  isLoadingTrainers: boolean;
}

export function ClassScheduleFormFields({ 
  control, 
  trainers, 
  isLoadingTrainers 
}: ClassScheduleFormFieldsProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const { termData } = useTerm();
  
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
  const getSpannedTerms = (dates: Date[]) => {
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
  
  // When dates change, check if they span multiple terms
  useEffect(() => {
    if (control && selectedDates.length > 0) {
      const spannedTerms = getSpannedTerms(selectedDates);
      
      // If dates span multiple terms, update the form
      if (spannedTerms.length > 1) {
        console.log("Schedule spans multiple terms:", spannedTerms.map(t => t.label).join(", "));
      }
    }
  }, [selectedDates, control, terms]);

  return (
    <div className="space-y-6">
      {/* Trainer Selection */}
      <FormField
        control={control}
        name="trainerId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trainer</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={isLoadingTrainers}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trainer" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">No Trainer</SelectItem>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.value} value={trainer.value}>
                    {trainer.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Time Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Date Selection Calendar */}
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

      {/* Multi-Term Support */}
      {terms && getSpannedTerms(selectedDates).length > 1 && (
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
          const spannedTerms = getSpannedTerms(selectedDates);
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

      {/* Recurring Class */}
      <FormField
        control={control}
        name="isRecurring"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Recurring Class</FormLabel>
              <FormDescription>
                Enable if this is a recurring class series
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

      <Separator />

      {/* Reference Title */}
      <FormField
        control={control}
        name="referenceTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reference Title</FormLabel>
            <FormDescription>
              A title to help identify this class schedule
            </FormDescription>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
