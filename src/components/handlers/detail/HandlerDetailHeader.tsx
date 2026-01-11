
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EditHandlerModal } from "@/components/handlers/EditHandlerModal";
import { useIsMobile } from "@/hooks/useIsMobile";

interface HandlerDetailHeaderProps {
  isLoading: boolean;
  handler?: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    notes?: string;
    branch_id?: string;
    uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
    social_media_consent_status: 'yes' | 'no' | 'not_marked';
  };
  onHandlerUpdated?: () => void;
}

export function HandlerDetailHeader({ isLoading, handler, onHandlerUpdated }: HandlerDetailHeaderProps) {
  const isMobile = useIsMobile();

  console.log("HandlerDetailHeader received handler:", handler);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link to="/handlers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-gray-900`}>
          {isLoading ? 'Loading...' : `${handler?.first_name || ''} ${handler?.last_name || ''}`}
        </h1>
      </div>
      {!isLoading && handler && (
        <div className="mt-2 sm:mt-0">
          <EditHandlerModal 
            handler={handler} 
            onSuccess={onHandlerUpdated} 
          />
        </div>
      )}
    </div>
  );
}
