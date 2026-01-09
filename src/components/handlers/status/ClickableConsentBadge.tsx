import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, MinusCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ConsentStatus = 'yes' | 'no' | 'not_marked';

interface ClickableConsentBadgeProps {
  status: ConsentStatus;
  handlerId: string;
  field: 'uses_whatsapp_status' | 'social_media_consent_status';
  onUpdate?: () => void;
  className?: string;
}

export function ClickableConsentBadge({ 
  status, 
  handlerId, 
  field, 
  onUpdate,
  className 
}: ClickableConsentBadgeProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ConsentStatus>(status);

  const cycleStatus = (): ConsentStatus => {
    switch (currentStatus) {
      case 'not_marked': return 'yes';
      case 'yes': return 'no';
      case 'no': return 'not_marked';
      default: return 'not_marked';
    }
  };

  const handleClick = async () => {
    if (isUpdating) return;
    
    const newStatus = cycleStatus();
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({ [field]: newStatus })
        .eq('id', handlerId);

      if (error) throw error;

      setCurrentStatus(newStatus);
      toast.success(`Updated to ${newStatus === 'not_marked' ? 'Not Marked' : newStatus}`);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating consent status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const fieldLabel = field === 'uses_whatsapp_status' ? 'WhatsApp' : 'Photo Consent';

  if (isUpdating) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={cn(
              "flex items-center justify-center cursor-pointer hover:scale-110 transition-transform",
              className
            )}
          >
            {currentStatus === 'yes' && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {currentStatus === 'no' && (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            {currentStatus === 'not_marked' && (
              <MinusCircle className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to change {fieldLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
