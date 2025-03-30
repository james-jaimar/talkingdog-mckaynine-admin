
import { GitBranch } from "lucide-react";
import { useBranch } from "@/context/BranchContext";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function BranchSelector() {
  const { branches, currentBranch, setCurrentBranch, isLoading } = useBranch();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-muted-foreground" />
        <Skeleton className="h-8 w-[150px]" />
      </div>
    );
  }

  if (!branches || branches.length === 0) {
    return (
      <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
        <GitBranch className="w-4 h-4" />
        <span>No branches available</span>
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <GitBranch className="w-4 h-4 text-muted-foreground" />
      <Select
        value={currentBranch?.id || ""}
        onValueChange={(value) => {
          const branch = branches.find(b => b.id === value);
          if (branch) {
            setCurrentBranch(branch);
          }
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
