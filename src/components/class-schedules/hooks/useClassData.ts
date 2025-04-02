
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Class } from "@/components/classes/types/class";
import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";

interface UseClassDataProps {
  classId: string | undefined;
}

export function useClassData({ classId }: UseClassDataProps) {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { currentBranch } = useBranch();
  const navigate = useNavigate();

  // Redirect to classes page if no classId
  useEffect(() => {
    if (!classId && user && currentBranch) {
      console.log("No classId provided, redirecting to classes page");
      navigate("/classes");
    }
  }, [classId, user, currentBranch, navigate]);

  const {
    data: classData,
    isLoading,
    error
  } = useQuery({
    queryKey: ["class", classId, user?.id, currentBranch?.id],
    queryFn: async () => {
      if (!classId) return null;
      
      console.log("Fetching class with ID:", classId);
      
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching class:", error);
        toast({
          title: "Error", 
          description: "Failed to load class details."
        });
        throw error;
      }
      
      console.log("Class data received:", data);
      return data as Class;
    },
    enabled: !!classId && !!user && !!session && !!currentBranch,
  });

  return {
    classData,
    isLoading,
    error,
    isAuthenticated: !!user && !!session,
    hasBranch: !!currentBranch
  };
}
