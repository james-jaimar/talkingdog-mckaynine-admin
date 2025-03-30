
import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FieldMapping } from "./types";
import { availableFields, clientPreferences, classEnrollments } from "./fieldDefinitions";

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
            "DOB": "dogs.date_of_birth",
            "Assess": "dogs.notes",
            "COMMENTS": "clients.notes",
            "WhatsApp": "clients.whatsapp",
            "Photo Permission": "clients.photo_permission",
            "PUPPY": "class_enrollments.puppy_class",
            "EO": "class_enrollments.eo_class",
            "BRONZE CGC": "class_enrollments.bronze_cgc_class",
            "SILVER CGC": "class_enrollments.silver_cgc_class",
            "BEGINNER/Novice": "class_enrollments.beginner_novice_class",
            "WT": "class_enrollments.wt_class",
            "YOGA": "class_enrollments.yoga_class"
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
    const existingClients = new Map<string, string>(); // email -> id mapping

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
      if (tableGroups.clients && tableGroups.clients.email) {
        const emailHeader = tableGroups.clients.email;
        
        // Create a list of unique emails from the CSV
        const uniqueEmails = new Set<string>();
        
        csvData.forEach(row => {
          if (emailHeader && row[emailHeader]) {
            uniqueEmails.add(row[emailHeader]);
          }
        });
        
        // Check which clients already exist in the database
        if (uniqueEmails.size > 0) {
          const { data: existingClientsData } = await supabase
            .from('clients')
            .select('id, email')
            .in('email', Array.from(uniqueEmails));
          
          if (existingClientsData) {
            existingClientsData.forEach(client => {
              existingClients.set(client.email, client.id);
              console.log(`Found existing client with email: ${client.email} with ID: ${client.id}`);
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
              whatsapp?: boolean;
              photo_permission?: boolean;
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
            
            // Handle preferences as dedicated fields, not notes
            for (const pref of clientPreferences) {
              if (tableGroups.clients[pref.column] && row[tableGroups.clients[pref.column]]) {
                const value = row[tableGroups.clients[pref.column]];
                // Convert to boolean based on value
                clientData[pref.column] = 
                  value?.toLowerCase() === 'yes' || 
                  value === '1' || 
                  value?.toLowerCase() === 'true';
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
                  notes: clientData.notes || null,
                  whatsapp: clientData.whatsapp,
                  photo_permission: clientData.photo_permission
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
                date_of_birth?: string;
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
              
              // Process dog DOB - store as actual date
              if (tableGroups.dogs.date_of_birth && row[tableGroups.dogs.date_of_birth]) {
                try {
                  const dobValue = row[tableGroups.dogs.date_of_birth];
                  const dobDate = new Date(dobValue);
                  
                  if (!isNaN(dobDate.getTime())) {
                    // Store the date in ISO format
                    dogData.date_of_birth = dobDate.toISOString().split('T')[0];
                    
                    // Also calculate and store age for convenience
                    const today = new Date();
                    const ageInYears = Math.floor((today.getTime() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                    dogData.age = ageInYears;
                  } else {
                    // If it's not a valid date, use as-is
                    dogData.date_of_birth = dobValue;
                  }
                } catch (e) {
                  console.warn(`Warning: Could not parse date: ${row[tableGroups.dogs.date_of_birth]}`);
                  dogData.date_of_birth = row[tableGroups.dogs.date_of_birth];
                }
              }
              
              // Process dog notes
              if (tableGroups.dogs.notes && row[tableGroups.dogs.notes]) {
                dogData.notes = row[tableGroups.dogs.notes];
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
              
              let dogId: string;
              
              if (existingDogs && existingDogs.length > 0) {
                // Update existing dog
                dogId = existingDogs[0].id;
                const { error: dogError } = await supabase
                  .from('dogs')
                  .update({
                    breed: dogData.breed,
                    date_of_birth: dogData.date_of_birth,
                    age: dogData.age,
                    notes: dogData.notes
                  })
                  .eq('id', dogId);
                  
                if (dogError) throw dogError;
                
                console.log(`Updated existing dog "${dogData.name}" for client ID: ${clientId}`);
              } else {
                // Create new dog
                const { data: newDog, error: dogError } = await supabase
                  .from('dogs')
                  .insert(dogData)
                  .select('id');
                  
                if (dogError) throw dogError;
                if (!newDog || newDog.length === 0) {
                  throw new Error('Failed to create dog record');
                }
                
                dogId = newDog[0].id;
                console.log(`Created new dog "${dogData.name}" with ID: ${dogId} for client ID: ${clientId}`);
              }
              
              // If we have class enrollment data and a valid dog ID, create enrollments
              if (dogId && tableGroups.class_enrollments) {
                for (const enrollment of classEnrollments) {
                  const field = enrollment.column;
                  if (tableGroups.class_enrollments[field] && row[tableGroups.class_enrollments[field]]) {
                    const enrollmentValue = row[tableGroups.class_enrollments[field]];
                    if (enrollmentValue && enrollmentValue.trim()) {
                      // Here you would store the class enrollment data
                      // Since there's no class_enrollments table in the schema yet,
                      // we'll store this information in the dog's behavior_notes for now
                      const classNote = `${enrollment.description}: ${enrollmentValue.trim()}`;
                      
                      // Append to existing behavior notes
                      const { data: dogData } = await supabase
                        .from('dogs')
                        .select('behavior_notes')
                        .eq('id', dogId)
                        .single();
                      
                      const existingNotes = dogData?.behavior_notes || '';
                      const updatedNotes = existingNotes 
                        ? `${existingNotes}\n${classNote}` 
                        : classNote;
                      
                      // Update the dog with the new behavior notes
                      const { error: updateError } = await supabase
                        .from('dogs')
                        .update({ behavior_notes: updatedNotes })
                        .eq('id', dogId);
                      
                      if (updateError) {
                        console.warn(`Warning: Could not update dog behavior notes: ${updateError.message}`);
                      }
                    }
                  }
                }
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
