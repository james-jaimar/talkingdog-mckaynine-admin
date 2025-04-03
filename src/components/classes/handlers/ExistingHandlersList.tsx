
import { useEffect } from "react";
import { 
  ErrorState, 
  LoadingHandlers, 
  LoadingSchedules, 
  NoHandlersAvailable, 
  NoSchedules 
} from "./HandlerListEmptyStates";
import { HandlersTable } from "./HandlersTable";
import { HandlerDogsList } from "./HandlerDogsList";
import { useHandlersList } from "./hooks/useHandlersList";

interface ExistingHandlersListProps {
  searchQuery: string;
  onSelect: (handlerId: string, dogId: string) => void;
  classId: string;
  isProcessing: boolean;
}

export function ExistingHandlersList({ 
  searchQuery, 
  onSelect, 
  classId, 
  isProcessing 
}: ExistingHandlersListProps) {
  const { 
    handlers,
    expandedHandlers,
    scheduleIds,
    isLoadingSchedules,
    isLoading,
    error,
    refetch,
    toggleHandler,
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
    <div className="border rounded-md">
      <HandlersTable
        handlers={handlers}
        expandedHandlers={expandedHandlers}
        toggleHandler={toggleHandler}
      />

      {/* Show dogs for expanded handlers */}
      {handlers.map(handler => {
        if (!expandedHandlers.includes(handler.id)) return null;
        
        return (
          <HandlerDogsList
            key={`dogs-${handler.id}`}
            handlerId={handler.id}
            handler={handler}
            onSelect={handleSelect}
            isProcessing={isProcessing}
            processingDogId={processingDogId}
          />
        );
      })}
    </div>
  );
}
