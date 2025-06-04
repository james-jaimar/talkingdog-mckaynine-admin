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

  // Fetch available terms with better prioritization
  const { data: terms, isLoading: termsLoading } = useQuery({
    queryKey: ['franchise-terms'],
    queryFn: async () => {
      console.log('Fetching terms for franchise report...');
      
      const { data, error } = await supabase
        .from('terms')
        .select(`
          id,
          term_number,
          start_date,
          end_date,
          current,
          academic_years!inner(id, year)
        `)
        .order('academic_years(year)', { ascending: false })
        .order('current', { ascending: false })
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching terms:', error);
        throw error;
      }

      console.log('Fetched terms:', data);
      
      // Enhanced grouping logic to handle duplicate term numbers
      const groupedTerms = new Map();
      
      data.forEach(term => {
        const key = `${term.academic_years?.year}-${term.term_number}`;
        const existing = groupedTerms.get(key);
        
        // Prioritize current terms, then by start date
        if (!existing || 
            (term.current && !existing.current) || 
            (term.current === existing.current && new Date(term.start_date) > new Date(existing.start_date))) {
          groupedTerms.set(key, term);
          console.log(`Selected term for ${key}:`, term.id, term.current ? '(current)' : '');
        }
      });
      
      const prioritizedTerms = Array.from(groupedTerms.values());
      console.log('Prioritized terms:', prioritizedTerms);
      
      return prioritizedTerms;
    },
    enabled: open
  });

  const handleGenerate = () => {
    if (selectedTerm && reportType) {
      const selectedTermData = terms?.find(term => term.id === selectedTerm);
      console.log('Generating report for term:', {
        selectedTermId: selectedTerm,
        selectedTermData,
        reportType
      });
      
      const termLabel = selectedTermData 
        ? `${selectedTermData.academic_years?.year} - Term ${selectedTermData.term_number}`
        : `Term ${selectedTerm.substring(0, 8)}...`;
      
      onGenerateReport(selectedTerm, reportType, termLabel);
      onOpenChange(false);
    }
  };

  const formatTermLabel = (term: any) => {
    const year = term.academic_years?.year;
    const currentBadge = term.current ? ' (Current)' : '';
    return `${year} - Term ${term.term_number}${currentBadge}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Generate Franchise Report</DialogTitle>
          <DialogDescription className="text-sm">
            Select the term and report type to generate a comprehensive franchise report.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="term-select" className="text-sm font-medium">Term</Label>
            {termsLoading ? (
              <div className="flex items-center space-x-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading terms...</span>
              </div>
            ) : (
              <HeaderSelect value={selectedTerm} onValueChange={setSelectedTerm}>
                <HeaderSelectTrigger className="w-full h-10">
                  <HeaderSelectValue placeholder="Select a term" />
                </HeaderSelectTrigger>
                <HeaderSelectContent>
                  {terms?.map((term) => (
                    <HeaderSelectItem key={term.id} value={term.id} className="py-2">
                      {formatTermLabel(term)}
                    </HeaderSelectItem>
                  ))}
                </HeaderSelectContent>
              </HeaderSelect>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-type" className="text-sm font-medium">Report Type</Label>
            <HeaderSelect value={reportType} onValueChange={setReportType}>
              <HeaderSelectTrigger className="w-full h-10">
                <HeaderSelectValue placeholder="Select report type" />
              </HeaderSelectTrigger>
              <HeaderSelectContent>
                <HeaderSelectItem value="classes-list" className="py-2">Classes List Report</HeaderSelectItem>
              </HeaderSelectContent>
            </HeaderSelect>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={!selectedTerm || !reportType}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
