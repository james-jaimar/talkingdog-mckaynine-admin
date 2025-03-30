
import * as React from "react";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelectTrigger } from "./multi-select-trigger";
import { MultiSelectContent } from "./multi-select-content";
import { MultiSelectProps, OptionType } from "./types";

// Re-export the OptionType for consumers
export type { OptionType } from "./types";
export type { MultiSelectProps } from "./types";

export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Ensure we have valid arrays
  const safeOptions = React.useMemo(() => {
    if (!options || !Array.isArray(options)) {
      console.warn("MultiSelect received invalid options:", options);
      return [];
    }
    return options.filter(Boolean);
  }, [options]);
    
  const safeValue = React.useMemo(() => {
    if (!value || !Array.isArray(value)) {
      console.warn("MultiSelect received invalid value:", value);
      return [];
    }
    return value.filter(Boolean);
  }, [value]);

  // Safe handler for unselecting an item
  const handleUnselect = React.useCallback((item: OptionType) => {
    if (!item) return;
    
    const newValue = safeValue.filter(i => i?.value !== item?.value);
    
    if (typeof onChange === 'function') {
      onChange(newValue);
    }
  }, [safeValue, onChange]);

  // Safe handler for selecting an item
  const handleSelect = React.useCallback((item: OptionType) => {
    if (!item) return;
    
    const currentValue = [...safeValue];
    const isSelected = currentValue.some(i => i?.value === item?.value);
    
    let newValue: OptionType[];
    if (isSelected) {
      newValue = currentValue.filter(i => i?.value !== item?.value);
    } else {
      newValue = [...currentValue, item];
    }

    if (typeof onChange === 'function') {
      onChange(newValue);
    }
  }, [safeValue, onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <MultiSelectTrigger
          value={safeValue}
          placeholder={placeholder}
          className={className}
          isOpen={open}
          onOpenChange={setOpen}
          onUnselect={handleUnselect}
        />
      </PopoverTrigger>
      <MultiSelectContent
        options={safeOptions}
        value={safeValue}
        onSelect={handleSelect}
      />
    </Popover>
  );
}
