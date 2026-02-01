import { useState } from "react";
import { Home, Link2, Unlink, UserPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useHouseholdLinks } from "@/hooks/useHouseholdLinks";
import { LinkHandlerModal } from "./LinkHandlerModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HouseholdSelectorProps {
  handlerId: string;
}

export function HouseholdSelector({ handlerId }: HouseholdSelectorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [linkToUnlink, setLinkToUnlink] = useState<string | null>(null);
  
  const { 
    links, 
    isLoading, 
    linkHandler, 
    unlinkHandler, 
    isLinking, 
    isUnlinking,
    hasHouseholdLinks 
  } = useHouseholdLinks(handlerId);

  const handleUnlinkClick = (linkId: string) => {
    setLinkToUnlink(linkId);
    setUnlinkDialogOpen(true);
  };

  const confirmUnlink = () => {
    if (linkToUnlink) {
      unlinkHandler(linkToUnlink);
      setUnlinkDialogOpen(false);
      setLinkToUnlink(null);
    }
  };

  const handleLinkHandler = (linkedHandlerId: string) => {
    linkHandler(linkedHandlerId);
    setShowLinkModal(false);
  };

  // Get already linked handler IDs to exclude from search
  const excludedHandlerIds = [handlerId, ...links.map(l => l.linkedHandler.id)];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Home className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-muted-foreground text-sm">Multi-Dog Household</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">
                Link handlers from the same household. When household members enroll in the same term, 
                invoices are rebalanced 50/50 with a 25% discount applied to the total.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3 pl-6">
        {/* Household status checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox 
            id="household-enabled"
            checked={hasHouseholdLinks}
            disabled={true} // Read-only, status determined by links
          />
          <label 
            htmlFor="household-enabled" 
            className="text-sm cursor-default"
          >
            Part of multi-handler household
          </label>
        </div>

        {/* Linked handlers list */}
        {links.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium">Linked Handlers:</span>
            <div className="space-y-2">
              {links.map((link) => (
                <div 
                  key={link.id} 
                  className="flex items-center justify-between p-2 rounded-md border bg-muted/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {link.linkedHandler.first_name} {link.linkedHandler.last_name}
                      </div>
                      {link.linkedHandler.dogs && link.linkedHandler.dogs.length > 0 && (
                        <div className="text-xs text-muted-foreground truncate">
                          {link.linkedHandler.dogs.length} dog{link.linkedHandler.dogs.length !== 1 ? 's' : ''}: {link.linkedHandler.dogs.map(d => d.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlinkClick(link.id)}
                    disabled={isUnlinking}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add link button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLinkModal(true)}
          disabled={isLinking}
          className="w-full"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Link Another Handler
        </Button>
      </div>

      {/* Link handler modal */}
      <LinkHandlerModal
        open={showLinkModal}
        onOpenChange={setShowLinkModal}
        onSelect={handleLinkHandler}
        excludeHandlerIds={excludedHandlerIds}
        isProcessing={isLinking}
      />

      {/* Unlink confirmation dialog */}
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Handler?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the household link between these handlers. 
              Future enrollments will not receive the multi-dog household discount.
              Existing invoices will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnlink}>
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
