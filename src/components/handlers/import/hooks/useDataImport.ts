
import { useState } from "react";
import { FieldMapping, ImportResult, ProcessingStatus } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useDataImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [processingResults, setProcessingResults] = useState<ProcessingStatus | null>(null);

  const processImport = async (
    data: any[],
    fieldMappings: FieldMapping,
    branchId?: string
  ): Promise<ImportResult> => {
    // Validate that email is mapped
    const emailHeader = Object.entries(fieldMappings).find(
      ([_, value]) => value === 'clients.email'
    );
    
    if (!emailHeader) {
      toast({
        title: "Import failed",
        description: "Email field must be mapped for client import",
        variant: "destructive"
      });
      
      return {
        success: false,
        processed: 0,
        total: data.length,
        errors: [{ row: 0, message: 'Email field must be mapped for client import' }]
      };
    }
    
    setIsUploading(true);
    setProcessingResults({ 
      total: data.length, 
      processed: 0, 
      errors: [] 
    });
    
    const result: ImportResult = {
      success: false,
      processed: 0,
      total: data.length,
      errors: []
    };
    
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      
      try {
        // 1. Extract client data
        const clientData = extractClientData(row, fieldMappings, branchId);
        
        // Skip if no email
        if (!clientData.email || clientData.email.trim() === '') {
          throw new Error('Email is required');
        }
        
        // 2. Create or update client
        const clientId = await saveClient(clientData);
        
        if (clientId) {
          // 3. Extract and save dog data if present
          const dogData = extractDogData(row, fieldMappings);
          
          // Only create dog if we have at least a name
          if (dogData.name) {
            dogData.client_id = clientId;
            const dogId = await saveDog(dogData);
            
            // 4. Save class enrollments if dog was created
            if (dogId) {
              const enrollments = extractClassEnrollments(row, fieldMappings);
              if (Object.values(enrollments).some(val => val === true)) {
                await saveClassEnrollments(dogId, enrollments);
              }
            }
          }
          
          // Count as successfully processed
          result.processed++;
          setProcessingResults(prev => 
            prev ? { ...prev, processed: prev.processed + 1 } : null
          );
        }
      } catch (error: any) {
        console.error(`Error processing row ${rowIndex + 1}:`, error);
        const errorInfo = { row: rowIndex + 1, message: error.message || 'Unknown error' };
        result.errors.push(errorInfo);
        
        setProcessingResults(prev => 
          prev ? { ...prev, errors: [...prev.errors, errorInfo] } : null
        );
      }
    }
    
    // Mark as successful if at least one record was processed
    result.success = result.processed > 0;
    
    setIsUploading(false);
    return result;
  };
  
  // Extract all client-related fields from a row
  const extractClientData = (
    row: any, 
    fieldMappings: FieldMapping, 
    branchId?: string
  ): Record<string, any> => {
    const clientData: Record<string, any> = { branch_id: branchId };
    
    // Extract mapped client fields
    for (const [csvHeader, dbField] of Object.entries(fieldMappings)) {
      if (dbField.startsWith('clients.')) {
        const field = dbField.replace('clients.', '');
        clientData[field] = row[csvHeader];
      }
    }
    
    // Extract preferences and add to notes
    const preferences = [];
    
    // Check for WhatsApp preference
    if (row['WhatsApp'] === true || 
        (typeof row['WhatsApp'] === 'string' && 
         ['yes', 'true', '1', 'y'].includes(row['WhatsApp'].toLowerCase()))) {
      preferences.push("WhatsApp: yes");
    }
    
    // Check for Photo Permission
    if (row['Photo Permission'] === true || 
        (typeof row['Photo Permission'] === 'string' && 
         ['yes', 'true', '1', 'y'].includes(row['Photo Permission'].toLowerCase()))) {
      preferences.push("Photo Permission: yes");
    }
    
    // Add comments/notes from the CSV if present
    if (row['COMMENTS'] && typeof row['COMMENTS'] === 'string') {
      if (clientData.notes) {
        clientData.notes = `${clientData.notes}\n${row['COMMENTS']}`;
      } else {
        clientData.notes = row['COMMENTS'];
      }
    }
    
    // Add preferences to notes if any were found
    if (preferences.length > 0) {
      if (clientData.notes) {
        clientData.notes = `${clientData.notes}\n${preferences.join("\n")}`;
      } else {
        clientData.notes = preferences.join("\n");
      }
    }
    
    // Parse name for first_name and last_name if not provided directly
    if (clientData.name && (!clientData.first_name || !clientData.last_name)) {
      const nameParts = clientData.name.split(' ');
      clientData.first_name = nameParts[0] || 'Unknown';
      clientData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';
    }
    
    // Ensure required fields exist
    if (!clientData.first_name) clientData.first_name = 'Unknown';
    if (!clientData.last_name) clientData.last_name = 'Unknown';
    
    return clientData;
  };
  
  // Extract all dog-related fields from a row
  const extractDogData = (
    row: any, 
    fieldMappings: FieldMapping
  ): Record<string, any> => {
    const dogData: Record<string, any> = {};
    
    // Extract mapped dog fields
    for (const [csvHeader, dbField] of Object.entries(fieldMappings)) {
      if (dbField.startsWith('dogs.')) {
        const field = dbField.replace('dogs.', '');
        if (row[csvHeader] && row[csvHeader] !== '-') {
          dogData[field] = row[csvHeader];
        }
      }
    }
    
    // Look for dog name in unmapped fields
    if (!dogData.name) {
      for (const [header, value] of Object.entries(row)) {
        if (header.toLowerCase().includes('dog') && 
            value && 
            value !== '-' &&
            typeof value === 'string') {
          dogData.name = value;
          break;
        }
      }
    }
    
    // Look for breed in unmapped fields
    if (!dogData.breed) {
      for (const [header, value] of Object.entries(row)) {
        if (header.toLowerCase() === 'breed' && 
            value && 
            value !== '-' &&
            typeof value === 'string') {
          dogData.breed = value;
          break;
        }
      }
    }
    
    // Check for assessment notes
    if (row['Assess'] && row['Assess'] !== '-') {
      if (dogData.notes) {
        dogData.notes = `${dogData.notes}\nAssessment: ${row['Assess']}`;
      } else {
        dogData.notes = `Assessment: ${row['Assess']}`;
      }
    }
    
    // Format date of birth if present
    if (dogData.date_of_birth) {
      dogData.date_of_birth = formatDate(dogData.date_of_birth);
    }
    
    // Ensure breed is set if dog exists
    if (dogData.name && !dogData.breed) {
      dogData.breed = 'Unknown Breed';
    }
    
    return dogData;
  };
  
  // Extract all class enrollments from a row
  const extractClassEnrollments = (
    row: any,
    fieldMappings: FieldMapping
  ): Record<string, boolean> => {
    const enrollments: Record<string, boolean> = {
      puppy_class: false,
      eo_class: false,
      bronze_cgc_class: false,
      silver_cgc_class: false,
      beginner_novice_class: false,
      wt_class: false,
      yoga_class: false
    };
    
    // Helper to convert various formats to boolean
    const toBool = (value: any): boolean => {
      if (value === undefined || value === null || value === '') return false;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value === 1;
      if (typeof value === 'string') {
        const str = value.toLowerCase().trim();
        // Check for various "truthy" string values
        return str === 'yes' || 
               str === 'true' || 
               str === '1' || 
               str === 'y' ||
               str.includes('enrolled') ||
               str.includes('grad') ||
               str.includes('completed') ||
               str.includes('waiting') ||
               str.includes('term') ||
               str.includes('?') || // Include entries with question marks
               (str !== 'no' && str !== 'false' && str !== '0' && str !== 'n' && str !== '' && str !== '-') ||
               /\d+(\.\d+)?%/.test(str);
      }
      return false;
    };
    
    // Process mapped class enrollment fields
    for (const [csvHeader, dbField] of Object.entries(fieldMappings)) {
      if (dbField.startsWith('class_enrollments.')) {
        const field = dbField.replace('class_enrollments.', '') as keyof typeof enrollments;
        enrollments[field] = toBool(row[csvHeader]);
      }
    }
    
    // Also check common class columns that might not be mapped
    const classColumns = {
      'PUPPY': 'puppy_class',
      'EO': 'eo_class',
      'BRONZE CGC': 'bronze_cgc_class',
      'SILVER CGC': 'silver_cgc_class',
      'BEGINNER/Novice': 'beginner_novice_class',
      'WT': 'wt_class',
      'YOGA': 'yoga_class'
    };
    
    for (const [column, field] of Object.entries(classColumns)) {
      if (row[column] !== undefined) {
        enrollments[field] = toBool(row[column]);
      }
    }
    
    // Check comments for class information
    if (row['COMMENTS'] && typeof row['COMMENTS'] === 'string') {
      const comments = row['COMMENTS'].toLowerCase();
      
      if (comments.includes('puppy')) enrollments.puppy_class = true;
      if (comments.includes('eo ') || comments.includes(' eo')) enrollments.eo_class = true;
      if (comments.includes('bronze')) enrollments.bronze_cgc_class = true;
      if (comments.includes('silver')) enrollments.silver_cgc_class = true;
      if (comments.includes('beginner') || comments.includes('novice')) enrollments.beginner_novice_class = true;
      if (comments.includes('wt ') || comments.includes(' wt')) enrollments.wt_class = true;
      if (comments.includes('yoga')) enrollments.yoga_class = true;
    }
    
    return enrollments;
  };
  
  // Save client data to database
  const saveClient = async (clientData: Record<string, any>): Promise<string | undefined> => {
    // Check if client exists first
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id')
      .eq('email', clientData.email);
      
    if (existingClients && existingClients.length > 0) {
      // Update existing client
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          phone: clientData.phone,
          address: clientData.address,
          city: clientData.city,
          postal_code: clientData.postal_code,
          notes: clientData.notes,
          branch_id: clientData.branch_id
        })
        .eq('id', existingClients[0].id);
        
      if (error) throw error;
      return existingClients[0].id;
    } else {
      // Create new client
      const { data, error } = await supabase
        .from('clients')
        .insert({
          email: clientData.email,
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          phone: clientData.phone,
          address: clientData.address,
          city: clientData.city,
          postal_code: clientData.postal_code,
          notes: clientData.notes,
          branch_id: clientData.branch_id
        })
        .select('id')
        .single();
        
      if (error) throw error;
      return data?.id;
    }
  };
  
  // Save dog data to database
  const saveDog = async (dogData: Record<string, any>): Promise<string | undefined> => {
    // Create the dog record
    const { data, error } = await supabase
      .from('dogs')
      .insert({
        client_id: dogData.client_id,
        name: dogData.name,
        breed: dogData.breed || 'Unknown Breed',
        age: dogData.age,
        weight: dogData.weight,
        notes: dogData.notes,
        behavior_notes: dogData.behavior_notes,
        medical_notes: dogData.medical_notes,
        date_of_birth: dogData.date_of_birth,
        avatar_url: dogData.avatar_url
      })
      .select('id')
      .single();
      
    if (error) throw error;
    return data?.id;
  };
  
  // Save class enrollments to database
  const saveClassEnrollments = async (
    dogId: string, 
    enrollments: Record<string, boolean>
  ): Promise<void> => {
    const { error } = await supabase
      .from('class_enrollments')
      .insert({
        dog_id: dogId,
        puppy_class: enrollments.puppy_class || false,
        eo_class: enrollments.eo_class || false,
        bronze_cgc_class: enrollments.bronze_cgc_class || false,
        silver_cgc_class: enrollments.silver_cgc_class || false,
        beginner_novice_class: enrollments.beginner_novice_class || false,
        wt_class: enrollments.wt_class || false,
        yoga_class: enrollments.yoga_class || false
      });
      
    if (error) throw error;
  };
  
  // Format date string to ISO format
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // Check if it's already a valid date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      // Handle common formats: dd/mm/yy, dd-mm-yy, etc.
      let parts: string[] = [];
      
      if (dateString.includes('/')) {
        parts = dateString.split('/');
      } else if (dateString.includes('-')) {
        parts = dateString.split('-');
      }
      
      if (parts.length === 3) {
        // Assume day/month/year format
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        let year = parts[2];
        
        // Handle 2-digit years
        if (year.length === 2) {
          year = '20' + year; // Assuming 2000s
        }
        
        return `${year}-${month}-${day}`;
      }
      
      // If we couldn't parse it, return as is
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return {
    isUploading,
    processingResults,
    processImport
  };
}
