
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MultiSelectBadge } from "./multi-select-badge";
import { OptionType } from "./types";

interface MultiSelectTriggerProps {
  value: OptionType[];
  placeholder: string;
  className?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUnselect: (item: OptionType) => void;
}

export function MultiSelectTrigger({
  value,
  placeholder,
  className,
  isOpen,
  onOpenChange,
  onUnselect
}: MultiSelectTriggerProps) {
  // Ensure value is always a valid array
  const safeValue = React.useMemo(() => {
    try {
      if (!value) return [];
      if (!Array.isArray(value)) return [];
      
      return value.filter(item => 
        item && 
        typeof item === 'object' && 
        'label' in item && 
        typeof item.label === 'string' &&
        'value' in item && 
        typeof item.value === 'string'
      );
    } catch (error) {
      console.error("Error in MultiSelectTrigger safeValue:", error);
      return [];
    }
  }, [value]);

  const toggleOpen = React.useCallback(() => {
    try {
      onOpenChange(!isOpen);
    } catch (error) {
      console.error("Error in MultiSelectTrigger toggleOpen:", error);
    }
  }, [isOpen, onOpenChange]);

  return (
    <div
      className={cn(
        "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-ring",
        className
      )}
    >
      <div className="flex flex-wrap gap-1">
        {Array.isArray(safeValue) && safeValue.length > 0 ? (
          safeValue.map((item, idx) => (
            <MultiSelectBadge 
              key={`badge-${item?.value || idx}-${item?.label || idx}`}
              item={item} 
              index={idx}
              onUnselect={onUnselect}
            />
          ))
        ) : (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
      </div>
      <Button
        variant="ghost"
        role="combobox"
        aria-expanded={isOpen}
        className="ml-auto h-auto w-auto p-1"
        onClick={toggleOpen}
        type="button"
      >
        <span className="sr-only">{isOpen ? "Close" : "Open"} select</span>
      </Button>
    </div>
  );
}
