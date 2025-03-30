
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";

interface HandlerDetailHeaderProps {
  isLoading: boolean;
  handler?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export function HandlerDetailHeader({ isLoading, handler }: HandlerDetailHeaderProps) {
  const navigate = useNavigate();
  
  const handleEditClick = () => {
    if (handler?.id) {
      // For now, we'll just show an alert since we don't have an edit form implemented yet
      // In a real app, this would navigate to an edit page or open an edit modal
      alert(`Edit handler functionality for ${handler.first_name} ${handler.last_name} will be implemented soon.`);
      
      // Alternatively, we could redirect to a future edit page like this:
      // navigate(`/handlers/edit/${handler.id}`);
    }
  };
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link to="/handlers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isLoading ? 'Loading...' : `${handler?.first_name} ${handler?.last_name}`}
        </h1>
      </div>
      <Button variant="outline" onClick={handleEditClick}>
        <Edit className="h-4 w-4 mr-2" />
        Edit Handler
      </Button>
    </div>
  );
}
