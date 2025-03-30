
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

  // Enhanced defensive programming to ensure we never have undefined values
  const safeOptions = React.useMemo(() => {
    // Ensure options is always a valid array with valid entries
    if (!options || !Array.isArray(options)) {
      console.log("MultiSelect received invalid options:", options);
      return [];
    }
    
    return options.filter(option => 
      option && 
      typeof option === 'object' && 
      'label' in option && 
      typeof option.label === 'string' &&
      'value' in option && 
      typeof option.value === 'string'
    );
  }, [options]);
    
  const safeValue = React.useMemo(() => {
    // Ensure value is always a valid array with valid entries
    if (!value || !Array.isArray(value)) {
      console.log("MultiSelect received invalid value:", value);
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
  }, [value]);

  // Log current state for debugging
  React.useEffect(() => {
    console.log("MultiSelect state:", {
      originalOptions: options,
      originalValue: value,
      safeOptions,
      safeValue,
    });
  }, [options, value, safeOptions, safeValue]);

  const handleUnselect = (item: OptionType) => {
    try {
      if (!item || typeof item !== 'object' || !('value' in item)) {
        console.error("Invalid item to unselect:", item);
        return;
      }
      
      const newValue = safeValue.filter(i => i.value !== item.value);
      console.log("Unselecting item:", item, "New value:", newValue);
      onChange(newValue);
    } catch (error) {
      console.error("Error in handleUnselect:", error);
      // Don't modify the value if there's an error
    }
  };

  const handleSelect = (item: OptionType) => {
    try {
      if (!item || typeof item !== 'object' || !('value' in item)) {
        console.error("Invalid item to select:", item);
        return;
      }
      
      // Check if item is already selected
      const isSelected = safeValue.some(i => i.value === item.value);
      
      let newValue: OptionType[];
      if (isSelected) {
        // Remove it
        newValue = safeValue.filter(i => i.value !== item.value);
      } else {
        // Add it
        newValue = [...safeValue, item];
      }

      console.log("Selecting item:", item, "New value:", newValue);
      onChange(newValue);
    } catch (error) {
      console.error("Error in handleSelect:", error);
      // Don't modify the value if there's an error
    }
  };

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
            {safeValue.length > 0 ? (
              safeValue.map((item) => (
                <Badge
                  key={`item-${item.value}-${item.label}`}
                  variant="secondary"
                  className="mr-1 mb-1"
                >
                  {item.label}
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
                    <span className="sr-only">Remove {item.label}</span>
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
            {safeOptions.length > 0 ? (
              safeOptions.map((option) => (
                <CommandItem
                  key={`option-${option.value}-${option.label}`}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                  <span
                    className={cn(
                      "mr-2 h-4 w-4 rounded-sm border border-primary",
                      safeValue.some((item) => item.value === option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    {safeValue.some((item) => item.value === option.value) && (
                      <span className="flex h-full items-center justify-center text-xs">✓</span>
                    )}
                  </span>
                  <span>{option.label}</span>
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
