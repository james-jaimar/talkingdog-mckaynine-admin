
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UserFilterBarProps {
  filterText: string;
  onFilterChange: (value: string) => void;
}

export function UserFilterBar({ filterText, onFilterChange }: UserFilterBarProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search users..."
        className="pl-8 w-full"
        value={filterText}
        onChange={(e) => onFilterChange(e.target.value)}
      />
    </div>
  );
}
