import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Dog } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface LinkHandlerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (handlerId: string) => void;
  excludeHandlerIds: string[];
  isProcessing: boolean;
}

interface HandlerResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  dogs: Array<{ id: string; name: string }>;
}

export function LinkHandlerModal({
  open,
  onOpenChange,
  onSelect,
  excludeHandlerIds,
  isProcessing,
}: LinkHandlerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Search for handlers
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['handler-search', searchQuery, excludeHandlerIds],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          dogs(id, name)
        `)
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .not('id', 'in', `(${excludeHandlerIds.join(',')})`)
        .order('last_name', { ascending: true })
        .limit(10);

      if (error) {
        console.error("Error searching handlers:", error);
        return [];
      }

      return (data || []) as HandlerResult[];
    },
    enabled: open && searchQuery.length >= 2,
  });

  const handleSelect = (handlerId: string) => {
    onSelect(handlerId);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Handler to Household</DialogTitle>
          <DialogDescription>
            Search for a handler to link. They will share multi-dog discounts when enrolling in the same term.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Results */}
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-2 space-y-1">
              {searchQuery.length < 2 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Type at least 2 characters to search
                </div>
              ) : isLoading ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No handlers found
                </div>
              ) : (
                searchResults.map((handler) => (
                  <div
                    key={handler.id}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="rounded-full bg-muted p-2 flex-shrink-0">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">
                          {handler.first_name} {handler.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {handler.email}
                        </div>
                        {handler.dogs && handler.dogs.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Dog className="h-3 w-3" />
                            <span>{handler.dogs.map(d => d.name).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelect(handler.id)}
                      disabled={isProcessing}
                    >
                      Select
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
