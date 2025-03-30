
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
  const safeOptions = Array.isArray(options) ? options : [];
  const safeValue = Array.isArray(value) ? value : [];

  // Handle unselecting an item
  const handleUnselect = (item: OptionType) => {
    const newValue = safeValue.filter(i => i.value !== item.value);
    if (typeof onChange === 'function') {
      onChange(newValue);
    }
  };

  // Handle selecting an item
  const handleSelect = (item: OptionType) => {
    const isSelected = safeValue.some(i => i.value === item.value);
    
    let newValue: OptionType[];
    if (isSelected) {
      newValue = safeValue.filter(i => i.value !== item.value);
    } else {
      newValue = [...safeValue, item];
    }

    if (typeof onChange === 'function') {
      onChange(newValue);
    }
  };

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
