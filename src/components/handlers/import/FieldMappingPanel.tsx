
import { MappingField, FieldMapping } from "./types";

interface FieldMappingPanelProps {
  fields: MappingField[];
  csvHeaders: string[];
  fieldMappings: FieldMapping;
  onMappingChange: (csvHeader: string, dbField: string) => void;
}

export function FieldMappingPanel({ 
  fields, 
  csvHeaders, 
  fieldMappings, 
  onMappingChange 
}: FieldMappingPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(field => (
        <div key={`${field.table}-${field.dbField}`} className="border rounded-md p-3">
          <label className="block text-sm font-medium mb-1">
            {field.dbField} {field.required && <span className="text-red-500">*</span>}
            {field.description && <span className="text-xs text-gray-500 ml-1">({field.description})</span>}
          </label>
          <select 
            className="w-full border-gray-300 rounded-md"
            value={Object.entries(fieldMappings).find(([_, value]) => value === `${field.table}.${field.dbField}`)?.[0] || ""}
            onChange={(e) => {
              const dbFieldPath = `${field.table}.${field.dbField}`;
              
              // If value is empty, user is removing a mapping
              if (!e.target.value) {
                // Find if this field is already mapped
                const existingHeader = Object.entries(fieldMappings)
                  .find(([_, value]) => value === dbFieldPath)?.[0];
                
                // If found, remove it
                if (existingHeader) {
                  onMappingChange(existingHeader, "");
                }
                return;
              }
              
              // Set the new mapping
              onMappingChange(e.target.value, dbFieldPath);
            }}
          >
            <option value="">-- Select CSV header --</option>
            {csvHeaders.map(header => {
              // Find if this header is already mapped to a different field
              const isMappedToOther = fieldMappings[header] && 
                                      fieldMappings[header] !== `${field.table}.${field.dbField}`;
              
              return (
                <option key={header} value={header} disabled={isMappedToOther}>
                  {header}{isMappedToOther ? ' (already mapped)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      ))}
    </div>
  );
}
