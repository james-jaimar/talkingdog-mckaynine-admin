
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

export function MultiSelectContent({ options, value, onSelect }: MultiSelectContentProps) {
  // Ensure we have arrays to work with
  const safeOptions = Array.isArray(options) ? options : [];
  const safeValue = Array.isArray(value) ? value : [];

  const isOptionSelected = (option: OptionType) => {
    return safeValue.some(item => item.value === option.value);
  };

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
                  key={`${option.value || idx}`}
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
}
