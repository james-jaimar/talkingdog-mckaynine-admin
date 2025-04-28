
import { useState, useEffect, useRef } from 'react';
import { Calendar } from "lucide-react";
import { format, isSameDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export interface DateRange {
  from: Date;
  to?: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange>(dateRange);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Use ref to prevent unnecessary re-renders and updates
  const previousRangeRef = useRef<string>("");

  // Update local state when props change
  useEffect(() => {
    setDate(dateRange);
  }, [dateRange]);

  // Format the date range for display
  const formatDateRange = () => {
    if (!date.from) return "Select dates";
    if (!date.to) return format(date.from, "MMM d, yyyy");
    if (isSameDay(date.from, date.to)) return format(date.from, "MMM d, yyyy");
    return `${format(date.from, "MMM d, yyyy")} - ${format(date.to, "MMM d, yyyy")}`;
  };

  // Handle selection complete with debouncing to prevent excessive updates
  const handleSelection = (range: DateRange) => {
    setDate(range);
    
    // Only trigger the callback if both dates are selected and changed
    if (range.from && range.to) {
      const newRangeString = `${range.from.getTime()}-${range.to.getTime()}`;
      
      // Skip if same range selected
      if (previousRangeRef.current !== newRangeString) {
        previousRangeRef.current = newRangeString;
        onDateRangeChange(range);
      }
      
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[240px] justify-start text-left font-normal"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={date.from}
            selected={date}
            onSelect={handleSelection}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
