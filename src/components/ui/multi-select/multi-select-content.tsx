
import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { PopoverContent } from "@/components/ui/popover";
import { MultiSelectItem } from "./multi-select-item";
import { OptionType } from "./types";

interface MultiSelectContentProps {
  options: OptionType[];
  value: OptionType[];
  onSelect: (option: OptionType) => void;
}

export function MultiSelectContent({ options, value, onSelect }: MultiSelectContentProps) {
  // Safe options handling - ensure it's always a valid array
  const safeOptions = React.useMemo(() => {
    try {
      if (!options) return [];
      if (!Array.isArray(options)) return [];
      
      return options.filter(option => 
        option && 
        typeof option === 'object' && 
        'label' in option && 
        typeof option.label === 'string' &&
        'value' in option && 
        typeof option.value === 'string'
      );
    } catch (error) {
      console.error("Error in MultiSelectContent safeOptions:", error);
      return [];
    }
  }, [options]);

  // Safe value handling - ensure it's always a valid array
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
      console.error("Error in MultiSelectContent safeValue:", error);
      return [];
    }
  }, [value]);

  // Determine if an option is selected
  const isOptionSelected = React.useCallback((option: OptionType) => {
    try {
      if (!Array.isArray(safeValue)) return false;
      if (!option || typeof option !== 'object') return false;
      if (!('value' in option) || typeof option.value !== 'string') return false;
      
      return safeValue.some(item => 
        item && 
        typeof item === 'object' && 
        'value' in item && 
        typeof item.value === 'string' && 
        item.value === option.value
      );
    } catch (error) {
      console.error("Error in isOptionSelected:", error);
      return false;
    }
  }, [safeValue]);

  return (
    <PopoverContent className="w-full p-0" align="start">
      <Command className="w-full">
        {safeOptions.length === 0 ? (
          <CommandEmpty>No options available</CommandEmpty>
        ) : (
          <CommandGroup>
            {safeOptions.map((option, idx) => (
              <MultiSelectItem
                key={`option-item-${option?.value || idx}-${option?.label || idx}`}
                option={option}
                index={idx}
                isSelected={isOptionSelected(option)}
                onSelect={onSelect}
              />
            ))}
          </CommandGroup>
        )}
      </Command>
    </PopoverContent>
  );
}
