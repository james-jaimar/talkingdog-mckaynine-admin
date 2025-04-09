
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInvoicesProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function SearchInvoices({ searchTerm, onSearchChange }: SearchInvoicesProps) {
  return (
    <div className="mb-4 relative">
      <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search invoices by number or client..."
        className="pl-8"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
