
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";

interface HandlerDogsListProps {
  handlerId: string;
  handler: {
    first_name: string;
    last_name: string;
    dogs: any[];
  };
  onSelect: (handlerId: string, dogId: string) => void;
  isProcessing: boolean;
  processingDogId: string | null;
}

// Note: This component is kept for compatibility but is no longer used in the main flow
// It's been replaced by DogSelectionSheet
export function HandlerDogsList({ 
  handlerId, 
  handler, 
  onSelect, 
  isProcessing, 
  processingDogId 
}: HandlerDogsListProps) {
  return (
    <div key={`dogs-${handlerId}`} className="p-4 bg-slate-50 border-t">
      <h4 className="text-sm font-medium mb-2">
        Dogs belonging to {handler.first_name} {handler.last_name}:
      </h4>
      
      {handler.dogs && handler.dogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {handler.dogs.map((dog: any) => (
            <div key={dog.id} className="flex justify-between items-center p-3 bg-white rounded-md border">
              <div>
                <div className="font-medium">{dog.name}</div>
                <div className="text-sm text-muted-foreground">{dog.breed}</div>
              </div>
              <Button
                variant="mckaynine"
                size="sm"
                onClick={() => onSelect(handlerId, dog.id)}
                disabled={isProcessing}
              >
                {isProcessing && processingDogId === dog.id ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4 mr-1" />
                )}
                Add
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No dogs available to add for this handler.
        </p>
      )}
    </div>
  );
}
