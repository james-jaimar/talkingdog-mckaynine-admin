
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Term {
  term_id: string;
  term_number: string;
  year: number;
  start_date: string;
  end_date: string;
}

export function TermDisplay() {
  const { data: currentTerm } = useQuery({
    queryKey: ['current-term'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_current_term')
        .single();
        
      if (error) throw error;
      return data as Term;
    }
  });

  if (!currentTerm) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Term</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-2xl font-bold">
            Term {currentTerm.term_number}, {currentTerm.year}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(currentTerm.start_date), 'dd MMM yyyy')} - {format(new Date(currentTerm.end_date), 'dd MMM yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
