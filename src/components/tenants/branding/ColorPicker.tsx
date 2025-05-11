
import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, color, onChange }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color);
  
  // Sync input value with external color prop
  useEffect(() => {
    setInputValue(color);
  }, [color]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only update parent if it's a valid hex color
    if (/^#([0-9A-F]{3}){1,2}$/i.test(newValue)) {
      onChange(newValue);
    }
  }, [onChange]);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);
    onChange(newColor);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div
          className="h-10 w-10 rounded-md border"
          style={{ backgroundColor: inputValue }}
        />
        <div className="flex-1 flex gap-2">
          <Input
            type="color"
            value={inputValue}
            onChange={handleColorChange}
            className="w-12 p-1 h-10"
          />
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="flex-1 h-10"
            placeholder="#RRGGBB"
          />
        </div>
      </div>
    </div>
  );
}
