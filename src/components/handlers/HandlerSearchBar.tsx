
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useBranch } from "@/context/BranchContext";

interface HandlerSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function HandlerSearchBar({ 
  searchQuery, 
  onSearchChange 
}: HandlerSearchBarProps) {
  const { currentBranch } = useBranch();

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search handlers or dogs..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          {currentBranch && (
            <div className="text-sm text-muted-foreground">
              Showing handlers for: <span className="font-medium text-primary">{currentBranch.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
