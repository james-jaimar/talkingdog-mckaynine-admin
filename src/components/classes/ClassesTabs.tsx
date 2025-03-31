
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { Class } from "./types/class";
import { Link, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function ClassesTabs() {
  const { currentBranch } = useBranch();
  const location = useLocation();
  
  const { data: classes, isLoading } = useQuery({
    queryKey: ['active-classes', currentBranch?.id],
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select(`
          *,
          branches:branch_id (
            name
          ),
          class_schedules(count)
        `)
        .order('name');
      
      // Filter by branch if one is selected
      if (currentBranch) {
        query = query.eq('branch_id', currentBranch.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as (Class & { branches: { name: string }, class_schedules: { count: number } })[];
    },
    enabled: true
  });
  
  // Filter classes that have schedules
  const activeClasses = classes?.filter(c => c.class_schedules?.count > 0) || [];
  
  if (isLoading || activeClasses.length === 0) {
    return null;
  }

  // Only display the class tabs on the classes page or class-related pages
  if (!location.pathname.includes('/classes')) {
    return null;
  }

  return (
    <div className="mx-4 mt-2 overflow-x-auto">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-max min-w-full justify-start">
          <TabsTrigger value="all" asChild>
            <Link to="/classes" className={cn(
              location.pathname === "/classes" ? "font-medium" : ""
            )}>
              All Classes
            </Link>
          </TabsTrigger>
          
          {activeClasses.map((classItem) => (
            <TabsTrigger key={classItem.id} value={classItem.id} asChild>
              <Link 
                to={`/classes/${classItem.id}/handlers`}
                className={cn(
                  location.pathname === `/classes/${classItem.id}/handlers` ? "font-medium" : ""
                )}
              >
                {classItem.name}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
