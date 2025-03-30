
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
  // Safety checks for the option
  const safeOption = React.useMemo(() => {
    if (!option || typeof option !== 'object') {
      console.warn("MultiSelectItem: received invalid option:", option);
      return { label: "Unknown", value: `unknown-${index}` };
    }
    return {
      label: typeof option.label === 'string' ? option.label : "Unknown",
      value: typeof option.value === 'string' ? option.value : `unknown-${index}`,
    };
  }, [option, index]);

  const handleSelect = React.useCallback(() => {
    try {
      onSelect(safeOption);
    } catch (error) {
      console.error("Error in MultiSelectItem handleSelect:", error);
    }
  }, [safeOption, onSelect]);

  return (
    <CommandItem
      key={`option-${safeOption.value}-${safeOption.label}`}
      onSelect={handleSelect}
      className="cursor-pointer"
    >
      <span
        className={cn(
          "mr-2 h-4 w-4 rounded-sm border border-primary",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "opacity-50 [&_svg]:invisible"
        )}
      >
        {isSelected && (
          <span className="flex h-full items-center justify-center text-xs">✓</span>
        )}
      </span>
      <span>{safeOption.label}</span>
    </CommandItem>
  );
}
