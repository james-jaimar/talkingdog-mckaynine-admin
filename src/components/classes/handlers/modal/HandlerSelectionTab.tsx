
import { TabsContent } from "@/components/ui/tabs";
import { SearchHandlers } from "./SearchHandlers";
import { ExistingHandlersList } from "../ExistingHandlersList";
import { useState } from "react";

interface HandlerSelectionTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelect: (handlerId: string, dogIds: string[]) => void;
  classId: string;
  isProcessing: boolean;
}

export function HandlerSelectionTab({
  searchQuery,
  setSearchQuery,
  onSelect,
  classId,
  isProcessing
}: HandlerSelectionTabProps) {
  // Track selected handler for displaying dogs
  const [selectedHandlerId, setSelectedHandlerId] = useState<string | null>(null);
  
  return (
    <TabsContent value="existing" className="space-y-4">
      <SearchHandlers
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <ExistingHandlersList 
        searchQuery={searchQuery}
        onSelect={onSelect}
        classId={classId}
        isProcessing={isProcessing}
        selectedHandlerId={selectedHandlerId}
        setSelectedHandlerId={setSelectedHandlerId}
      />
    </TabsContent>
  );
}
