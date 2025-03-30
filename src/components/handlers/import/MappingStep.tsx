
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, InfoCircle, Info } from "lucide-react";
import { FieldMappingPanel } from "./FieldMappingPanel";
import { availableFields } from "./fieldDefinitions";
import { FieldMapping } from "./types";

interface MappingStepProps {
  csvHeaders: string[];
  fieldMappings: FieldMapping;
  onFieldMappingChange: (csvHeader: string, dbField: string) => void;
  validationErrors: string[];
}

export function MappingStep({ 
  csvHeaders, 
  fieldMappings, 
  onFieldMappingChange, 
  validationErrors 
}: MappingStepProps) {
  // Check if email is mapped
  const emailIsMapped = Object.entries(fieldMappings).some(
    ([_, value]) => value === 'clients.email'
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">
        Map your CSV headers to database fields. Required fields are marked with *.
      </p>
      
      {!emailIsMapped && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700">Important: Email Required</AlertTitle>
          <AlertDescription className="text-amber-600">
            The email field must be mapped for client import to work correctly.
            Please map a CSV column to the clients.email field.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="clients">
        <TabsList className="mb-4">
          <TabsTrigger value="clients">Handler Data</TabsTrigger>
          <TabsTrigger value="dogs">Dog Data</TabsTrigger>
          <TabsTrigger value="class_enrollments">Class Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients" className="space-y-4">
          <FieldMappingPanel
            fields={availableFields.filter(f => f.table === "clients")}
            csvHeaders={csvHeaders}
            fieldMappings={fieldMappings}
            onMappingChange={onFieldMappingChange}
          />
        </TabsContent>
        
        <TabsContent value="dogs" className="space-y-4">
          <FieldMappingPanel
            fields={availableFields.filter(f => f.table === "dogs")}
            csvHeaders={csvHeaders}
            fieldMappings={fieldMappings}
            onMappingChange={onFieldMappingChange}
          />
        </TabsContent>
        
        <TabsContent value="class_enrollments" className="space-y-4">
          <FieldMappingPanel
            fields={availableFields.filter(f => f.table === "class_enrollments")}
            csvHeaders={csvHeaders}
            fieldMappings={fieldMappings}
            onMappingChange={onFieldMappingChange}
          />
        </TabsContent>
      </Tabs>
      
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-5">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
