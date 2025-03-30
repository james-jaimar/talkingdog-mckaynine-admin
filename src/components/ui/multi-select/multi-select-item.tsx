
import * as React from "react";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { OptionType } from "./types";

interface MultiSelectItemProps {
  option: OptionType;
  index: number;
  isSelected: boolean;
  onSelect: (option: OptionType) => void;
}

export function MultiSelectItem({ option, index, isSelected, onSelect }: MultiSelectItemProps) {
  // Safety check for the option
  if (!option || typeof option !== 'object') {
    return null;
  }
  
  const label = option.label || `Option ${index}`;
  const value = option.value || `option-${index}`;
  
  const safeOption = { label, value };

  const handleSelect = React.useCallback(() => {
    onSelect(safeOption);
  }, [safeOption, onSelect]);

  return (
    <CommandItem
      key={`option-${value}-${index}`}
      onSelect={handleSelect}
      className="cursor-pointer"
      value={value}
    >
      <div className="flex items-center gap-2 w-full">
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "opacity-50 [&_svg]:invisible"
          )}
        >
          {isSelected && (
            <span className="flex h-full items-center justify-center text-xs">✓</span>
          )}
        </div>
        <span>{label}</span>
      </div>
    </CommandItem>
  );
}
