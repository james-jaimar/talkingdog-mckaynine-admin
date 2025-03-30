
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { alphabetGroups } from "../HandlerAlphabetPagination";

export function useHandlersData() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGroup, setCurrentGroup] = useState("A");
  const itemsPerPage = 50;

  const { data: handlers, isLoading } = useQuery({
    queryKey: ['handlers'],
    queryFn: async () => {
      const { data, error } = await supabase
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
        `)
        .order('first_name', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Filter handlers by search query
  const filteredHandlers = handlers?.filter(handler => 
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
    : filteredHandlers?.filter(handler => {
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
    itemsPerPage
  };
}
