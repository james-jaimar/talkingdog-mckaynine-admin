
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MultiSelectBadge } from "./multi-select-badge";
import { OptionType } from "./types";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const safeValue = Array.isArray(value) ? value : [];

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenChange(!isOpen);
  };

  return (
    <div
      className={cn(
        "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-ring cursor-pointer",
        className
      )}
      onClick={toggleOpen}
    >
      <div className="flex flex-wrap gap-1 flex-1">
        {safeValue.length > 0 ? (
          safeValue.map((item, idx) => (
            <MultiSelectBadge 
              key={`badge-${item.value}-${idx}`}
              item={item} 
              index={idx}
              onUnselect={onUnselect}
            />
          ))
        ) : (
          <span className="text-sm text-muted-foreground py-1">{placeholder}</span>
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
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="sr-only">{isOpen ? "Close" : "Open"} select</span>
      </Button>
    </div>
  );
}
