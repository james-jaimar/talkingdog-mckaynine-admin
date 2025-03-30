
import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandList } from "@/components/ui/command";
import { PopoverContent } from "@/components/ui/popover";
import { MultiSelectItem } from "./multi-select-item";
import { OptionType } from "./types";

interface MultiSelectContentProps {
  options: OptionType[];
  value: OptionType[];
  onSelect: (option: OptionType) => void;
}

export const MultiSelectContent = React.memo(function MultiSelectContent({ 
  options, 
  value, 
  onSelect 
}: MultiSelectContentProps) {
  const safeOptions = React.useMemo(() => {
    return Array.isArray(options) ? options.filter(Boolean) : [];
  }, [options]);

  const safeValue = React.useMemo(() => {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }, [value]);

  const isOptionSelected = React.useCallback((option: OptionType) => {
    if (!option || !Array.isArray(safeValue)) return false;
    return safeValue.some(item => item?.value === option?.value);
  }, [safeValue]);

  return (
    <PopoverContent className="w-full p-0" align="start">
      <Command>
        <CommandList>
          {safeOptions.length === 0 ? (
            <CommandEmpty>No options available</CommandEmpty>
          ) : (
            <CommandGroup>
              {safeOptions.map((option, idx) => (
                <MultiSelectItem
                  key={`${option?.value || idx}`}
                  option={option}
                  index={idx}
                  isSelected={isOptionSelected(option)}
                  onSelect={onSelect}
                />
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </PopoverContent>
  );
});
