
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EditHandlerModal } from "@/components/handlers/EditHandlerModal";

interface HandlerDetailHeaderProps {
  isLoading: boolean;
  handler?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    notes?: string;
  };
  onHandlerUpdated?: () => void;
}

export function HandlerDetailHeader({ isLoading, handler, onHandlerUpdated }: HandlerDetailHeaderProps) {
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
      {!isLoading && handler && (
        <EditHandlerModal handler={handler} onSuccess={onHandlerUpdated} />
      )}
    </div>
  );
}
