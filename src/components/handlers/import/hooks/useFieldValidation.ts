
import { useState } from "react";
import { availableFields } from "../fieldDefinitions";
import { FieldMapping } from "../types";

export function useFieldValidation() {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateMappings = (fieldMappings: FieldMapping) => {
    const errors: string[] = [];
    
    // Check that required fields are mapped
    const requiredFields = availableFields.filter(f => f.required);
    
    for (const field of requiredFields) {
      const isMapped = Object.entries(fieldMappings).some(mapping => 
        mapping[1] === `${field.table}.${field.dbField}`
      );
      
      if (!isMapped) {
        errors.push(`Required field "${field.table}.${field.dbField}" is not mapped`);
      }
    }
    
    // Specifically check for email field as it's critical for client import
    const emailIsMapped = Object.entries(fieldMappings).some(
      ([_, value]) => value === 'clients.email'
    );
    
    if (!emailIsMapped) {
      errors.push('Email field is required for client import but was not mapped');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  return {
    validationErrors,
    validateMappings
  };
}
