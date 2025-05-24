
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
import { ExtendedBadge } from "@/components/ui/badge-variants";

export function BranchSelector() {
  // Define a type-safe default state that matches the BranchContextType structure
  let branchInfo = { 
    branches: [] as { id: string; name: string }[], 
    currentBranch: null as { id: string; name: string } | null, 
    setCurrentBranch: (branch: { id: string; name: string } | null) => {}, 
    isLoading: true 
  };
  
  try {
    branchInfo = useBranch();
  } catch (error) {
    console.error("Error accessing branch context:", error);
  }
  
  const { branches, currentBranch, setCurrentBranch, isLoading } = branchInfo;

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
      <ExtendedBadge variant="amber" className="flex items-center gap-2 px-3 py-1">
        <GitBranch className="w-4 h-4" />
        <span>No branches available</span>
      </ExtendedBadge>
    );
  }
  
  const handleBranchChange = (value: string) => {
    const branch = branches.find(b => b.id === value);
    if (branch) {
      console.log("Switching branch to:", branch.name, branch.id);
      setCurrentBranch(branch);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <GitBranch className="w-4 h-4 text-muted-foreground" />
      <Select
        value={currentBranch?.id || ""}
        onValueChange={handleBranchChange}
      >
        <SelectTrigger className="w-[180px] bg-white border-gray-300" style={{ color: '#000000' }}>
          <SelectValue placeholder="Select branch" style={{ color: '#000000' }} />
        </SelectTrigger>
        <SelectContent className="z-50 bg-white border-gray-300" style={{ color: '#000000' }}>
          {branches.map((branch) => (
            <SelectItem 
              key={branch.id} 
              value={branch.id} 
              className="hover:bg-gray-100" 
              style={{ color: '#000000' }}
            >
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
