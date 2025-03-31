
import { useState } from "react";
import { availableFields } from "../fieldDefinitions";
import { FieldMapping } from "../types";

export function useFieldValidation() {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateMappings = (fieldMappings: FieldMapping) => {
    const errors: string[] = [];
    
    // Check that email field is mapped - this is the most critical field
    const emailIsMapped = Object.entries(fieldMappings).some(
      ([_, value]) => value === 'clients.email'
    );
    
    if (!emailIsMapped) {
      errors.push('Email field is required for client import but was not mapped');
    }
    
    // Check that other required fields are mapped
    const requiredFields = availableFields.filter(f => f.required);
    
    for (const field of requiredFields) {
      const isMapped = Object.entries(fieldMappings).some(mapping => 
        mapping[1] === `${field.table}.${field.dbField}`
      );
      
      if (!isMapped && field.table !== 'clients' && field.dbField !== 'email') {
        errors.push(`Required field "${field.dbField}" is not mapped`);
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  return {
    validationErrors,
    validateMappings
  };
}
