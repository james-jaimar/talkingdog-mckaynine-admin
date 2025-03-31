
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { processImportData } from "./importUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CSVImporterProps {
  onImportSuccess: (count: number) => void;
}

export function CSVImporter({ onImportSuccess }: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [createMissingHandlers, setCreateMissingHandlers] = useState(true);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [hasPreviewedData, setHasPreviewedData] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        parseCSV(acceptedFiles[0]);
      }
    }
  });

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const previewRows = results.data.slice(0, 5);
        setPreviewData(previewRows);
        setHasPreviewedData(true);
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            // Process and import the data
            const importedCount = await processImportData(
              results.data,
              createMissingHandlers,
              supabase
            );
            
            onImportSuccess(importedCount);
          } catch (error: any) {
            toast({
              title: "Import failed",
              description: error.message || "An error occurred during import",
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
        }
      });
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-mckaynine-600 bg-mckaynine-50"
            : "border-gray-300 hover:border-mckaynine-400"
        }`}
      >
        <Input {...getInputProps()} />
        <div className="space-y-2">
          <div className="flex justify-center">
            <Upload className="h-10 w-10 text-gray-400" />
          </div>
          {isDragActive ? (
            <p className="text-sm text-gray-600">Drop the file here...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Drag & drop a CSV file here, or click to select a file
              </p>
              <p className="text-xs text-gray-500">
                The CSV should include columns for: Email, Dog's Name, Breed, DOB, Tel, etc.
              </p>
            </>
          )}
        </div>
      </div>

      {file && (
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm font-medium">Selected file: {file.name}</p>
        </div>
      )}

      {hasPreviewedData && previewData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Data preview (first 5 rows):</h3>
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(previewData[0]).slice(0, 6).map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ...
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).slice(0, 6).map((value: any, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-3 py-2 whitespace-nowrap text-xs text-gray-500"
                      >
                        {value || "-"}
                      </td>
                    ))}
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="createMissingHandlers"
          checked={createMissingHandlers}
          onCheckedChange={(checked) => 
            setCreateMissingHandlers(checked as boolean)
          }
        />
        <label
          htmlFor="createMissingHandlers"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Create new handlers if email doesn't exist
        </label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            setFile(null);
            setPreviewData([]);
            setHasPreviewedData(false);
          }}
          disabled={isUploading}
        >
          Clear
        </Button>
        <Button
          onClick={handleImport}
          disabled={!file || isUploading}
          className="bg-mckaynine-600 hover:bg-mckaynine-700 text-white"
        >
          {isUploading ? "Importing..." : "Import Data"}
        </Button>
      </div>
    </div>
  );
}
