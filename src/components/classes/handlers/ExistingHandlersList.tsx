
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
  onSelect: (handlerId: string, dogId: string) => void;
  classId: string;
  isProcessing: boolean;
  selectedHandlerId: string | null;
  setSelectedHandlerId: (id: string | null) => void;
}

export function ExistingHandlersList({ 
  searchQuery, 
  onSelect, 
  classId, 
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
    processingDogId,
    setProcessingDogId
  } = useHandlersList(classId, searchQuery);

  // Handle handler selection with processing state
  const handleSelect = (handlerId: string, dogId: string) => {
    setProcessingDogId(dogId);
    onSelect(handlerId, dogId);
  };

  // Reset processing dog ID when global processing state changes
  useEffect(() => {
    if (!isProcessing) {
      setProcessingDogId(null);
    }
  }, [isProcessing]);

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
        processingDogId={processingDogId}
      />
    </>
  );
}
