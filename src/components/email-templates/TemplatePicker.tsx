import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface TemplateOption {
  value: string;
  label: string;
  badge?: string | null;
  group: string;
}

interface TemplatePickerProps {
  options: TemplateOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TemplatePicker({
  options,
  value,
  onChange,
  placeholder = "Choose a template...",
}: TemplatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  // Preserve group order as provided, templates sorted A-Z within each group
  const groups: string[] = [];
  for (const option of options) {
    if (!groups.includes(option.group)) groups.push(option.group);
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 z-[100]"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search templates..." />
          <CommandList
            className="max-h-[320px]"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <CommandEmpty>No template found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group} heading={group}>
                {options
                  .filter((o) => o.group === group)
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((option) => (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.badge ?? ""}`}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1 truncate">{option.label}</span>
                      {option.badge && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {option.badge}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
