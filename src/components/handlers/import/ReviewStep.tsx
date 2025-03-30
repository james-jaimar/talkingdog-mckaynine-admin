
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FieldMapping } from "./types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewStepProps {
  csvData: any[];
  fieldMappings: FieldMapping;
  branchName?: string;
  onImport?: () => void;
}

export function ReviewStep({ csvData, fieldMappings, branchName, onImport }: ReviewStepProps) {
  // Ensure we have data to display
  if (!csvData || csvData.length === 0) {
    return <div className="p-4 text-center">No data to review. Please go back and upload a CSV file.</div>;
  }

  const headers = Object.keys(csvData[0] || {});
  const firstFewRows = csvData.slice(0, 5);

  // Organize mapped fields by table
  const mappedFields: Record<string, string[]> = {};
  
  Object.entries(fieldMappings).forEach(([csvHeader, dbFieldWithTable]) => {
    if (!dbFieldWithTable) return; // Skip empty mappings
    
    const [table, field] = dbFieldWithTable.split('.');
    if (!table || !field) return;
    
    if (!mappedFields[table]) {
      mappedFields[table] = [];
    }
    mappedFields[table].push(csvHeader);
  });

  const handleImportClick = () => {
    console.log("Import button clicked in ReviewStep");
    if (onImport) {
      onImport();
    }
  };

  return (
    <div className="space-y-4">
      {branchName && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Branch Assignment</AlertTitle>
          <AlertDescription>
            All imported handlers will be assigned to the <strong>{branchName}</strong> branch.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Mapped Fields</h3>
        {Object.entries(mappedFields).map(([table, fields]) => (
          <div key={table} className="pl-4 border-l-2 border-gray-300">
            <h4 className="font-medium text-sm text-gray-700 capitalize">{table}</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {fields.map(field => (
                <span key={field} className="px-2 py-1 bg-gray-100 rounded text-xs">{field}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Preview Data</h3>
        <p className="text-sm text-gray-500">Showing first {Math.min(5, csvData.length)} rows of {csvData.length} total rows.</p>
        <div className="border rounded overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map(header => (
                  <TableHead key={header} className="whitespace-nowrap">
                    {header}
                    {fieldMappings[header] && (
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        ({fieldMappings[header]})
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {firstFewRows.map((row, rowIndex) => (
                <TableRow key={`row-${rowIndex}`}>
                  {headers.map(header => (
                    <TableCell key={`${rowIndex}-${header}`} className="whitespace-nowrap truncate max-w-[200px]">
                      {row[header] !== undefined && row[header] !== null ? String(row[header]) : "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col items-center justify-center">
        <p className="text-sm font-medium text-green-600 mb-4">
          Ready to import {csvData.length} records? Click the button below.
        </p>
        
        <Button 
          onClick={handleImportClick}
          variant="mckaynine"
          size="lg"
          className="w-full sm:w-auto"
          id="review-import-button"
          type="button"
        >
          Import {csvData.length} Records
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
