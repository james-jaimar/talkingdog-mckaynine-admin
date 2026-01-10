
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Percent } from "lucide-react";

interface Dog {
  id: string;
  name: string;
  breed: string;
}

interface DogSelectionSheetProps {
  handler: {
    id: string;
    first_name: string;
    last_name: string;
    dogs: Dog[];
  } | null;
  open: boolean;
  onClose: () => void;
  onSelect: (handlerId: string, dogIds: string[]) => void;
  isProcessing: boolean;
}

export function DogSelectionSheet({
  handler,
  open,
  onClose,
  onSelect,
  isProcessing,
}: DogSelectionSheetProps) {
  const [selectedDogs, setSelectedDogs] = useState<Set<string>>(new Set());

  // Reset selection when sheet opens/closes or handler changes
  useEffect(() => {
    if (open) {
      setSelectedDogs(new Set());
    }
  }, [open, handler?.id]);

  if (!handler) return null;

  const handleToggleDog = (dogId: string) => {
    const newSelected = new Set(selectedDogs);
    if (newSelected.has(dogId)) {
      newSelected.delete(dogId);
    } else {
      // Max 2 dogs allowed
      if (newSelected.size >= 2) {
        return;
      }
      newSelected.add(dogId);
    }
    setSelectedDogs(newSelected);
  };

  const handleAddSelected = () => {
    if (selectedDogs.size > 0) {
      onSelect(handler.id, Array.from(selectedDogs));
    }
  };

  const getDogSelectionOrder = (dogId: string): number => {
    const dogsArray = Array.from(selectedDogs);
    return dogsArray.indexOf(dogId) + 1;
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && !isProcessing && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader className="mb-4">
          <SheetTitle>
            Dogs for {handler.first_name} {handler.last_name}
          </SheetTitle>
          <SheetDescription>
            Select up to 2 dogs to add to this class. The 2nd dog gets a 25% discount!
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 mt-2 flex-1 overflow-y-auto pr-2">
          {handler.dogs && handler.dogs.length > 0 ? (
            handler.dogs.map((dog: Dog) => {
              const isSelected = selectedDogs.has(dog.id);
              const selectionOrder = isSelected ? getDogSelectionOrder(dog.id) : 0;
              const isSecondDog = selectionOrder === 2;
              const canSelect = selectedDogs.size < 2 || isSelected;

              return (
                <div
                  key={dog.id}
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-primary/10 border-primary" 
                      : canSelect 
                        ? "bg-white hover:bg-gray-50" 
                        : "bg-gray-100 opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => canSelect && handleToggleDog(dog.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={!canSelect || isProcessing}
                    onCheckedChange={() => handleToggleDog(dog.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {dog.name}
                      {isSecondDog && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                          <Percent className="h-3 w-3 mr-1" />
                          25% off
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{dog.breed}</div>
                  </div>
                  {isSelected && (
                    <Badge variant="outline" className="ml-auto">
                      #{selectionOrder}
                    </Badge>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground p-3">
              No dogs available to add for this handler.
            </p>
          )}
        </div>

        {selectedDogs.size === 2 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4">
            <p className="text-sm text-green-700">
              <strong>Multi-dog discount applied!</strong> The 2nd dog will receive a 25% discount on the course fee.
            </p>
          </div>
        )}

        <SheetFooter className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="mckaynine"
            onClick={handleAddSelected}
            disabled={isProcessing || selectedDogs.size === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add {selectedDogs.size} Dog{selectedDogs.size !== 1 ? "s" : ""} to Class
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
