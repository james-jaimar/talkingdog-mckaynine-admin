
export type MappingField = {
  csvHeader: string;
  dbField: string;
  table: string;
  required: boolean;
  description?: string;
};

export type FieldMapping = Record<string, string>;
