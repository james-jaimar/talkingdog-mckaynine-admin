import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FieldMapping } from "./types";
import { availableFields } from "./fieldDefinitions";

export function useImportData() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            "Name": "clients.name",
            "E-mail": "clients.email",
            "Tel": "clients.phone",
            "Dog's Name": "dogs.name",
            "Breed": "dogs.breed",
            "DOB": "dogs.age",
            "Assess": "dogs.notes",
            "COMMENTS": "clients.notes",
            "WhatsApp": "clients.whatsapp",
            "Photo Permission": "clients.photo_permission",
            "PUPPY": "classes.puppy_class",
            "EO": "classes.eo_class",
            "BRONZE CGC": "classes.bronze_cgc_class",
            "SILVER CGC": "classes.silver_cgc_class",
            "BEGINNER/Novice": "classes.beginner_novice_class",
            "WT": "classes.wt_class",
            "YOGA": "classes.yoga_class"
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
    setFieldMappings(prev => {
      // If dbField is empty, remove the mapping
      if (!dbField) {
        const newMappings = { ...prev };
        delete newMappings[csvHeader];
        return newMappings;
      }
      
      return {
        ...prev,
        [csvHeader]: dbField
      };
    });
  };

  const processImport = async () => {
    setIsUploading(true);
    const errors: string[] = [];
    const successful: number[] = [];
    const existingClients = new Map<string, string>(); // name -> id mapping

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

      // First pass: preload existing clients to check for duplicates
      if (tableGroups.clients && tableGroups.clients.name) {
        const nameHeader = tableGroups.clients.name;
        const emailHeader = tableGroups.clients.email;
        
        // Create a list of unique clients from the CSV
        const uniqueClientNames = new Set<string>();
        const uniqueEmails = new Set<string>();
        
        csvData.forEach(row => {
          if (row[nameHeader]) {
            uniqueClientNames.add(row[nameHeader]);
          }
          if (emailHeader && row[emailHeader]) {
            uniqueEmails.add(row[emailHeader]);
          }
        });
        
        // Check which clients already exist in the database
        if (uniqueEmails.size > 0) {
          const { data: existingClientsData } = await supabase
            .from('clients')
            .select('id, first_name, last_name, email')
            .in('email', Array.from(uniqueEmails));
          
          if (existingClientsData) {
            existingClientsData.forEach(client => {
              const fullName = `${client.first_name} ${client.last_name}`.trim();
              existingClients.set(client.email, client.id);
              console.log(`Found existing client: ${fullName} (${client.email}) with ID: ${client.id}`);
            });
          }
        }
      }
      
      // Process each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // First create or find client
          if (tableGroups.clients) {
            // Initialize client data with the correct type structure
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
            
            // Handle the name field - split into first/last name
            const nameHeader = tableGroups.clients.name;
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
            
            // Handle email field
            const clientEmail = tableGroups.clients.email && row[tableGroups.clients.email] 
              ? row[tableGroups.clients.email] 
              : '';
            
            if (clientEmail) {
              clientData.email = clientEmail;
            } else {
              throw new Error('Missing required email field');
            }
            
            // Handle phone field
            if (tableGroups.clients.phone && row[tableGroups.clients.phone]) {
              clientData.phone = row[tableGroups.clients.phone];
            }
            
            // Handle notes field
            if (tableGroups.clients.notes && row[tableGroups.clients.notes]) {
              clientData.notes = row[tableGroups.clients.notes];
            }
            
            // Add preferences to notes
            const preferences = [];
            
            // Check for WhatsApp preference
            if (tableGroups.clients.whatsapp && 
                (row[tableGroups.clients.whatsapp]?.toLowerCase() === 'yes' || 
                 row[tableGroups.clients.whatsapp] === '1' || 
                 row[tableGroups.clients.whatsapp]?.toLowerCase() === 'true')) {
              preferences.push('Prefers WhatsApp for communication');
            }
            
            // Check for Photo Permission
            if (tableGroups.clients.photo_permission && 
                (row[tableGroups.clients.photo_permission]?.toLowerCase() === 'yes' || 
                 row[tableGroups.clients.photo_permission] === '1' || 
                 row[tableGroups.clients.photo_permission]?.toLowerCase() === 'true')) {
              preferences.push('Photo permission granted');
            }
            
            // Add preferences to notes
            if (preferences.length > 0) {
              if (clientData.notes) {
                clientData.notes += '\n' + preferences.join('\n');
              } else {
                clientData.notes = preferences.join('\n');
              }
            }
            
            // Collect class information
            const classNotes: string[] = [];
            
            // Process class fields if present in mappings
            if (tableGroups.classes) {
              Object.entries(tableGroups.classes).forEach(([classField, csvHeader]) => {
                if (row[csvHeader] && row[csvHeader].trim()) {
                  const className = classField.replace('_class', '').toUpperCase().replace('_', ' ');
                  classNotes.push(`${className}: ${row[csvHeader].trim()}`);
                }
              });
            }
            
            // Add class notes to client notes
            if (classNotes.length > 0) {
              if (clientData.notes) {
                clientData.notes += '\n\nClass Information:\n' + classNotes.join('\n');
              } else {
                clientData.notes = 'Class Information:\n' + classNotes.join('\n');
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
            
            let clientId: string;
            
            // Check if client already exists by email
            if (existingClients.has(clientData.email)) {
              clientId = existingClients.get(clientData.email) || '';
              console.log(`Using existing client with ID: ${clientId} for email: ${clientData.email}`);
              
              // Update the existing client with any new information
              const { error: updateError } = await supabase
                .from('clients')
                .update({
                  phone: clientData.phone || null,
                  notes: clientData.notes || null
                })
                .eq('id', clientId);
                
              if (updateError) {
                console.warn(`Warning: Could not update existing client: ${updateError.message}`);
              }
            } else {
              // Create a new client
              const { data: clientResult, error: clientError } = await supabase
                .from('clients')
                .insert(clientData)
                .select('id');
                
              if (clientError) throw clientError;
              
              if (!clientResult || clientResult.length === 0) {
                throw new Error('Failed to create client record');
              }
              
              clientId = clientResult[0].id;
              // Store the new client in our map
              existingClients.set(clientData.email, clientId);
            }
            
            // If we have a valid client ID and dog data, create or update the dog
            if (clientId && tableGroups.dogs) {
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
                client_id: clientId
              };
              
              // Process dog name
              if (tableGroups.dogs.name && row[tableGroups.dogs.name]) {
                dogData.name = row[tableGroups.dogs.name];
              }
              
              // Process dog breed
              if (tableGroups.dogs.breed && row[tableGroups.dogs.breed]) {
                dogData.breed = row[tableGroups.dogs.breed];
              }
              
              // Process dog age from DOB
              if (tableGroups.dogs.age && row[tableGroups.dogs.age]) {
                try {
                  const dobDate = new Date(row[tableGroups.dogs.age]);
                  if (!isNaN(dobDate.getTime())) {
                    const today = new Date();
                    const ageInYears = Math.floor((today.getTime() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                    dogData.age = ageInYears;
                  }
                } catch {
                  // If date parsing fails, try to see if it's already a number
                  const value = parseFloat(row[tableGroups.dogs.age]);
                  if (!isNaN(value)) {
                    dogData.age = value;
                  }
                }
              }
              
              // Process dog notes
              if (tableGroups.dogs.notes && row[tableGroups.dogs.notes]) {
                dogData.notes = row[tableGroups.dogs.notes];
              }
              
              // Process behavior notes (class notes)
              const behaviorNotes: string[] = [];
              
              // Add class info to behavior notes if not already added to client notes
              if (classNotes.length > 0) {
                dogData.behavior_notes = classNotes.join('\n');
              }
              
              // Validate required fields
              if (!dogData.name || !dogData.breed) {
                throw new Error('Missing required dog fields: name or breed');
              }
              
              // Check if this dog already exists for this client
              const { data: existingDogs } = await supabase
                .from('dogs')
                .select('id, name')
                .eq('client_id', clientId)
                .eq('name', dogData.name);
              
              if (existingDogs && existingDogs.length > 0) {
                // Update existing dog
                const { error: dogError } = await supabase
                  .from('dogs')
                  .update({
                    breed: dogData.breed,
                    age: dogData.age,
                    notes: dogData.notes,
                    behavior_notes: dogData.behavior_notes
                  })
                  .eq('id', existingDogs[0].id);
                  
                if (dogError) throw dogError;
                
                console.log(`Updated existing dog "${dogData.name}" for client ID: ${clientId}`);
              } else {
                // Create new dog
                const { error: dogError } = await supabase
                  .from('dogs')
                  .insert(dogData);
                  
                if (dogError) throw dogError;
                
                console.log(`Created new dog "${dogData.name}" for client ID: ${clientId}`);
              }
            }
            
            successful.push(i);
          }
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }
      
      toast({
        title: "Import completed",
        description: `Successfully imported ${successful.length} entries with their dogs. ${errors.length > 0 ? `${errors.length} errors occurred.` : ''}`,
        variant: errors.length > 0 ? "destructive" : "default"
      });
      
      return { success: successful.length > 0, errors };
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, errors: [error.message] };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    csvFile,
    csvHeaders,
    csvData,
    isUploading,
    fieldMappings,
    validationErrors,
    handleFileChange,
    handleMapField,
    validateMappings,
    processImport
  };
}
