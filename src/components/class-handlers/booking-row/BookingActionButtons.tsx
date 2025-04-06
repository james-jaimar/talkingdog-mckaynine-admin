
import { Button } from "@/components/ui/button";
import { Save, Pencil, UserMinus } from "lucide-react";

interface BookingActionButtonsProps {
  isEditing: boolean;
  onSave: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

export function BookingActionButtons({ isEditing, onSave, onEdit, onRemove }: BookingActionButtonsProps) {
  return (
    <div className="flex space-x-2">
      {isEditing ? (
        <Button 
          size="sm" 
          variant="outline"
          onClick={onSave}
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )}
      
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive hover:bg-red-50"
        onClick={onRemove}
      >
        <UserMinus className="h-4 w-4" />
      </Button>
    </div>
  );
}
