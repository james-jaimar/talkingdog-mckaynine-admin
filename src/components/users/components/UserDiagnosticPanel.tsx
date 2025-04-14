
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APP_ID } from "@/constants/app";

interface UserDiagnosticPanelProps {
  isAdmin: boolean;
  diagnosticUsers: any[];
  usersCount: number;
}

export function UserDiagnosticPanel({ isAdmin, diagnosticUsers, usersCount }: UserDiagnosticPanelProps) {
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    setIsDiagnosticLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Diagnostic: Current user ID:", session?.user?.id);
      console.log("Diagnostic: User is admin:", isAdmin);
      
      const { data, error } = await supabase.functions.invoke(`get-users?app_id=${encodeURIComponent(APP_ID)}`, {
        method: "GET",
      });
      
      if (error) {
        console.error("Diagnostic: Error invoking edge function:", error);
        toast({
          variant: "destructive",
          title: "Edge Function Error",
          description: error.message,
        });
      } else if (data) {
        console.log("Diagnostic: Edge function returned", data.length, "users");
        toast({
          title: "Diagnostic Results",
          description: `Edge function found ${data.length || 0} users`,
        });
      }
    } catch (error: any) {
      console.error("Diagnostic failed:", error);
      toast({
        variant: "destructive",
        title: "Diagnostic Failed",
        description: error.message,
      });
    } finally {
      setIsDiagnosticLoading(false);
    }
  };

  if (diagnosticUsers.length === 0) return null;

  return (
    <div className="mb-6 p-4 border border-blue-300 bg-blue-50 rounded-md">
      <div className="flex items-start gap-2">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-blue-800">Diagnostic Results</h3>
          <p className="text-sm text-blue-700">
            Edge function returned {diagnosticUsers.length} users. Hook returned {usersCount} users.
          </p>
          <div className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded overflow-auto max-h-32">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(diagnosticUsers.slice(0, 5).map(u => ({
                id: u.id,
                email: u.username,
                role: u.role
              })), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
