
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
import { useState } from "react";
import { subMonths, addMonths, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { useTerm } from "@/context/TermContext";

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
  const { terms, termData, years } = useTerm();

  // Calculate min/max selectable dates
  const today = new Date();
  const minDate = startOfDay(subMonths(today, 2));
  const maxDate = endOfDay(addMonths(today, 6));

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

      {/* Term Selection */}
      <FormField
        control={control}
        name="termId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Term</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">No specific term</SelectItem>
                {termData && (
                  <SelectItem value={termData.id}>
                    Term {termData.term_number} ({termData.academic_year?.year})
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Select which term this schedule belongs to
            </FormDescription>
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
