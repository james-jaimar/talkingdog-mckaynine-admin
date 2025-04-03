
import { TabsContent } from "@/components/ui/tabs";
import { SearchHandlers } from "./SearchHandlers";
import { ExistingHandlersList } from "../ExistingHandlersList";

interface HandlerSelectionTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelect: (handlerId: string, dogId: string) => void;
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
      />
    </TabsContent>
  );
}
