
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Import } from "lucide-react";
import { useImportData } from "./import/useImportData";
import { UploadStep } from "./import/UploadStep";
import { MappingStep } from "./import/MappingStep";
import { ReviewStep } from "./import/ReviewStep";

export function ImportHandlersModal() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const {
    csvFile,
    csvHeaders,
    csvData,
    isUploading,
    fieldMappings,
    validationErrors,
    handleFileChange,
    handleMapField,
    validateMappings,
    processImport
  } = useImportData();

  const handleNext = () => {
    if (currentStep === 2) {
      if (validateMappings()) {
        setCurrentStep(3);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleImport = async () => {
    const result = await processImport();
    if (result.success) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-2">
          <Import className="h-4 w-4 mr-2" />
          Import Handlers
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Import Handlers from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="flex justify-between mb-6">
            <div className="flex space-x-4">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep >= 1 ? 'bg-mckaynine-600 text-white' : 'bg-gray-200'}`}>1</div>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep >= 2 ? 'bg-mckaynine-600 text-white' : 'bg-gray-200'}`}>2</div>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep >= 3 ? 'bg-mckaynine-600 text-white' : 'bg-gray-200'}`}>3</div>
            </div>
            <div className="text-sm text-gray-500">
              {currentStep === 1 && "Upload CSV File"}
              {currentStep === 2 && "Map Fields"}
              {currentStep === 3 && "Review & Import"}
            </div>
          </div>
          
          {currentStep === 1 && (
            <UploadStep onFileChange={handleFileChange} />
          )}
          
          {currentStep === 2 && (
            <MappingStep 
              csvHeaders={csvHeaders}
              fieldMappings={fieldMappings}
              onFieldMappingChange={handleMapField}
              validationErrors={validationErrors}
            />
          )}
          
          {currentStep === 3 && (
            <ReviewStep 
              csvData={csvData}
              fieldMappings={fieldMappings}
            />
          )}
          
          <div className="mt-6 flex justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={isUploading}>
                Back
              </Button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 3 ? (
              <Button 
                onClick={handleNext} 
                disabled={currentStep === 1 && !csvFile}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleImport} 
                disabled={isUploading}
              >
                {isUploading ? "Importing..." : "Import Data"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
