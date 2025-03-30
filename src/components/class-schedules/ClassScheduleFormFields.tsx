
import { Control } from "react-hook-form";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { ClassScheduleFormValues } from "./schemas/classScheduleFormSchema";

interface TrainerOption {
  label: string;
  value: string;
}

interface ClassScheduleFormFieldsProps {
  control: Control<ClassScheduleFormValues>;
  trainers: TrainerOption[];
  isLoadingTrainers: boolean;
}

export function ClassScheduleFormFields({
  control,
  trainers,
  isLoadingTrainers,
}: ClassScheduleFormFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="trainerId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trainer</FormLabel>
            <Select 
              disabled={isLoadingTrainers} 
              onValueChange={field.onChange} 
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select trainer" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
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

      <FormField
        control={control}
        name="selectedDates"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2" />
              Select Class Dates
            </FormLabel>
            <div className="border rounded-md p-4">
              <Calendar
                mode="multiple"
                selected={field.value}
                onSelect={field.onChange}
                numberOfMonths={4}
                className="w-full pointer-events-auto"
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="isRecurring"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Recurring Class</FormLabel>
              <div className="text-sm text-muted-foreground">
                Enable if this is a recurring class series
              </div>
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

      <FormField
        control={control}
        name="referenceTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reference Title</FormLabel>
            <FormControl>
              <Input 
                placeholder="e.g., Puppy Class, April/May" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
