
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useClassScheduleForm } from "./hooks/useClassScheduleForm";
import { Class } from "@/components/classes/types/class";
import { useEffect } from "react";

interface AddClassScheduleFormProps {
  classId: string;
  classData: Class;
  onSuccess: () => void;
}

export function AddClassScheduleForm({ classId, classData, onSuccess }: AddClassScheduleFormProps) {
  const { form, isSubmitting, trainers, isLoadingTrainers, onSubmit } = useClassScheduleForm(
    classId, 
    null, 
    onSuccess
  );

  // Extract recurring state and selected dates for conditional logic
  const isRecurring = form.watch("isRecurring");
  const startTime = form.watch("startTime");
  const selectedDates = form.watch("selectedDates") || [];
  
  // Update reference title when class data or start time changes
  useEffect(() => {
    if (classData && startTime) {
      const formattedTime = startTime.split(":")[0].padStart(2, "0") + "h" + startTime.split(":")[1].padStart(2, "0");
      const referenceTitle = `${classData.name} ${formattedTime} ${format(new Date(), 'MMMM/yyyy')}`;
      form.setValue("referenceTitle", referenceTitle);
    }
  }, [classData, startTime, form]);
  
  // Auto-update start and end dates based on selected dates
  useEffect(() => {
    if (selectedDates.length > 0) {
      // Sort dates to find first and last
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      
      // Update start and end dates
      form.setValue("startDate", firstDate);
      form.setValue("endDate", lastDate);
    }
  }, [selectedDates, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
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
            control={form.control}
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
            control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
