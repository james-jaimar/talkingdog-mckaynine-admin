
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

  // Super defensive programming - ensure we have valid arrays with valid entries
  const safeOptions = React.useMemo(() => {
    try {
      console.log("MultiSelect input options:", options);
      
      // First check if options exists and is an array
      if (!options) {
        console.warn("MultiSelect: options is undefined or null, using empty array");
        return [];
      }
      
      if (!Array.isArray(options)) {
        console.warn("MultiSelect: options is not an array, using empty array:", options);
        return [];
      }
      
      // Then filter out any invalid entries
      const validOptions = options.filter(option => 
        option && 
        typeof option === 'object' && 
        'label' in option && 
        typeof option.label === 'string' &&
        'value' in option && 
        typeof option.value === 'string'
      );
      
      console.log("MultiSelect safeOptions:", validOptions);
      return validOptions;
    } catch (error) {
      console.error("Error in MultiSelect safeOptions:", error);
      return [];
    }
  }, [options]);
    
  // Ensure value is always a valid array with valid entries
  const safeValue = React.useMemo(() => {
    try {
      console.log("MultiSelect input value:", value);
      
      if (!value) {
        console.warn("MultiSelect: value is undefined or null, using empty array");
        return [];
      }
      
      if (!Array.isArray(value)) {
        console.warn("MultiSelect: value is not an array, using empty array:", value);
        return [];
      }
      
      const validValue = value.filter(item => 
        item && 
        typeof item === 'object' && 
        'label' in item && 
        typeof item.label === 'string' &&
        'value' in item && 
        typeof item.value === 'string'
      );
      
      console.log("MultiSelect safeValue:", validValue);
      return validValue;
    } catch (error) {
      console.error("Error in MultiSelect safeValue:", error);
      return [];
    }
  }, [value]);

  // Log debug information
  React.useEffect(() => {
    console.log("MultiSelect render:", {
      optionsIsArray: Array.isArray(options),
      valueIsArray: Array.isArray(value),
      safeOptionsLength: safeOptions?.length || 0,
      safeValueLength: safeValue?.length || 0,
      open
    });
  }, [options, value, safeOptions, safeValue, open]);

  // Ultra-safe handler for unselecting an item
  const handleUnselect = React.useCallback((item: OptionType) => {
    try {
      // Validate the item to unselect
      if (!item || typeof item !== 'object' || !('value' in item) || typeof item.value !== 'string') {
        console.error("Invalid item to unselect:", item);
        return;
      }
      
      // Create a defensive copy and filter the value safely
      const newValue = Array.isArray(safeValue) 
        ? safeValue.filter(i => i && typeof i === 'object' && 'value' in i && i.value !== item.value)
        : [];
        
      console.log("Unselecting item:", item, "New value:", newValue);
      
      // Call the onChange handler only if we have a valid function
      if (typeof onChange === 'function') {
        onChange(newValue);
      } else {
        console.error("MultiSelect: onChange is not a function");
      }
    } catch (error) {
      console.error("Error in handleUnselect:", error);
      // Don't modify the value if there's an error
    }
  }, [safeValue, onChange]);

  // Ultra-safe handler for selecting an item
  const handleSelect = React.useCallback((item: OptionType) => {
    try {
      // Validate the item to select
      if (!item || typeof item !== 'object' || !('value' in item) || typeof item.value !== 'string') {
        console.error("Invalid item to select:", item);
        return;
      }
      
      // Create a defensive copy of the current value
      const currentValue = Array.isArray(safeValue) ? [...safeValue] : [];
      
      // Check if item is already selected
      const isSelected = currentValue.some(i => 
        i && typeof i === 'object' && 'value' in i && i.value === item.value
      );
      
      let newValue: OptionType[];
      if (isSelected) {
        // Remove it if selected
        newValue = currentValue.filter(i => 
          i && typeof i === 'object' && 'value' in i && i.value !== item.value
        );
      } else {
        // Add it if not selected
        newValue = [...currentValue, item];
      }

      console.log("Selecting/deselecting item:", item, "New value:", newValue);
      
      // Call the onChange handler only if we have a valid function
      if (typeof onChange === 'function') {
        onChange(newValue);
      } else {
        console.error("MultiSelect: onChange is not a function");
      }
    } catch (error) {
      console.error("Error in handleSelect:", error);
      // Don't modify the value if there's an error
    }
  }, [safeValue, onChange]);

  // Debug info
  React.useEffect(() => {
    if (!safeOptions || safeOptions.length === 0) {
      console.warn("MultiSelect: No valid options provided");
    }
  }, [safeOptions]);

  // Memoize the content to prevent unnecessary re-renders and ensure stability
  const content = React.useMemo(() => (
    <MultiSelectContent
      options={safeOptions || []}
      value={safeValue || []}
      onSelect={handleSelect}
    />
  ), [safeOptions, safeValue, handleSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <MultiSelectTrigger
          value={safeValue || []}
          placeholder={placeholder}
          className={className}
          isOpen={open}
          onOpenChange={setOpen}
          onUnselect={handleUnselect}
        />
      </PopoverTrigger>
      {content}
    </Popover>
  );
}
