
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

  const handleUnselect = (item: OptionType) => {
    if (!item || !item.value) return;
    
    const newValue = Array.isArray(value) 
      ? value.filter((i) => i && i.value && i.value !== item.value) 
      : [];
    onChange(newValue);
  };

  const handleSelect = (item: OptionType) => {
    if (!item || !item.value) return;
    
    // Check if item is already selected
    const isSelected = Array.isArray(value) && 
      value.some((i) => i && i.value && i.value === item.value);
    
    if (isSelected) {
      // Remove it
      onChange(value.filter((i) => i && i.value && i.value !== item.value));
    } else {
      // Add it
      onChange([...(Array.isArray(value) ? value : []), item]);
    }
  };

  // Ensure options is always an array of valid objects
  const safeOptions = Array.isArray(options) 
    ? options.filter(option => option && typeof option === 'object')
    : [];
    
  // Ensure value is always an array of valid objects
  const safeValue = Array.isArray(value) 
    ? value.filter(item => item && typeof item === 'object')
    : [];

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
                  key={item?.value || `empty-${Math.random()}`}
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
            {safeOptions.length > 0 ? (
              safeOptions.map((option) => (
                <CommandItem
                  key={option?.value || `option-${Math.random()}`}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                  <span
                    className={cn(
                      "mr-2 h-4 w-4 rounded-sm border border-primary",
                      safeValue.some((item) => item?.value === option?.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    {safeValue.some((item) => item?.value === option?.value) && (
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
