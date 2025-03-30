
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
            </FormDescription>
            <FormControl>
              <Calendar
                mode="multiple"
                selected={field.value}
                onSelect={field.onChange}
                numberOfMonths={4}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border"
              />
            </FormControl>
            <FormMessage />
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
