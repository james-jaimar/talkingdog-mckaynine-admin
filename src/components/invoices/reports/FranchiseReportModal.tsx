
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HeaderSelect, HeaderSelectContent, HeaderSelectItem, HeaderSelectTrigger, HeaderSelectValue } from "@/components/ui/header-select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface FranchiseReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateReport: (termId: string, reportType: string, termLabel: string) => void;
}

export function FranchiseReportModal({
  open,
  onOpenChange,
  onGenerateReport
}: FranchiseReportModalProps) {
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [reportType, setReportType] = useState<string>("classes-list");

  // Fetch available terms
  const { data: terms, isLoading: termsLoading } = useQuery({
    queryKey: ['franchise-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terms')
        .select(`
          id,
          term_number,
          start_date,
          end_date,
          academic_years!inner(year)
        `)
        .order('academic_years(year)', { ascending: false })
        .order('term_number', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const handleGenerate = () => {
    if (selectedTerm && reportType) {
      const selectedTermData = terms?.find(term => term.id === selectedTerm);
      const termLabel = selectedTermData 
        ? `${selectedTermData.academic_years?.year} - Term ${selectedTermData.term_number}`
        : `Term ${selectedTerm.substring(0, 8)}...`;
      
      onGenerateReport(selectedTerm, reportType, termLabel);
      onOpenChange(false);
    }
  };

  const formatTermLabel = (term: any) => {
    const year = term.academic_years?.year;
    return `${year} - Term ${term.term_number}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Franchise Report</DialogTitle>
          <DialogDescription>
            Select the term and report type to generate a comprehensive franchise report.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="term-select">Term</Label>
            {termsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading terms...</span>
              </div>
            ) : (
              <HeaderSelect value={selectedTerm} onValueChange={setSelectedTerm}>
                <HeaderSelectTrigger className="w-full">
                  <HeaderSelectValue placeholder="Select a term" />
                </HeaderSelectTrigger>
                <HeaderSelectContent>
                  {terms?.map((term) => (
                    <HeaderSelectItem key={term.id} value={term.id}>
                      {formatTermLabel(term)}
                    </HeaderSelectItem>
                  ))}
                </HeaderSelectContent>
              </HeaderSelect>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <HeaderSelect value={reportType} onValueChange={setReportType}>
              <HeaderSelectTrigger className="w-full">
                <HeaderSelectValue placeholder="Select report type" />
              </HeaderSelectTrigger>
              <HeaderSelectContent>
                <HeaderSelectItem value="classes-list">Classes List Report</HeaderSelectItem>
              </HeaderSelectContent>
            </HeaderSelect>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={!selectedTerm || !reportType}
          >
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
