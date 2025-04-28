
import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar } from "lucide-react";
import { format, isSameDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";

export interface DateRange {
  from: Date;
  to?: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export function DateRangePicker({ 
  dateRange, 
  onDateRangeChange, 
  className, 
  isLoading = false, 
  disabled = false 
}: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange>(dateRange);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Use ref to prevent unnecessary re-renders and debounce updates
  const previousRangeRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when props change
  useEffect(() => {
    setDate(dateRange);
  }, [dateRange]);

  // Format the date range for display
  const formatDateRange = useCallback(() => {
    if (!date.from) return "Select dates";
    if (!date.to) return format(date.from, "MMM d, yyyy");
    if (isSameDay(date.from, date.to)) return format(date.from, "MMM d, yyyy");
    return `${format(date.from, "MMM d, yyyy")} - ${format(date.to, "MMM d, yyyy")}`;
  }, [date]);

  // Handle selection with debouncing to prevent excessive updates
  const handleSelection = useCallback((range: DateRange) => {
    setDate(range);
    
    // Only trigger the callback if both dates are selected
    if (range.from && range.to) {
      const newRangeString = `${range.from.getTime()}-${range.to.getTime()}`;
      
      // Skip if same range selected
      if (previousRangeRef.current !== newRangeString) {
        previousRangeRef.current = newRangeString;
        
        // Clear any existing debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        // Debounce the update to prevent multiple rapid changes
        debounceTimerRef.current = setTimeout(() => {
          onDateRangeChange(range);
        }, 300);
      }
      
      setIsCalendarOpen(false);
    }
  }, [onDateRangeChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Show skeleton when loading
  if (isLoading) {
    return <Skeleton className="w-[240px] h-[38px]" />;
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
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
