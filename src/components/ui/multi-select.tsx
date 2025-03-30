
import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type OptionType = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: OptionType[];
  value: OptionType[];
  onChange: (value: OptionType[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Super defensive programming - ensure we have valid arrays with valid entries
  const safeOptions = React.useMemo(() => {
    try {
      // First check if options exists and is an array
      if (!options) {
        console.warn("MultiSelect: options is undefined or null");
        return [];
      }
      
      if (!Array.isArray(options)) {
        console.warn("MultiSelect: options is not an array:", options);
        return [];
      }
      
      // Then filter out any invalid entries
      return options.filter(option => 
        option && 
        typeof option === 'object' && 
        'label' in option && 
        typeof option.label === 'string' &&
        'value' in option && 
        typeof option.value === 'string'
      );
    } catch (error) {
      console.error("Error in MultiSelect safeOptions:", error);
      return [];
    }
  }, [options]);
    
  // Ensure value is always a valid array with valid entries
  const safeValue = React.useMemo(() => {
    try {
      if (!value) {
        console.warn("MultiSelect: value is undefined or null");
        return [];
      }
      
      if (!Array.isArray(value)) {
        console.warn("MultiSelect: value is not an array:", value);
        return [];
      }
      
      return value.filter(item => 
        item && 
        typeof item === 'object' && 
        'label' in item && 
        typeof item.label === 'string' &&
        'value' in item && 
        typeof item.value === 'string'
      );
    } catch (error) {
      console.error("Error in MultiSelect safeValue:", error);
      return [];
    }
  }, [value]);

  // Log debug information
  React.useEffect(() => {
    console.log("MultiSelect render:", {
      originalOptions: options,
      originalValue: value,
      safeOptions: safeOptions,
      safeValue: safeValue,
      optionsIsArray: Array.isArray(options),
      valueIsArray: Array.isArray(value),
    });
  }, [options, value, safeOptions, safeValue]);

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-ring",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {Array.isArray(safeValue) && safeValue.length > 0 ? (
              safeValue.map((item, idx) => (
                <Badge
                  key={`item-${item?.value || idx}-${item?.label || idx}`}
                  variant="secondary"
                  className="mr-1 mb-1"
                >
                  {item?.label || "Unknown"}
                  <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleUnselect(item)}
                    type="button"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    <span className="sr-only">Remove {item?.label || "item"}</span>
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="ml-auto h-auto w-auto p-1"
            onClick={() => setOpen(!open)}
            type="button"
          >
            <span className="sr-only">{open ? "Close" : "Open"} select</span>
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="w-full">
          <CommandGroup>
            {Array.isArray(safeOptions) && safeOptions.length > 0 ? (
              safeOptions.map((option, idx) => (
                <CommandItem
                  key={`option-${option?.value || idx}-${option?.label || idx}`}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                  <span
                    className={cn(
                      "mr-2 h-4 w-4 rounded-sm border border-primary",
                      Array.isArray(safeValue) && safeValue.some((item) => 
                        item && item.value === option.value
                      )
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    {Array.isArray(safeValue) && safeValue.some((item) => 
                      item && item.value === option.value
                    ) && (
                      <span className="flex h-full items-center justify-center text-xs">✓</span>
                    )}
                  </span>
                  <span>{option?.label || "Unknown"}</span>
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled>No options available</CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
