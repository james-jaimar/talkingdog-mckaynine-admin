
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface HandlerSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function HandlerSearchBar({ 
  searchQuery, 
  onSearchChange 
}: HandlerSearchBarProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="pt-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search handlers or dogs..."
            className="pl-8 w-full max-w-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
