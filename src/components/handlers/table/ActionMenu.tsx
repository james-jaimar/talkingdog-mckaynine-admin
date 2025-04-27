
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import { useState } from "react";
import { EditHandlerModal } from "../EditHandlerModal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { deleteHandler } from "@/lib/api/handlers";

interface ActionMenuProps {
  handler: {
    id: string;
    first_name: string;
    last_name?: string;
    email?: string; // Make email optional to match HandlerTableRow
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    notes?: string;
    branch_id?: string | null;
    uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
    social_media_consent_status: 'yes' | 'no' | 'not_marked';
  };
}

export function ActionMenu({ handler }: ActionMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteHandler(handler.id);
      toast({
        title: "Handler deleted",
        description: "The handler has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["handlers"] });
    } catch (error) {
      console.error("Error deleting handler:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete handler",
        description: "There was an error deleting the handler",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewHandler = () => {
    console.log("Navigating to handler detail:", `/handlers/${handler.id}`);
    navigate(`/handlers/${handler.id}`);
  };

  return (
    <div className="flex justify-end items-center space-x-1">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleViewHandler}
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">View</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon"
        id={`edit-handler-${handler.id}`}
      >
        <EditHandlerModal handler={handler} onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["handlers"] });
        }}>
          <Pencil className="h-4 w-4" />
        </EditHandlerModal>
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleViewHandler}>
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            const editButton = document.getElementById(`edit-handler-${handler.id}`) as HTMLButtonElement;
            if (editButton) editButton.click();
          }}>
            Edit handler
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDelete} 
            disabled={isDeleting} 
            className="text-red-600"
          >
            Delete handler
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
