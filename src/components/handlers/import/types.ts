
export type MappingField = {
  csvHeader: string;
  dbField: string;
  table: string;
  required: boolean;
  description?: string;
  dataType?: 'text' | 'date' | 'boolean' | 'number';
};

export type FieldMapping = Record<string, string>;

export type PreferenceField = {
  name: string;
  column: string;
  description: string;
};
