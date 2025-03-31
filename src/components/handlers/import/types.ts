
export type MappingField = {
  csvHeader: string;
  dbField: string;
  table: string;
  required: boolean;
  description?: string;
  dataType?: 'text' | 'date' | 'boolean' | 'number';
};

export type FieldMapping = Record<string, string>;

export interface ImportResult {
  success: boolean;
  processed: number;
  total: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  message: string;
}

export interface ProcessingStatus {
  total: number;
  processed: number;
  errors: ImportError[];
}
