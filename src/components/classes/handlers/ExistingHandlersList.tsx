
import { useEffect } from "react";
import { 
  ErrorState, 
  LoadingHandlers, 
  LoadingSchedules, 
  NoHandlersAvailable, 
  NoSchedules 
} from "./HandlerListEmptyStates";
import { HandlersTable } from "./HandlersTable";
import { DogSelectionSheet } from "./DogSelectionSheet";
import { useHandlersList } from "./hooks/useHandlersList";

interface ExistingHandlersListProps {
  searchQuery: string;
  onSelect: (handlerId: string, dogIds: string[]) => void;
  classId: string;
  branchId: string;
  isProcessing: boolean;
  selectedHandlerId: string | null;
  setSelectedHandlerId: (id: string | null) => void;
}

export function ExistingHandlersList({ 
  searchQuery, 
  onSelect, 
  classId, 
  branchId,
  isProcessing,
  selectedHandlerId,
  setSelectedHandlerId
}: ExistingHandlersListProps) {
  const { 
    handlers,
    scheduleIds,
    isLoadingSchedules,
    isLoading,
    error,
    refetch,
  } = useHandlersList(classId, searchQuery, branchId);

  // Handle handler selection with multiple dogs
  const handleSelect = (handlerId: string, dogIds: string[]) => {
    onSelect(handlerId, dogIds);
  };

  // Get the selected handler data
  const selectedHandler = selectedHandlerId 
    ? handlers.find(handler => handler.id === selectedHandlerId)
    : null;

  if (isLoadingSchedules) {
    return <LoadingSchedules />;
  }

  if (!scheduleIds || scheduleIds.length === 0) {
    return <NoSchedules />;
  }

  if (isLoading) {
    return <LoadingHandlers />;
  }

  if (error) {
    return <ErrorState refetch={refetch} />;
  }

  if (!handlers || handlers.length === 0) {
    return <NoHandlersAvailable />;
  }

  return (
    <>
      <div className="border rounded-md">
        <HandlersTable
          handlers={handlers}
          onShowDogs={setSelectedHandlerId}
        />
      </div>

      {/* Dogs selection sheet */}
      <DogSelectionSheet
        handler={selectedHandler}
        open={!!selectedHandlerId}
        onClose={() => setSelectedHandlerId(null)}
        onSelect={handleSelect}
        isProcessing={isProcessing}
      />
    </>
  );
}
