
import { Button } from "@/components/ui/button";

// Define the alphabet groups for pagination
export const alphabetGroups = [
  { label: "A", range: ["A"] },
  { label: "B", range: ["B"] },
  { label: "C", range: ["C"] },
  { label: "D", range: ["D"] },
  { label: "E", range: ["E"] },
  { label: "F", range: ["F"] },
  { label: "G", range: ["G"] },
  { label: "H", range: ["H"] },
  { label: "I-J", range: ["I", "J"] },
  { label: "K", range: ["K"] },
  { label: "L", range: ["L"] },
  { label: "M-N", range: ["M", "N"] },
  { label: "O-P", range: ["O", "P"] },
  { label: "Q-R-S", range: ["Q", "R", "S"] },
  { label: "T-U-V", range: ["T", "U", "V"] },
  { label: "W-X-Y-Z", range: ["W", "X", "Y", "Z"] },
];

interface HandlerAlphabetPaginationProps {
  currentGroup: string;
  onGroupChange: (group: string) => void;
}

export function HandlerAlphabetPagination({ 
  currentGroup, 
  onGroupChange 
}: HandlerAlphabetPaginationProps) {
  return (
    <div className="flex overflow-x-auto py-2 space-x-1">
      {alphabetGroups.map((group) => (
        <Button
          key={group.label}
          variant={currentGroup === group.label ? "default" : "outline"}
          className="min-w-10 px-2"
          onClick={() => onGroupChange(group.label)}
        >
          {group.label}
        </Button>
      ))}
    </div>
  );
}
