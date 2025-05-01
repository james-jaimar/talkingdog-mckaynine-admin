
import { useState, useCallback } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export function useDateRangePickerState() {
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(today),
    to: endOfMonth(today)
  });

  // Preset date ranges
  const currentMonth = () => {
    const from = startOfMonth(today);
    const to = endOfMonth(today);
    setDateRange({ from, to });
  };
  
  const previousMonth = () => {
    const previousMonthDate = subMonths(today, 1);
    const from = startOfMonth(previousMonthDate);
    const to = endOfMonth(previousMonthDate);
    setDateRange({ from, to });
  };
  
  const last3Months = () => {
    const from = startOfMonth(subMonths(today, 2));
    const to = endOfMonth(today);
    setDateRange({ from, to });
  };
  
  const last6Months = () => {
    const from = startOfMonth(subMonths(today, 5));
    const to = endOfMonth(today);
    setDateRange({ from, to });
  };

  const DateRangePicker = useCallback(() => {
    return (
      <div className="grid gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className="w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="space-y-2 p-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={currentMonth}
                  className="text-xs"
                >
                  Current Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousMonth}
                  className="text-xs"
                >
                  Previous Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={last3Months}
                  className="text-xs"
                >
                  Last 3 Months
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={last6Months}
                  className="text-xs"
                >
                  Last 6 Months
                </Button>
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }, [dateRange]);

  return {
    dateRange, 
    setDateRange,
    DateRangePicker
  };
}
