
import { useCSVFileUpload } from "./hooks/useCSVFileUpload";
import { useFieldValidation } from "./hooks/useFieldValidation";
import { useDataImport } from "./hooks/useDataImport";

export function useImportData() {
  const {
    csvFile,
    csvHeaders,
    csvData,
    fieldMappings,
    handleFileChange,
    handleMapField
  } = useCSVFileUpload();
  
  const {
    validationErrors,
    validateMappings
  } = useFieldValidation();
  
  const {
    isUploading,
    processImport
  } = useDataImport();

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
    processImport: () => processImport(csvData, fieldMappings)
  };
}
