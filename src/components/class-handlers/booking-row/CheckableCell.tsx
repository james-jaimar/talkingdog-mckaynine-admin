
import { Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface CheckableCellProps {
  isEditing: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckableCell({ isEditing, checked, onChange }: CheckableCellProps) {
  return isEditing ? (
    <Checkbox 
      checked={checked} 
      onCheckedChange={onChange}
      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
    />
  ) : (
    checked ? <Check className="mx-auto h-4 w-4 text-green-600" /> : null
  );
}
