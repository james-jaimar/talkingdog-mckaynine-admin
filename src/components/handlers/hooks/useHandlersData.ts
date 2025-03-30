
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { alphabetGroups } from "../HandlerAlphabetPagination";
import { useBranch } from "@/context/BranchContext";

export function useHandlersData() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGroup, setCurrentGroup] = useState("A");
  const itemsPerPage = 50;
  const { currentBranch } = useBranch();

  const { data: handlers = [], isLoading } = useQuery({
    queryKey: ['handlers', currentBranch?.id],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          created_at,
          notes,
          dogs (
            id,
            name,
            breed,
            age,
            behavior_notes,
            notes,
            medical_notes
          )
        `);
      
      // Filter by branch if one is selected
      if (currentBranch) {
        // Here we assume clients are associated with a branch
        // You may need to adjust this query based on your data model
        query = query.eq('branch_id', currentBranch.id);
      }
      
      query = query.order('first_name', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentBranch // Only run query when a branch is selected
  });

  // Filter handlers by search query
  const filteredHandlers = handlers.filter(handler => 
    (handler.first_name + " " + handler.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.dogs.some(dog => 
      dog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dog.breed.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Filter by current alphabet group
  const currentGroupHandlers = searchQuery 
    ? filteredHandlers 
    : filteredHandlers.filter(handler => {
        const firstLetter = handler.first_name.charAt(0).toUpperCase();
        const group = alphabetGroups.find(group => 
          group.range.some(letter => firstLetter === letter)
        );
        return group?.label === currentGroup;
      });

  return {
    handlers: currentGroupHandlers,
    isLoading,
    searchQuery,
    setSearchQuery,
    currentGroup,
    setCurrentGroup,
    itemsPerPage,
    currentBranch
  };
}
