
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchHandlersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function SearchHandlers({ searchQuery, setSearchQuery }: SearchHandlersProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search handlers by name, email, or dog name..."
        className="pl-8"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
