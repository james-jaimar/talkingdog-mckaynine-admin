import { format, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useEffect } from "react";

interface MobileDateSelectorProps {
  dates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function MobileDateSelector({ 
  dates, 
  selectedDate, 
  onSelectDate 
}: MobileDateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sort dates chronologically
  const sortedDates = [...dates].sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Auto-scroll to selected date or today
  useEffect(() => {
    if (scrollRef.current && selectedDate) {
      const selectedButton = scrollRef.current.querySelector(`[data-date="${selectedDate}"]`);
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  // Find today's date if it exists in the list
  useEffect(() => {
    if (!selectedDate && sortedDates.length > 0) {
      const todayDate = sortedDates.find(d => isToday(parseISO(d)));
      if (todayDate) {
        onSelectDate(todayDate);
      } else {
        // Select first upcoming date
        const now = new Date();
        const upcomingDate = sortedDates.find(d => parseISO(d) >= now);
        if (upcomingDate) {
          onSelectDate(upcomingDate);
        } else {
          // Fallback to most recent date
          onSelectDate(sortedDates[sortedDates.length - 1]);
        }
      }
    }
  }, [sortedDates, selectedDate, onSelectDate]);

  if (sortedDates.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
        <CalendarDays className="h-4 w-4" />
        <span>No class dates scheduled</span>
      </div>
    );
  }

  const currentIndex = selectedDate ? sortedDates.indexOf(selectedDate) : -1;

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectDate(sortedDates[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < sortedDates.length - 1) {
      onSelectDate(sortedDates[currentIndex + 1]);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={handlePrev}
          disabled={currentIndex <= 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Scrollable Date Pills */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-hide flex gap-2 py-1"
        >
          {sortedDates.map((date) => {
            const dateObj = parseISO(date);
            const isSelected = date === selectedDate;
            const isTodayDate = isToday(dateObj);
            
            return (
              <button
                key={date}
                data-date={date}
                onClick={() => onSelectDate(date)}
                className={`
                  shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                  active:scale-95
                  ${isSelected 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                  }
                  ${isTodayDate && !isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
                `}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs opacity-70">
                    {format(dateObj, 'EEE')}
                  </span>
                  <span className="font-semibold">
                    {format(dateObj, 'd MMM')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={handleNext}
          disabled={currentIndex >= sortedDates.length - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
