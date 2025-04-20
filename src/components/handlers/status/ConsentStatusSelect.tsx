
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConsentStatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ConsentStatusSelect({ value, onChange, className }: ConsentStatusSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="yes">Yes</SelectItem>
        <SelectItem value="no">No</SelectItem>
        <SelectItem value="not_marked">Not Marked</SelectItem>
      </SelectContent>
    </Select>
  );
}
