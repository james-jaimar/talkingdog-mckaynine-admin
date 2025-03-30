
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
    <div className="grid grid-cols-2 gap-4">
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
              // Remove any existing mapping for this database field
              const existingHeaderForField = Object.entries(fieldMappings)
                .find(([_, value]) => value === `${field.table}.${field.dbField}`)?.[0];
              
              if (existingHeaderForField) {
                onMappingChange(existingHeaderForField, "");
              }
              
              // Add new mapping if a header is selected
              if (e.target.value) {
                onMappingChange(e.target.value, `${field.table}.${field.dbField}`);
              }
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
  );
}
