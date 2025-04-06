
import { Input } from "@/components/ui/input";

interface EditableCellProps {
  isEditing: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function EditableCell({ isEditing, value, onChange }: EditableCellProps) {
  return isEditing ? (
    <Input 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      className="h-8 text-sm"
    />
  ) : (
    value || '-'
  );
}
