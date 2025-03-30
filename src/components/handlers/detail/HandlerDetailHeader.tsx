
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";

interface HandlerDetailHeaderProps {
  isLoading: boolean;
  handler?: {
    first_name: string;
    last_name: string;
  };
}

export function HandlerDetailHeader({ isLoading, handler }: HandlerDetailHeaderProps) {
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
      <Button variant="outline">
        <Edit className="h-4 w-4 mr-2" />
        Edit Handler
      </Button>
    </div>
  );
}
