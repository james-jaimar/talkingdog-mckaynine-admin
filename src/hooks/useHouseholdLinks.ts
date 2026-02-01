import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface HouseholdLink {
  id: string;
  handler_id: string;
  linked_handler_id: string;
  created_at: string;
  linkedHandler: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    dogs?: Array<{ id: string; name: string }>;
  };
}

export function useHouseholdLinks(handlerId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all household links for this handler (bidirectional)
  const { data: links = [], isLoading, refetch } = useQuery({
    queryKey: ['household-links', handlerId],
    queryFn: async () => {
      if (!handlerId) return [];

      // Query links where this handler is either handler_id or linked_handler_id
      const { data: linksAsHandler, error: error1 } = await supabase
        .from('handler_households')
        .select(`
          id,
          handler_id,
          linked_handler_id,
          created_at,
          linked_client:clients!handler_households_linked_handler_id_fkey(
            id, first_name, last_name, email,
            dogs(id, name)
          )
        `)
        .eq('handler_id', handlerId);

      const { data: linksAsLinked, error: error2 } = await supabase
        .from('handler_households')
        .select(`
          id,
          handler_id,
          linked_handler_id,
          created_at,
          main_client:clients!handler_households_handler_id_fkey(
            id, first_name, last_name, email,
            dogs(id, name)
          )
        `)
        .eq('linked_handler_id', handlerId);

      if (error1 || error2) {
        console.error("Error fetching household links:", error1 || error2);
        return [];
      }

      // Normalize both directions into a consistent format
      const normalizedLinks: HouseholdLink[] = [];

      linksAsHandler?.forEach((link: any) => {
        if (link.linked_client) {
          normalizedLinks.push({
            id: link.id,
            handler_id: link.handler_id,
            linked_handler_id: link.linked_handler_id,
            created_at: link.created_at,
            linkedHandler: {
              id: link.linked_client.id,
              first_name: link.linked_client.first_name,
              last_name: link.linked_client.last_name,
              email: link.linked_client.email,
              dogs: link.linked_client.dogs || [],
            }
          });
        }
      });

      linksAsLinked?.forEach((link: any) => {
        if (link.main_client) {
          normalizedLinks.push({
            id: link.id,
            handler_id: link.handler_id,
            linked_handler_id: link.linked_handler_id,
            created_at: link.created_at,
            linkedHandler: {
              id: link.main_client.id,
              first_name: link.main_client.first_name,
              last_name: link.main_client.last_name,
              email: link.main_client.email,
              dogs: link.main_client.dogs || [],
            }
          });
        }
      });

      return normalizedLinks;
    },
    enabled: !!handlerId,
  });

  // Link a handler to this household
  const linkHandler = useMutation({
    mutationFn: async (linkedHandlerId: string) => {
      if (!handlerId) throw new Error("No handler ID");

      const { data, error } = await supabase
        .from('handler_households')
        .insert({
          handler_id: handlerId,
          linked_handler_id: linkedHandlerId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Household linked",
        description: "The handlers are now part of the same household.",
      });
      queryClient.invalidateQueries({ queryKey: ['household-links', handlerId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error linking household",
        description: error.message || "Failed to link handlers",
        variant: "destructive",
      });
    },
  });

  // Unlink a handler from this household
  const unlinkHandler = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('handler_households')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Household unlinked",
        description: "The handlers are no longer linked.",
      });
      queryClient.invalidateQueries({ queryKey: ['household-links', handlerId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error unlinking",
        description: error.message || "Failed to unlink handlers",
        variant: "destructive",
      });
    },
  });

  return {
    links,
    isLoading,
    refetch,
    linkHandler: linkHandler.mutate,
    unlinkHandler: unlinkHandler.mutate,
    isLinking: linkHandler.isPending,
    isUnlinking: unlinkHandler.isPending,
    hasHouseholdLinks: links.length > 0,
  };
}

// Helper function to get all household member IDs for a handler
export async function getHouseholdMemberIds(handlerId: string): Promise<string[]> {
  const { data: linksAsHandler } = await supabase
    .from('handler_households')
    .select('linked_handler_id')
    .eq('handler_id', handlerId);

  const { data: linksAsLinked } = await supabase
    .from('handler_households')
    .select('handler_id')
    .eq('linked_handler_id', handlerId);

  const memberIds = new Set<string>([handlerId]);

  linksAsHandler?.forEach(link => memberIds.add(link.linked_handler_id));
  linksAsLinked?.forEach(link => memberIds.add(link.handler_id));

  return Array.from(memberIds);
}
