import { useState, ChangeEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Import, FileUp, Check, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";

type MappingField = {
  csvHeader: string;
  dbField: string;
  table: string;
  required: boolean;
};

export function ImportHandlersModal() {
  const [open, setOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Database fields that can be mapped to
  const availableFields: MappingField[] = [
    // Client fields
    { csvHeader: "", dbField: "first_name", table: "clients", required: true },
    { csvHeader: "", dbField: "last_name", table: "clients", required: true },
    { csvHeader: "", dbField: "email", table: "clients", required: true },
    { csvHeader: "", dbField: "phone", table: "clients", required: false },
    { csvHeader: "", dbField: "address", table: "clients", required: false },
    { csvHeader: "", dbField: "city", table: "clients", required: false },
    { csvHeader: "", dbField: "postal_code", table: "clients", required: false },
    { csvHeader: "", dbField: "notes", table: "clients", required: false },
    
    // Dog fields
    { csvHeader: "", dbField: "name", table: "dogs", required: true },
    { csvHeader: "", dbField: "breed", table: "dogs", required: true },
    { csvHeader: "", dbField: "age", table: "dogs", required: false },
    { csvHeader: "", dbField: "weight", table: "dogs", required: false },
    { csvHeader: "", dbField: "notes", table: "dogs", required: false },
    { csvHeader: "", dbField: "behavior_notes", table: "dogs", required: false },
    { csvHeader: "", dbField: "medical_notes", table: "dogs", required: false },
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          // Extract headers from the first row
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          setCsvData(results.data);
          
          // Initialize field mappings with best guesses
          const initialMappings: Record<string, string> = {};
          headers.forEach(header => {
            // Try to match headers to database fields
            const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Find potential matches
            const match = availableFields.find(field => {
              const normalizedField = field.dbField.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader);
            });
            
            if (match) {
              initialMappings[header] = `${match.table}.${match.dbField}`;
            }
          });
          
          setFieldMappings(initialMappings);
          setCurrentStep(2);
        }
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const validateMappings = () => {
    const errors: string[] = [];
    
    // Check that required fields are mapped
    const requiredFields = availableFields.filter(f => f.required);
    
    for (const field of requiredFields) {
      const isMapped = Object.values(fieldMappings).some(mapping => 
        mapping === `${field.table}.${field.dbField}`
      );
      
      if (!isMapped) {
        errors.push(`Required field "${field.table}.${field.dbField}" is not mapped`);
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleMapField = (csvHeader: string, dbField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [csvHeader]: dbField
    }));
  };

  const handleNext = () => {
    if (currentStep === 2) {
      if (validateMappings()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const processImport = async () => {
    setIsUploading(true);
    const errors: string[] = [];
    const successful: number[] = [];

    try {
      // Group mappings by table
      const tableGroups: Record<string, Record<string, string>> = {};
      
      Object.entries(fieldMappings).forEach(([csvHeader, dbFieldWithTable]) => {
        const [table, dbField] = dbFieldWithTable.split('.');
        if (!tableGroups[table]) {
          tableGroups[table] = {};
        }
        tableGroups[table][dbField] = csvHeader;
      });
      
      // Process each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // First create client
          if (tableGroups.clients) {
            // Initialize with required fields to avoid TypeScript errors
            const clientData: {
              first_name: string;
              last_name: string;
              email: string;
              [key: string]: any;
            } = {
              first_name: '',
              last_name: '',
              email: ''
            };
            
            // Fill in values from CSV based on mapping
            Object.entries(tableGroups.clients).forEach(([dbField, csvHeader]) => {
              clientData[dbField] = row[csvHeader];
            });
            
            // Validate required fields
            if (!clientData.first_name || !clientData.last_name || !clientData.email) {
              throw new Error('Missing required client fields');
            }
            
            const { data: clientResult, error: clientError } = await supabase
              .from('clients')
              .insert(clientData)
              .select('id');
              
            if (clientError) throw clientError;
            
            // If client was created successfully and we have dog data, create the dog
            if (clientResult && clientResult.length > 0 && tableGroups.dogs) {
              // Initialize with required fields to avoid TypeScript errors
              const dogData: {
                name: string;
                breed: string;
                client_id: string;
                [key: string]: any;
              } = {
                name: '',
                breed: '',
                client_id: clientResult[0].id
              };
              
              // Fill in values from CSV based on mapping
              Object.entries(tableGroups.dogs).forEach(([dbField, csvHeader]) => {
                // Handle numeric fields appropriately
                if (dbField === 'age' || dbField === 'weight') {
                  const value = row[csvHeader];
                  dogData[dbField] = value ? Number(value) : null;
                } else {
                  dogData[dbField] = row[csvHeader];
                }
              });
              
              // Validate required fields
              if (!dogData.name || !dogData.breed) {
                throw new Error('Missing required dog fields');
              }
              
              const { error: dogError } = await supabase
                .from('dogs')
                .insert(dogData);
                
              if (dogError) throw dogError;
            }
            
            successful.push(i);
          }
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }
      
      toast({
        title: "Import completed",
        description: `Successfully imported ${successful.length} handlers with their dogs. ${errors.length > 0 ? `${errors.length} errors occurred.` : ''}`,
        variant: errors.length > 0 ? "destructive" : "default"
      });
      
      if (successful.length > 0) {
        setOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-2">
          <Import className="h-4 w-4 mr-2" />
          Import Handlers
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Import Handlers from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="flex justify-between mb-6">
            <div className="flex space-x-4">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep >= 1 ? 'bg-mckaynine-600 text-white' : 'bg-gray-200'}`}>1</div>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep >= 2 ? 'bg-mckaynine-600 text-white' : 'bg-gray-200'}`}>2</div>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep >= 3 ? 'bg-mckaynine-600 text-white' : 'bg-gray-200'}`}>3</div>
            </div>
            <div className="text-sm text-gray-500">
              {currentStep === 1 && "Upload CSV File"}
              {currentStep === 2 && "Map Fields"}
              {currentStep === 3 && "Review & Import"}
            </div>
          </div>
          
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-mckaynine-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-mckaynine-600 focus-within:ring-offset-2 hover:text-mckaynine-500"
                  >
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only"
                      accept=".csv"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">CSV files only</p>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Your CSV file should contain handler and dog information. Required fields include:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Handler first name, last name, and email</li>
                  <li>Dog name and breed</li>
                </ul>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Map your CSV headers to database fields. Required fields are marked with *.
              </p>
              
              <Tabs defaultValue="clients">
                <TabsList className="mb-4">
                  <TabsTrigger value="clients">Handler Data</TabsTrigger>
                  <TabsTrigger value="dogs">Dog Data</TabsTrigger>
                </TabsList>
                
                <TabsContent value="clients" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {availableFields
                      .filter(f => f.table === "clients")
                      .map(field => (
                        <div key={`clients-${field.dbField}`} className="border rounded-md p-3">
                          <label className="block text-sm font-medium mb-1">
                            {field.dbField} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <select 
                            className="w-full border-gray-300 rounded-md"
                            value={Object.entries(fieldMappings).find(([_, value]) => value === `clients.${field.dbField}`)?.[0] || ""}
                            onChange={(e) => {
                              // Remove any existing mapping for this database field
                              const newMappings = { ...fieldMappings };
                              Object.entries(newMappings).forEach(([header, value]) => {
                                if (value === `clients.${field.dbField}`) {
                                  delete newMappings[header];
                                }
                              });
                              
                              // Add new mapping if a header is selected
                              if (e.target.value) {
                                newMappings[e.target.value] = `clients.${field.dbField}`;
                              }
                              
                              setFieldMappings(newMappings);
                            }}
                          >
                            <option value="">-- Select CSV header --</option>
                            {csvHeaders.map(header => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="dogs" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {availableFields
                      .filter(f => f.table === "dogs")
                      .map(field => (
                        <div key={`dogs-${field.dbField}`} className="border rounded-md p-3">
                          <label className="block text-sm font-medium mb-1">
                            {field.dbField} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <select 
                            className="w-full border-gray-300 rounded-md"
                            value={Object.entries(fieldMappings).find(([_, value]) => value === `dogs.${field.dbField}`)?.[0] || ""}
                            onChange={(e) => {
                              // Remove any existing mapping for this database field
                              const newMappings = { ...fieldMappings };
                              Object.entries(newMappings).forEach(([header, value]) => {
                                if (value === `dogs.${field.dbField}`) {
                                  delete newMappings[header];
                                }
                              });
                              
                              // Add new mapping if a header is selected
                              if (e.target.value) {
                                newMappings[e.target.value] = `dogs.${field.dbField}`;
                              }
                              
                              setFieldMappings(newMappings);
                            }}
                          >
                            <option value="">-- Select CSV header --</option>
                            {csvHeaders.map(header => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc pl-5">
                      {validationErrors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Ready to import</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>You're about to import {csvData.length} records from your CSV file.</p>
                      <p className="mt-1">This will create new handler and dog records in the database.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">Field Mappings Summary</h4>
                <div className="text-sm">
                  <Tabs defaultValue="clients">
                    <TabsList className="mb-4">
                      <TabsTrigger value="clients">Handler Fields</TabsTrigger>
                      <TabsTrigger value="dogs">Dog Fields</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="clients">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(fieldMappings)
                          .filter(([_, value]) => value.startsWith('clients.'))
                          .map(([csvHeader, dbField]) => (
                            <div key={csvHeader} className="flex justify-between">
                              <span className="font-medium">{csvHeader}</span>
                              <span className="text-gray-500">{dbField.split('.')[1]}</span>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="dogs">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(fieldMappings)
                          .filter(([_, value]) => value.startsWith('dogs.'))
                          .map(([csvHeader, dbField]) => (
                            <div key={csvHeader} className="flex justify-between">
                              <span className="font-medium">{csvHeader}</span>
                              <span className="text-gray-500">{dbField.split('.')[1]}</span>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={isUploading}>
                Back
              </Button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 3 ? (
              <Button 
                onClick={handleNext} 
                disabled={currentStep === 1 && !csvFile}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={processImport} 
                disabled={isUploading}
              >
                {isUploading ? "Importing..." : "Import Data"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
