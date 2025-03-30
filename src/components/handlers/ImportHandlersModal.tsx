
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Import, ArrowRight, ArrowLeft } from "lucide-react";
import { useImportData } from "./import/useImportData";
import { UploadStep } from "./import/UploadStep";
import { MappingStep } from "./import/MappingStep";
import { ReviewStep } from "./import/ReviewStep";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";

export function ImportHandlersModal() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { currentBranch } = useBranch();
  
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
      const isValid = validateMappings(fieldMappings);
      if (isValid) {
        setCurrentStep(3);
      } else {
        toast({
          title: "Validation errors",
          description: "Please fix the validation errors before proceeding",
          variant: "destructive"
        });
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const handleReset = () => {
    setCurrentStep(1);
  };

  const handleImport = async () => {
    if (!csvData || csvData.length === 0) {
      toast({
        title: "No data to import",
        description: "Please upload a CSV file with data",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("Starting import process...");
      console.log("CSV Data:", csvData.length, "records");
      console.log("Field Mappings:", fieldMappings);
      console.log("Branch ID:", currentBranch?.id);
      
      const result = await processImport(csvData, fieldMappings, currentBranch?.id);
      console.log("Import result:", result);
      
      if (result.success) {
        toast({
          title: "Import successful",
          description: `Imported ${csvData.length} handlers successfully${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}.`,
          variant: "default"
        });
        setOpen(false);
        // Reset for next import
        handleReset();
      } else {
        toast({
          title: "Import failed",
          description: `Failed to import data: ${result.errors.join(", ")}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        // Reset when dialog is closed
        handleReset();
      }
      setOpen(newOpen);
    }}>
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
            <UploadStep onFileChange={handleFileChange} currentFile={csvFile} />
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
              branchName={currentBranch?.name}
            />
          )}
          
          <div className="mt-6 flex justify-between">
            {currentStep > 1 ? (
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={isUploading}
                type="button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 3 ? (
              <Button 
                onClick={handleNext} 
                disabled={currentStep === 1 && !csvFile}
                type="button"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleImport} 
                disabled={isUploading}
                type="button"
                variant="mckaynine"
                className="px-6 py-2"
              >
                {isUploading ? "Importing..." : "Import Data"}
                <Import className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
