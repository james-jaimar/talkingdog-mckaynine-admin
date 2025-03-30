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
  description?: string;
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

  // Database fields that can be mapped to, based on the provided CSV format
  const availableFields: MappingField[] = [
    // Client fields
    { csvHeader: "Name", dbField: "first_name", table: "clients", required: true, description: "First part of full name" },
    { csvHeader: "Name", dbField: "last_name", table: "clients", required: true, description: "Last part of full name" },
    { csvHeader: "E-mail", dbField: "email", table: "clients", required: true },
    { csvHeader: "Tel", dbField: "phone", table: "clients", required: false },
    { csvHeader: "COMMENTS", dbField: "notes", table: "clients", required: false },
    
    // Dog fields
    { csvHeader: "Dog's Name", dbField: "name", table: "dogs", required: true },
    { csvHeader: "Breed", dbField: "breed", table: "dogs", required: true },
    { csvHeader: "DOB", dbField: "age", table: "dogs", required: false, description: "Will be calculated from DOB" },
    { csvHeader: "Assess", dbField: "notes", table: "dogs", required: false },
    { csvHeader: "PUPPY", dbField: "behavior_notes", table: "dogs", required: false, description: "Will be combined with other class notes" },
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
          
          // Initialize field mappings with best guesses based on your specific columns
          const initialMappings: Record<string, string> = {};
          
          // Map common fields automatically
          const commonMappings: Record<string, string> = {
            "Name": "clients.first_name", // Special handling for name later
            "E-mail": "clients.email",
            "Tel": "clients.phone",
            "Dog's Name": "dogs.name",
            "Breed": "dogs.breed",
            "DOB": "dogs.age",
            "Assess": "dogs.notes",
            "COMMENTS": "clients.notes",
            // Class fields and other special handling will be done during processing
          };
          
          headers.forEach(header => {
            // Try to match headers to common mappings
            if (commonMappings[header]) {
              initialMappings[header] = commonMappings[header];
            } else {
              // Otherwise try fuzzy matching
              const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
              
              // Find potential matches
              const match = availableFields.find(field => {
                const normalizedField = field.dbField.toLowerCase().replace(/[^a-z0-9]/g, '');
                return normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader);
              });
              
              if (match) {
                initialMappings[header] = `${match.table}.${match.dbField}`;
              }
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
            // Initialize client data
            const clientData: {
              first_name: string;
              last_name: string;
              email: string;
              phone?: string;
              notes?: string;
              [key: string]: any;
            } = {
              first_name: '',
              last_name: '',
              email: ''
            };
            
            // Special handling for name field - split into first/last name
            const nameHeader = tableGroups.clients.first_name;
            if (nameHeader && row[nameHeader]) {
              const nameParts = row[nameHeader].split(' ');
              
              if (nameParts.length > 1) {
                clientData.first_name = nameParts[0];
                clientData.last_name = nameParts.slice(1).join(' ');
              } else {
                clientData.first_name = nameParts[0];
                clientData.last_name = ''; // Default empty last name
              }
            }
            
            // Handle other client fields
            Object.entries(tableGroups.clients).forEach(([dbField, csvHeader]) => {
              if (dbField !== 'first_name' && dbField !== 'last_name') {
                clientData[dbField] = row[csvHeader];
              }
            });
            
            // Add comments/notes from the class fields if not already mapped
            const classNotes = [];
            
            // Collect class information
            ['PUPPY', 'EO', 'BRONZE CGC', 'SILVER CGC', 'BEGINNER/Novice', 'WT', 'YOGA'].forEach(classType => {
              if (row[classType] && row[classType].trim()) {
                classNotes.push(`${classType}: ${row[classType].trim()}`);
              }
            });
            
            // Add class notes to client notes if available and not already mapped
            if (classNotes.length > 0 && !tableGroups.clients.notes) {
              clientData.notes = classNotes.join('\n');
            }
            
            // Check for WhatsApp preference
            if (row['WhatsApp'] && (row['WhatsApp'].toLowerCase() === 'yes' || row['WhatsApp'] === '1' || row['WhatsApp'] === 'true')) {
              if (clientData.notes) {
                clientData.notes += '\nPrefers WhatsApp for communication';
              } else {
                clientData.notes = 'Prefers WhatsApp for communication';
              }
            }
            
            // Check for Photo Permission
            if (row['Photo Permission'] && (row['Photo Permission'].toLowerCase() === 'yes' || row['Photo Permission'] === '1' || row['Photo Permission'] === 'true')) {
              if (clientData.notes) {
                clientData.notes += '\nPhoto permission granted';
              } else {
                clientData.notes = 'Photo permission granted';
              }
            }
            
            // Validate required fields
            if (!clientData.first_name || !clientData.email) {
              throw new Error('Missing required client fields: name or email');
            }
            
            // Use a default last name if none provided
            if (!clientData.last_name) {
              clientData.last_name = '(no last name)';
            }
            
            const { data: clientResult, error: clientError } = await supabase
              .from('clients')
              .insert(clientData)
              .select('id');
              
            if (clientError) throw clientError;
            
            // If client was created successfully and we have dog data, create the dog
            if (clientResult && clientResult.length > 0 && tableGroups.dogs) {
              // Initialize with required fields
              const dogData: {
                name: string;
                breed: string;
                client_id: string;
                age?: number;
                notes?: string;
                behavior_notes?: string;
                [key: string]: any;
              } = {
                name: '',
                breed: '',
                client_id: clientResult[0].id
              };
              
              // Fill in values from CSV based on mapping
              Object.entries(tableGroups.dogs).forEach(([dbField, csvHeader]) => {
                if (dbField === 'age' && row[csvHeader]) {
                  // Handle DOB to age conversion
                  try {
                    const dobDate = new Date(row[csvHeader]);
                    if (!isNaN(dobDate.getTime())) {
                      const today = new Date();
                      const ageInYears = Math.floor((today.getTime() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                      dogData.age = ageInYears;
                    }
                  } catch {
                    // If date parsing fails, try to see if it's already a number
                    const value = parseFloat(row[csvHeader]);
                    if (!isNaN(value)) {
                      dogData.age = value;
                    }
                  }
                } else if (dbField === 'weight' && row[csvHeader]) {
                  // Handle weight conversion
                  const value = parseFloat(row[csvHeader]);
                  dogData.weight = isNaN(value) ? undefined : value;
                } else {
                  dogData[dbField] = row[csvHeader];
                }
              });
              
              // Special handling for classes - combine into behavior_notes
              const behaviorNotes = [];
              
              ['PUPPY', 'EO', 'BRONZE CGC', 'SILVER CGC', 'BEGINNER/Novice', 'WT', 'YOGA'].forEach(classType => {
                if (row[classType] && row[classType].trim()) {
                  behaviorNotes.push(`${classType}: ${row[classType].trim()}`);
                }
              });
              
              if (behaviorNotes.length > 0) {
                dogData.behavior_notes = behaviorNotes.join('\n');
              }
              
              // Validate required fields
              if (!dogData.name || !dogData.breed) {
                throw new Error('Missing required dog fields: name or breed');
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
                <p>Your CSV file should contain handler and dog information including:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Handler name and email</li>
                  <li>Dog's name and breed</li>
                  <li>Optional: DOB, assessment notes, class info</li>
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
                            {field.description && <span className="text-xs text-gray-500 ml-1">({field.description})</span>}
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
                            {field.description && <span className="text-xs text-gray-500 ml-1">({field.description})</span>}
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
                <h4 className="font-medium mb-2">Special Handling</h4>
                <div className="text-sm space-y-2">
                  <p>• The "Name" column will be split into first and last name</p>
                  <p>• DOB will be converted to age in years</p>
                  <p>• Class information (PUPPY, EO, etc.) will be stored in the dog's behavior notes</p>
                  <p>• WhatsApp and Photo Permission preferences will be saved in the client's notes</p>
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
