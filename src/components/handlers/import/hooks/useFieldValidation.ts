
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

  return {
    validationErrors,
    validateMappings
  };
}
