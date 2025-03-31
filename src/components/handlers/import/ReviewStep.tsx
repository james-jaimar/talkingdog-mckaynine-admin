
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FieldMapping } from "./types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ReviewStepProps {
  csvData: any[];
  fieldMappings: FieldMapping;
  branchName?: string;
  onImport: () => void;
  isUploading?: boolean;
  processingResults?: {
    total: number;
    processed: number;
    errors: { row: number; message: string }[];
  };
}

export function ReviewStep({ 
  csvData, 
  fieldMappings, 
  branchName, 
  onImport, 
  isUploading,
  processingResults 
}: ReviewStepProps) {
  // Ensure we have data to display
  if (!csvData || csvData.length === 0) {
    return <div className="p-4 text-center">No data to review. Please go back and upload a CSV file.</div>;
  }

  const headers = Object.keys(csvData[0] || {});
  const firstFewRows = csvData.slice(0, 5);

  // Check if email is mapped
  const emailIsMapped = Object.entries(fieldMappings).some(([_, mapping]) => mapping === 'clients.email');
  const emailHeader = Object.entries(fieldMappings).find(([_, value]) => value === 'clients.email')?.[0];

  // Organize mapped fields by table
  const mappedFields: Record<string, string[]> = {};
  
  Object.entries(fieldMappings).forEach(([csvHeader, dbFieldWithTable]) => {
    if (!dbFieldWithTable) return; // Skip empty mappings
    
    const [table, field] = dbFieldWithTable.split('.');
    if (!table || !field) return;
    
    if (!mappedFields[table]) {
      mappedFields[table] = [];
    }
    mappedFields[table].push(`${csvHeader} → ${field}`);
  });

  // Count rows with missing emails if email header is mapped
  let rowsWithMissingEmail = 0;
  if (emailHeader) {
    rowsWithMissingEmail = csvData.filter(row => !row[emailHeader] || row[emailHeader].trim() === '').length;
  }

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
      
      {!emailIsMapped && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Required Field</AlertTitle>
          <AlertDescription>
            Email is a required field for client import. Please go back and map the email field.
          </AlertDescription>
        </Alert>
      )}

      {emailIsMapped && rowsWithMissingEmail > 0 && (
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700">Warning: Missing Emails</AlertTitle>
          <AlertDescription className="text-amber-600">
            {rowsWithMissingEmail} rows have missing email values. These rows will be skipped during import.
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
      
      {isUploading && processingResults && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Processing: {processingResults.processed} of {processingResults.total} records</span>
            <span>{Math.round((processingResults.processed / processingResults.total) * 100)}%</span>
          </div>
          <Progress value={Math.round((processingResults.processed / processingResults.total) * 100)} className="h-2" />
          
          {processingResults.errors.length > 0 && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Errors</AlertTitle>
              <AlertDescription>
                <p>{processingResults.errors.length} rows couldn't be imported due to missing email or other errors.</p>
                {processingResults.errors.length > 10 ? (
                  <p className="text-sm mt-1">First few errors: Missing emails in rows {
                    processingResults.errors.slice(0, 5).map(e => e.row).join(', ')
                  }, and {processingResults.errors.length - 5} more...</p>
                ) : (
                  <p className="text-sm mt-1">Errors in rows: {
                    processingResults.errors.map(e => e.row).join(', ')
                  }</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      <div className="mt-6 flex flex-col items-center justify-center">
        <Button 
          onClick={onImport}
          variant="mckaynine"
          size="lg"
          className="w-full sm:w-auto"
          id="review-import-button"
          type="button"
          disabled={isUploading || !emailIsMapped}
        >
          {isUploading ? 'Importing...' : `Import ${csvData.length} Records`}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
