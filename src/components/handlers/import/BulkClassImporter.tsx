import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { processBulkClassImport, validateBulkImport, ImportSummary, ValidationResult } from "./bulkClassImportUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import { useBranch } from "@/context/BranchContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BulkClassImporterProps {
  onImportSuccess?: () => void;
}

export function BulkClassImporter({ onImportSuccess }: BulkClassImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { currentBranch } = useBranch();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setImportResult(null);
        setValidationResult(null);
        parseAndValidateCSV(acceptedFiles[0]);
      }
    },
  });

  const parseAndValidateCSV = (file: File) => {
    setIsValidating(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setPreviewData(results.data.slice(0, 5));
        
        // Validate handlers against database
        try {
          const validation = await validateBulkImport(results.data, supabase);
          setValidationResult(validation);
        } catch (error: any) {
          toast({
            title: "Validation Error",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setIsValidating(false);
        }
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
        setIsValidating(false);
      },
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const summary = await processBulkClassImport(
            results.data,
            supabase,
            currentBranch?.id
          );

          setImportResult(summary);

          if (summary.success > 0) {
            toast({
              title: "Import Complete",
              description: `${summary.success} of ${summary.total} rows imported successfully`,
            });
            onImportSuccess?.();
          } else {
            toast({
              title: "Import Failed",
              description: "No rows were imported. Check the results below.",
              variant: "destructive",
            });
          }
        } catch (error: any) {
          toast({
            title: "Import failed",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
        setIsUploading(false);
      },
    });
  };

  const downloadTemplate = () => {
    const template = `handler_name,email,phone,dog_name,breed,dog_dob,schedule_id,payment_status,invoice_status
John Smith,john@example.com,082 123 4567,Buddy,Labrador,15-Mar-23,PASTE_SCHEDULE_ID_HERE,pending,draft
Jane Doe,jane@example.com,,Max,Golden Retriever,,PASTE_SCHEDULE_ID_HERE,paid,paid`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_class_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    setValidationResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Template Download */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-md">
        <div>
          <p className="text-sm font-medium">Need the CSV template?</p>
          <p className="text-xs text-muted-foreground">
            Download the template with all required columns
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Required Columns Info */}
      <div className="text-xs text-muted-foreground p-3 border rounded-md">
        <p className="font-medium mb-1">Required columns:</p>
        <code className="text-xs">
          handler_name, email, dog_name, breed, schedule_id
        </code>
        <p className="mt-2 font-medium">Optional columns:</p>
        <code className="text-xs">
          phone, dog_dob, payment_status (pending/paid), invoice_status (draft/sent/paid)
        </code>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <Input {...getInputProps()} />
        <div className="space-y-2">
          <div className="flex justify-center">
            <Upload className="h-10 w-10 text-muted-foreground" />
          </div>
          {isDragActive ? (
            <p className="text-sm text-muted-foreground">Drop the file here...</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Drag & drop a CSV file, or click to select
            </p>
          )}
        </div>
      </div>

      {/* File Info */}
      {file && (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm font-medium">Selected: {file.name}</p>
          {currentBranch && (
            <p className="text-xs text-muted-foreground mt-1">
              Branch: {currentBranch.name}
            </p>
          )}
        </div>
      )}

      {/* Preview */}
      {previewData.length > 0 && !importResult && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Preview (first 5 rows):</h3>
          <ScrollArea className="h-[150px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(previewData[0]).slice(0, 5).map((header) => (
                    <TableHead key={header} className="text-xs">
                      {header}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs">...</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((row, idx) => (
                  <TableRow key={idx}>
                    {Object.values(row).slice(0, 5).map((value: any, cellIdx) => (
                      <TableCell key={cellIdx} className="text-xs py-2">
                        {value || "-"}
                      </TableCell>
                    ))}
                    <TableCell className="text-xs py-2">...</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {/* Validation Results - Handler Matching */}
      {validationResult && !importResult && (
        <div className="space-y-3">
          {isValidating ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Validating handlers...</span>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {validationResult.existingHandlers.length}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    Existing Handlers (will be matched)
                  </p>
                </div>
                <div className={`p-3 rounded-md text-center border ${
                  validationResult.newHandlers.length > 0 
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" 
                    : "bg-muted border-border"
                }`}>
                  <p className={`text-2xl font-bold ${
                    validationResult.newHandlers.length > 0 
                      ? "text-amber-700 dark:text-amber-400" 
                      : "text-muted-foreground"
                  }`}>
                    {validationResult.newHandlers.length}
                  </p>
                  <p className={`text-xs ${
                    validationResult.newHandlers.length > 0 
                      ? "text-amber-600 dark:text-amber-500" 
                      : "text-muted-foreground"
                  }`}>
                    New Handlers (will be created)
                  </p>
                </div>
              </div>

              {/* Warning for new handlers */}
              {validationResult.newHandlers.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                    ⚠️ The following handlers are NOT in the database and will be created:
                  </p>
                  <ScrollArea className="h-[120px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Row</TableHead>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.newHandlers.map((handler, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs py-1">{handler.row}</TableCell>
                            <TableCell className="text-xs py-1">{handler.handler_name}</TableCell>
                            <TableCell className="text-xs py-1 text-amber-700 dark:text-amber-400">
                              {handler.email}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* Show existing handlers that will be matched */}
              {validationResult.existingHandlers.length > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                    ✓ The following handlers will be matched to existing records:
                  </p>
                  <ScrollArea className="h-[120px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.existingHandlers.map((handler, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs py-1">{handler.handler_name}</TableCell>
                            <TableCell className="text-xs py-1 text-green-700 dark:text-green-400">
                              {handler.email}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* Validation Errors */}
              {validationResult.errors.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm font-medium text-destructive mb-2">
                    Validation Errors:
                  </p>
                  <ul className="text-xs text-destructive space-y-1">
                    {validationResult.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-3 bg-muted rounded-md text-center">
              <p className="text-2xl font-bold">{importResult.success}</p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </div>
            <div className="p-3 bg-muted rounded-md text-center">
              <p className="text-2xl font-bold">{importResult.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
            <div className="p-3 bg-muted rounded-md text-center">
              <p className="text-2xl font-bold">{importResult.handlersCreated}</p>
              <p className="text-xs text-muted-foreground">Handlers Created</p>
            </div>
            <div className="p-3 bg-muted rounded-md text-center">
              <p className="text-2xl font-bold">{importResult.invoicesCreated}</p>
              <p className="text-xs text-muted-foreground">Invoices Created</p>
            </div>
          </div>

          <ScrollArea className="h-[200px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Row</TableHead>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Handler</TableHead>
                  <TableHead>Dog</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importResult.results.map((result, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs">{result.row}</TableCell>
                    <TableCell>
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{result.handler_name}</TableCell>
                    <TableCell className="text-xs">{result.dog_name}</TableCell>
                    <TableCell className="text-xs">{result.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={clearAll} disabled={isUploading}>
          Clear
        </Button>
        <Button
          onClick={handleImport}
          disabled={!file || isUploading}
          className="bg-primary hover:bg-primary/90"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            "Import to Classes"
          )}
        </Button>
      </div>
    </div>
  );
}
